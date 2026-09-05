import copy
import hashlib
import secrets
from datetime import date, timedelta
from pathlib import Path
from types import SimpleNamespace

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.db import transaction
from django.utils import timezone
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.exceptions import APIException, AuthenticationFailed, PermissionDenied, ValidationError
from rest_framework.response import Response

from .domain import (PREFS, SKILLS, STATES, audit, availability, clock, conflicts,
                     fixed_rows, generate, key, monday, new_week, qualified, uid, all_assignments)
from .models import Board, Employee, Session

DEFAULT_RULES = {"maxDailyHours": 10, "maxWeeklyHours": 48, "minRestHours": 11, "maxDaysPerWeek": 6}


class Conflict(APIException):
    status_code = 409
    default_detail = "Le planning a changé. Rechargez la page avant de réessayer."


def employee_data(e):
    return {"id": e.id, "name": e.name, "manager": e.manager, "active": e.active,
            "weeklyHours": e.weekly_hours, "skills": e.skills, "defaults": e.defaults, "fixedShifts": e.fixed_shifts}


def current(request):
    token = request.headers.get("Authorization", "").removeprefix("Lulu ")
    session = Session.objects.select_related("employee").filter(
        digest=hashlib.sha256(token.encode()).hexdigest(), expires_at__gt=timezone.now(), employee__active=True).first()
    if not session:
        raise AuthenticationFailed("Session expirée. Reconnectez-vous avec votre PIN.")
    return session.employee


def init_data(board):
    data = copy.deepcopy(board.data)
    for name, default in {"weeks": {}, "templates": {}, "notifications": [], "rules": DEFAULT_RULES}.items():
        data.setdefault(name, copy.deepcopy(default))
    return data


def apply_weekday_defaults(week, weekday_shifts):
    """Replace non-fixed shifts with stored weekday templates when a new week is generated."""
    if not weekday_shifts:
        return
    for offset in range(7):
        wd = str(offset)
        if wd not in weekday_shifts:
            continue
        day = (date.fromisoformat(week["start"]) + timedelta(days=offset)).isoformat()
        week["shifts"] = [s for s in week["shifts"] if s["date"] != day or s.get("fixed")]
        for tmpl in weekday_shifts[wd]:
            week["shifts"].append({
                "id": uid(), "date": day,
                "service": tmpl["service"], "role": tmpl["role"],
                "start": tmpl["start"], "end": tmpl["end"],
                "count": 1, "required": list(tmpl.get("required", [])),
                "assignments": [], "fixed": False,
            })


def notify(data, ids, message):
    now = timezone.now().isoformat()
    data["notifications"].extend({"id": uid(), "employeeId": eid, "message": message, "createdAt": now, "read": False} for eid in set(ids))
    data["notifications"] = data["notifications"][-2000:]


def week_date(value):
    try:
        parsed = date.fromisoformat(value)
        if parsed.weekday() or not 2020 <= parsed.year <= 2100:
            raise ValueError()
        return parsed.isoformat()
    except (ValueError, TypeError):
        raise ValidationError("La semaine doit commencer un lundi (AAAA-MM-JJ).")


def number(value, minimum, maximum, integer=False):
    if isinstance(value, bool) or not isinstance(value, (float, int)) or not minimum <= value <= maximum:
        raise ValidationError(f"Valeur attendue entre {minimum} et {maximum}.")
    if integer and int(value) != value:
        raise ValidationError("Un nombre entier est attendu.")
    return int(value) if integer else value


def text_value(value, length=80):
    if not isinstance(value, str) or not value.strip() or len(value) > length:
        raise ValidationError("Texte manquant ou trop long.")
    return value.strip()


def validate_times(row):
    try:
        for field in ("start", "end"):
            if not isinstance(row[field], str) or len(row[field]) != 5:
                raise ValueError()
            clock(row[field])
        minutes = (clock(row["end"]) - clock(row["start"])) % 1440
        if not 30 < minutes <= 960:
            raise ValueError()
    except (ValueError, TypeError, KeyError):
        raise ValidationError("Horaires invalides : durée comprise entre 30 minutes et 16 heures.")
    if not isinstance(row.get("service"), str) or row["service"] not in {"midi", "soir"}:
        raise ValidationError("Service invalide.")


def validated_av(value):
    if not isinstance(value, dict) or not isinstance(value.get("values", {}), dict) or not isinstance(value.get("preferences", {}), dict):
        raise ValidationError("Disponibilités invalides.")
    values = value.get("values", {})
    if len(values) > 500 or any(not isinstance(k, str) or len(k) > 150 or not isinstance(v, str) or v not in STATES for k, v in values.items()):
        raise ValidationError("Disponibilités invalides.")
    prefs = value.get("preferences", {})
    if set(prefs) - (PREFS | {"hoursDelta"}):
        raise ValidationError("Préférence inconnue.")
    for name, level in prefs.items():
        number(level, -35 if name == "hoursDelta" else 0, 35 if name == "hoursDelta" else 2, True)
    return {"values": values, "preferences": prefs, "confirmed": value.get("confirmed") is True,
            "allAvailable": value.get("allAvailable") is True}


def snapshot(board, viewer, requested):
    data = init_data(board)
    employees = [employee_data(e) for e in Employee.objects.all().order_by("id")]
    me = next((e for e in employees if e["id"] == viewer.id), {"id": 0, "name": "Administrateur", "manager": True, "active": True, "weeklyHours": 0, "skills": [], "defaults": {}, "fixedShifts": []})
    weekday_shifts = data.get("weekday_shifts", {})
    for value in requested:
        if value not in data["weeks"]:
            w = new_week(value, employees)
            apply_weekday_defaults(w, weekday_shifts)
            data["weeks"][value] = w
    weeks = copy.deepcopy(data["weeks"])
    for week in weeks.values():
        week["prepared"] = week["start"] in board.data.get("weeks", {})
        week["mine"] = availability(week, me)
        week["confirmation"] = {str(e["id"]): availability(week, e).get("confirmed", False) for e in employees}
        if not viewer.manager:
            # Employees see requirements to fill availability, but never draft assignments.
            for shift in week["shifts"]:
                shift["assignments"] = []
            week.pop("availability", None)
            week.pop("confirmation", None)
            week.pop("generationWarnings", None)
    return {"revision": board.revision, "me": me, "employees": employees if viewer.manager else [
                {k: e[k] for k in ("id", "name", "skills", "active")} for e in employees],
            "weeks": weeks, "rules": data["rules"], "templates": data["templates"] if viewer.manager else {},
            "notifications": [n for n in data["notifications"] if n["employeeId"] == viewer.id],
            "issues": audit(list(data["weeks"].values()), employees, data["rules"]) if viewer.manager else [],
            "generationReports": data.get("generationReports", []) if viewer.manager else []}


@api_view(["GET"])
@authentication_classes([])
@permission_classes([])
def people(request):
    return Response({"employees": list(Employee.objects.filter(active=True).values("id", "name"))})


@api_view(["POST"])
@authentication_classes([])
@permission_classes([])
def login(request):
    eid = request.data.get("employeeId")
    pin = request.data.get("pin", "")
    if not isinstance(eid, int) or not isinstance(pin, str) or len(pin) > 12:
        raise ValidationError("Nom ou PIN invalide.")
    with transaction.atomic():
        employee = Employee.objects.select_for_update().filter(id=eid, active=True).first()
        now = timezone.now()
        if employee and employee.blocked_until and employee.blocked_until > now:
            return Response({"detail": "Trop de tentatives. Réessayez dans 15 minutes."}, status=429)
        valid = check_password(pin, employee.pin_hash if employee else make_password("invalid"))
        if not employee or not valid:
            if employee:
                employee.failed_attempts += 1
                if employee.failed_attempts >= 5:
                    employee.blocked_until = now + timedelta(minutes=15)
                    employee.failed_attempts = 0
                employee.save(update_fields=["failed_attempts", "blocked_until"])
            return Response({"detail": "Nom ou PIN incorrect."}, status=401)
        employee.failed_attempts = 0
        employee.blocked_until = None
        employee.save(update_fields=["failed_attempts", "blocked_until"])
        token = secrets.token_urlsafe(32)
        Session.objects.filter(expires_at__lt=now).delete()
        Session.objects.create(employee=employee, digest=hashlib.sha256(token.encode()).hexdigest(), expires_at=now + timedelta(hours=12))
    return Response({"token": token})


@api_view(["POST"])
@authentication_classes([])
@permission_classes([])
def logout(request):
    token = request.headers.get("Authorization", "").removeprefix("Lulu ")
    Session.objects.filter(digest=hashlib.sha256(token.encode()).hexdigest()).delete()
    return Response({"ok": True})


@api_view(["GET", "POST"])
@authentication_classes([])
@permission_classes([])
def board_view(request):
    return handle_board(request, current(request))


@api_view(["GET", "POST"])
@authentication_classes([])
@permission_classes([])
def developer_board(request):
    auth = request.headers.get("Authorization", "")
    key = auth.removeprefix("LuluAdmin ")
    path = Path(getattr(settings, "LULU_ADMIN_KEY_FILE", settings.BASE_DIR / ".lulu-admin-key"))
    digest = path.read_text(encoding="utf-8").strip() if path.is_file() else ""
    if not auth.startswith("LuluAdmin ") or len(key) > 128 or not digest or not check_password(key, digest):
        raise AuthenticationFailed("Clé d’accès développeur incorrecte ou accès non initialisé.")
    return handle_board(request, SimpleNamespace(id=0, name="Administrateur", manager=True), developer=True)


def handle_board(request, viewer, developer=False):
    requested = week_date(request.query_params.get("week", monday(date.today().isoformat())))
    board, _ = Board.objects.get_or_create(pk=1)
    if request.method == "GET":
        return Response(snapshot(board, viewer, [requested]))
    payload = request.data
    if not isinstance(payload, dict) or not isinstance(payload.get("action"), str):
        raise ValidationError("Action invalide.")
    action = payload.get("action")
    if developer and action != "test_preferences":
        raise PermissionDenied("Cette page admin est réservée aux préférences de test.")
    if action == "test_preferences" and not developer:
        raise PermissionDenied("Un accès développeur est requis.")
    if action not in {"availability", "read", "pin"} and not viewer.manager:
        raise PermissionDenied("Cette action est réservée à Jean-Sébastien.")
    with transaction.atomic():
        board = Board.objects.select_for_update().get(pk=1)
        if payload.get("revision") != board.revision:
            raise Conflict()
        data = init_data(board)
        employees = [employee_data(e) for e in Employee.objects.all().order_by("id")]
        staff = {e["id"]: e for e in employees}
        managers = [e["id"] for e in employees if e["manager"] and e["active"]]
        week_start = week_date(payload.get("week", requested))
        if week_start not in data["weeks"]:
            w = new_week(week_start, employees)
            apply_weekday_defaults(w, data.get("weekday_shifts", {}))
            data["weeks"][week_start] = w
        week = data["weeks"][week_start]

        if action == "availability":
            av = validated_av(payload.get("availability"))
            me = staff[viewer.id]
            allowed = {key(s) for s in week["shifts"] if not s.get("fixed") and qualified(me, s)}
            # Recurring values may include variants absent from this week's needs.
            inherited = set(viewer.defaults.get("values", {})) | set(availability(week, me).get("values", {}))
            if set(av["values"]) - allowed - inherited:
                raise ValidationError("Une disponibilité vise un shift non accessible.")
            if av["confirmed"]:
                relevant = [s for s in week["shifts"] if not s.get("fixed") and qualified(me, s)]
                if any(av["values"].get(key(s), "available" if av["allAvailable"] else "unknown") == "unknown" for s in relevant):
                    raise ValidationError("Renseignez tous vos shifts ou cochez « disponible pour les autres shifts ».")
            previous = availability(week, me)
            week["availability"][str(viewer.id)] = av
            if payload.get("saveDefaults"):
                viewer.defaults = {"values": av["values"], "preferences": av["preferences"]}
                viewer.save(update_fields=["defaults"])
            if av["confirmed"] or previous.get("confirmed"):
                notify(data, managers, f'{viewer.name} a {"confirmé" if av["confirmed"] else "modifié (à reconfirmer)"} ses disponibilités · semaine du {week_start}.')

        elif action == "test_preferences":
            scope = payload.get("scope")
            if scope not in ("week", "defaults"):
                raise ValidationError("Choisissez la semaine ou les préférences habituelles.")
            rows = payload.get("employees")
            if not isinstance(rows, list) or not 1 <= len(rows) <= 100:
                raise ValidationError("Sélectionnez entre 1 et 100 employés.")
            validated = []
            seen = set()
            for row in rows:
                if not isinstance(row, dict):
                    raise ValidationError("Employé invalide.")
                eid = row.get("employeeId")
                if type(eid) is not int or eid not in staff or eid in seen:
                    raise ValidationError("Employé inconnu ou dupliqué.")
                if not staff[eid]["active"] or "cuisine" in staff[eid]["skills"]:
                    raise ValidationError("Les tests concernent les employés actifs hors cuisine fixe.")
                if not isinstance(row.get("preferences"), dict):
                    raise ValidationError("Préférences manquantes.")
                prefs = validated_av({"preferences": row["preferences"]})["preferences"]
                seen.add(eid)
                validated.append((eid, prefs))
            # Validate the whole batch first; no availability, confirmation or
            # assignment is changed by this manager-only preference editor.
            for eid, prefs in validated:
                if scope == "week":
                    av = copy.deepcopy(availability(week, staff[eid]))
                    av["preferences"] = prefs
                    week["availability"][str(eid)] = av
                else:
                    defaults = copy.deepcopy(staff[eid]["defaults"])
                    defaults["preferences"] = prefs
                    Employee.objects.filter(pk=eid).update(defaults=defaults)
            if scope == "defaults" and week_start not in board.data.get("weeks", {}):
                data["weeks"].pop(week_start, None)

        elif action == "read":
            for notification in data["notifications"]:
                if notification["employeeId"] == viewer.id:
                    notification["read"] = True

        elif action == "pin":
            if not check_password(str(payload.get("oldPin", "")), viewer.pin_hash):
                raise ValidationError("Le PIN actuel est incorrect.")
            set_pin(viewer, payload.get("pin"))

        elif action == "employee":
            value = payload.get("employee", {})
            if not isinstance(value, dict):
                raise ValidationError("Employé invalide.")
            existing = value.get("id")
            employee = Employee.objects.filter(id=existing).first() if isinstance(existing, int) else None
            if existing and not employee:
                raise ValidationError("Employé introuvable.")
            if not employee:
                employee = Employee()
            employee.name = text_value(value.get("name"))
            employee.weekly_hours = number(value.get("weeklyHours"), 0, 60)
            skills = value.get("skills", [])
            if not isinstance(skills, list) or any(not isinstance(s, str) or s not in SKILLS for s in skills):
                raise ValidationError("Compétence invalide.")
            employee.skills = list(dict.fromkeys(skills))
            employee.active = value.get("active", True) is True
            if employee.manager and not employee.active:
                raise ValidationError("Le compte responsable doit rester actif.")
            fixed = value.get("fixedShifts", [])
            if not isinstance(fixed, list) or len(fixed) > 14 or (fixed and "cuisine" not in skills):
                raise ValidationError("Les shifts fixes sont réservés aux cuisiniers (14 maximum).")
            cleaned = []
            for row in fixed:
                if not isinstance(row, dict):
                    raise ValidationError("Shift fixe invalide.")
                validate_times(row)
                cleaned.append({"day": number(row.get("day"), 0, 6, True), "service": row["service"], "start": row["start"], "end": row["end"]})
            if len({(r["day"], r["service"]) for r in cleaned}) != len(cleaned):
                raise ValidationError("Un cuisinier ne peut avoir qu'un shift par service et par jour.")
            employee.fixed_shifts = cleaned
            if value.get("pin") or not employee.pk:
                set_pin(employee, value.get("pin"), save=False)
            employee.save()
            if value.get("pin") or not employee.active:
                Session.objects.filter(employee=employee).delete()
            updated_staff = [employee_data(e) for e in Employee.objects.all()]
            for saved in data["weeks"].values():
                saved["shifts"] = [s for s in saved["shifts"] if not s.get("fixed")] + fixed_rows(saved["start"], updated_staff)
                saved["status"] = "draft"

        elif action == "rules":
            rules = payload.get("rules", {})
            data["rules"] = {"maxDailyHours": number(rules.get("maxDailyHours"), 1, 16),
                             "maxWeeklyHours": number(rules.get("maxWeeklyHours"), 1, 84),
                             "minRestHours": number(rules.get("minRestHours"), 0, 24),
                             "maxDaysPerWeek": number(rules.get("maxDaysPerWeek"), 1, 7, True)}

        elif action == "shifts":
            rows = payload.get("shifts", [])
            if not isinstance(rows, list) or len(rows) > 150:
                raise ValidationError("Maximum 150 variantes par semaine.")
            cleaned = []
            old = {s["id"]: s for s in week["shifts"] if not s.get("fixed")}
            for row in rows:
                if not isinstance(row, dict):
                    raise ValidationError("Shift invalide.")
                validate_times(row)
                try:
                    if monday(row["date"]) != week_start:
                        raise ValueError()
                except (ValueError, TypeError, KeyError):
                    raise ValidationError("Le shift doit appartenir à la semaine choisie.")
                if not isinstance(row.get("role"), str) or row["role"] not in {"salle", "plonge"}:
                    raise ValidationError("Rôle invalide.")
                required = row.get("required", [])
                if not isinstance(required, list) or any(not isinstance(s, str) or s not in {"cles", "ouverture", "fermeture"} for s in required):
                    raise ValidationError("Exigence invalide.")
                count = number(row.get("count"), 1, 30, True)
                sid = row.get("id") if isinstance(row.get("id"), str) and row["id"] in old else uid()
                original = old.get(sid)
                cleaned.append({"id": sid, "date": row["date"], "start": row["start"], "end": row["end"],
                                "role": row["role"], "service": row["service"], "required": sorted(set(required)),
                                "count": count, "fixed": False, "assignments": original["assignments"][:count] if original else []})
            if len({s["id"] for s in cleaned}) != len(cleaned):
                raise ValidationError("Shift dupliqué.")
            previous_keys = {key(s) for s in old.values()}
            week["shifts"] = cleaned + [s for s in week["shifts"] if s.get("fixed")]
            if {key(s) for s in cleaned} != previous_keys:
                for av in week["availability"].values():
                    av["confirmed"] = False
                notify(data, [e["id"] for e in employees if e["active"] and {"salle", "plonge"}.intersection(e["skills"])], f'Horaires modifiés · semaine du {week_start}. Merci de reconfirmer vos disponibilités.')
            week["status"] = "draft"
            if payload.get("persistWeekday") is True:
                weekday = payload.get("weekday")
                if isinstance(weekday, int) and 0 <= weekday <= 6:
                    day_date = (date.fromisoformat(week_start) + timedelta(days=weekday)).isoformat()
                    day_shifts = [s for s in week["shifts"] if s["date"] == day_date and not s.get("fixed")]
                    data.setdefault("weekday_shifts", {})[str(weekday)] = [
                        {"service": s["service"], "role": s["role"], "start": s["start"], "end": s["end"], "required": list(s["required"])}
                        for s in day_shifts
                    ]

        elif action in {"saveTemplate", "applyTemplate", "copyWeek"}:
            if action == "saveTemplate":
                name = text_value(payload.get("name"), 30)
                data["templates"][name] = [{**s, "assignments": [], "day": date.fromisoformat(s["date"]).weekday()} for s in week["shifts"] if not s.get("fixed")]
                week["label"] = name
            else:
                if action == "copyWeek":
                    source = data["weeks"].get(week_date(payload.get("source")))
                    if not source:
                        raise ValidationError("Semaine source introuvable.")
                    rows = [{**s, "day": date.fromisoformat(s["date"]).weekday()} for s in source["shifts"] if not s.get("fixed")]
                else:
                    name = payload.get("name")
                    if not isinstance(name, str) or name not in data["templates"]:
                        raise ValidationError("Modèle introuvable.")
                    rows = data["templates"][name]
                    week["label"] = name
                week["shifts"] = [{**r, "id": uid(), "date": (date.fromisoformat(week_start) + timedelta(days=r["day"])).isoformat(), "assignments": []} for r in rows] + fixed_rows(week_start, employees)
                for av in week["availability"].values():
                    av["confirmed"] = False
                week["status"] = "draft"
                notify(data, [e["id"] for e in employees if e["active"]], f'Besoins mis à jour · semaine du {week_start}. Disponibilités à confirmer.')

        elif action == "generate":
            count = number(payload.get("count", 4), 1, 6, True)
            selected = []
            wd_shifts = data.get("weekday_shifts", {})
            for offset in range(count):
                start = (date.fromisoformat(week_start) + timedelta(weeks=offset)).isoformat()
                if start not in data["weeks"]:
                    w = new_week(start, employees)
                    apply_weekday_defaults(w, wd_shifts)
                    data["weeks"][start] = w
                selected.append(data["weeks"][start])
            warnings, gen_report = generate(selected, list(data["weeks"].values()), employees, data["rules"])
            for saved in selected:
                saved["generationWarnings"] = [w for w in warnings if w["week"] == saved["start"]]
            gen_report["at"] = timezone.now().isoformat()
            gen_report["weeks"] = [w["start"] for w in selected]
            reports = data.setdefault("generationReports", [])
            reports.insert(0, gen_report)
            data["generationReports"] = reports[:5]

        elif action == "assign":
            shift = next((s for s in week["shifts"] if s["id"] == payload.get("shiftId") and not s.get("fixed")), None)
            if not shift:
                raise ValidationError("Shift modifiable introuvable.")
            # Optional structure update (times / required skills) in the same call
            if "start" in payload or "end" in payload:
                patch = {**shift, "start": payload.get("start", shift["start"]), "end": payload.get("end", shift["end"])}
                validate_times(patch)
                shift["start"] = patch["start"]
                shift["end"] = patch["end"]
            if "required" in payload:
                req = payload["required"]
                if not isinstance(req, list) or any(not isinstance(r, str) or r not in {"cles", "ouverture", "fermeture"} for r in req):
                    raise ValidationError("Exigence invalide.")
                shift["required"] = sorted(set(req))
            assignments = payload.get("assignments", [])
            if not isinstance(assignments, list) or len(assignments) > shift["count"]:
                raise ValidationError("Trop de personnes sur ce shift.")
            ids = []
            cleaned = []
            booked = all_assignments(list(data["weeks"].values()))
            for item in assignments:
                eid = item.get("employeeId") if isinstance(item, dict) else None
                if not isinstance(eid, int) or eid not in staff or eid in ids:
                    raise ValidationError("Employé invalide ou dupliqué.")
                reasons = conflicts(staff[eid], shift, [s for s in booked[eid] if s is not shift], data["rules"])
                if reasons:
                    raise ValidationError(f'{staff[eid]["name"]} : {", ".join(reasons)}.')
                ids.append(eid)
                cleaned.append({"employeeId": eid, "locked": item.get("locked", True) is True})
            shift["assignments"] = cleaned
            week["status"] = "draft"

        elif action == "publish":
            issues = [i for i in audit(list(data["weeks"].values()), employees, data["rules"]) if i["week"] == week_start and i["severity"] == "error"]
            if issues:
                raise ValidationError({"detail": "Corrigez les postes manquants, conflits et disponibilités non confirmées avant publication.", "issues": issues})
            was_published = bool(week["published"])
            week["published"] = {"shifts": copy.deepcopy(week["shifts"]), "at": timezone.now().isoformat()}
            week["status"] = "published"
            notify(data, [e["id"] for e in employees if e["active"]], f'Planning {"modifié et republié" if was_published else "publié"} · semaine du {week_start}.')

        elif action == "remind":
            ids = [e["id"] for e in employees if e["active"] and {"salle", "plonge"}.intersection(e["skills"]) and not availability(week, e).get("confirmed")]
            notify(data, ids, f'Merci de renseigner et confirmer vos disponibilités · semaine du {week_start}.')

        elif action == "clear":
            for shift in week["shifts"]:
                if not shift.get("fixed"):
                    shift["assignments"] = [a for a in shift["assignments"] if a.get("locked")]
            week["status"] = "draft"

        else:
            raise ValidationError("Action inconnue.")

        updated = Board.objects.filter(pk=board.pk, revision=board.revision).update(data=data, revision=board.revision + 1)
        if not updated:
            raise Conflict()
        board.refresh_from_db()
    return Response(snapshot(board, viewer, [requested]))


def set_pin(employee, pin, save=True):
    if not isinstance(pin, str) or not pin.isascii() or not pin.isdigit() or not 6 <= len(pin) <= 12:
        raise ValidationError("Le PIN doit contenir entre 6 et 12 chiffres.")
    employee.pin_hash = make_password(pin)
    if save:
        employee.save(update_fields=["pin_hash"])
        Session.objects.filter(employee=employee).delete()
