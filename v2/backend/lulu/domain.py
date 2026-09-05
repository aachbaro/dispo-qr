"""Scheduling rules, independent of HTTP and storage. All durations are in minutes."""
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta
from uuid import uuid4

STATES = {"available", "prefer_not", "unavailable", "unknown"}
SKILLS = {"salle", "plonge", "cuisine", "cles", "ouverture", "fermeture"}
PREFS = {"weekends", "split", "compact", "evenings", "lunches", "stable", "variety"}


def uid():
    return uuid4().hex[:12]


def monday(value):
    day = date.fromisoformat(value)
    return (day - timedelta(days=day.weekday())).isoformat()


def clock(value):
    return datetime.strptime(value, "%H:%M").hour * 60 + datetime.strptime(value, "%H:%M").minute


def duration(shift):
    return max(0, (clock(shift["end"]) - clock(shift["start"])) % 1440 - 30)


def interval(shift):
    start = date.fromisoformat(shift["date"]).toordinal() * 1440 + clock(shift["start"])
    end = start + (clock(shift["end"]) - clock(shift["start"])) % 1440
    return start, end


def key(shift):
    return f'{date.fromisoformat(shift["date"]).weekday()}|{shift["service"]}|{shift["role"]}|{shift["start"]}|{shift["end"]}|{",".join(sorted(shift["required"]))}'


def qualified(employee, shift):
    return employee["active"] and {shift["role"], *shift["required"]}.issubset(employee["skills"])


def fixed_rows(week, employees):
    rows = []
    for employee in employees:
        if not employee["active"]:
            continue
        for index, fixed in enumerate(employee["fixedShifts"]):
            day = (date.fromisoformat(week) + timedelta(days=fixed["day"])).isoformat()
            rows.append({"id": f'fixed-{employee["id"]}-{index}', "date": day,
                         "service": fixed["service"], "role": "cuisine", "start": fixed["start"],
                         "end": fixed["end"], "count": 1, "required": [], "fixed": True,
                         "assignments": [{"employeeId": employee["id"], "locked": True}]})
    return rows


def new_week(value, employees):
    shifts = []
    for offset in range(7):
        day = date.fromisoformat(value) + timedelta(days=offset)
        variants = [("midi", "salle", "10:00", "19:00" if offset > 4 else "15:30", 1, ["ouverture"]),
                    ("midi", "salle", "11:00", "19:00" if offset > 4 else "15:30", 1, []),
                    ("midi", "salle", "11:00", "19:00" if offset > 4 else "15:30", 1, []),
                    ("soir", "salle", "18:30", "00:00" if offset in (4, 5) else "23:00", 1, ["fermeture"]),
                    ("soir", "salle", "18:30", "00:00" if offset in (4, 5) else "23:00", 1, []),
                    ("soir", "plonge", "18:30", "00:00" if offset in (4, 5) else "23:00", 1, [])]
        if offset > 4:
            variants += [("midi", "salle", "11:00", "17:00", 1, []), ("midi", "plonge", "11:00", "17:00", 1, [])]
        for service, role, start, end, count, required in variants:
            # Stable IDs let the first manual assignment target a suggested week
            # before it has been persisted. Edited/copied variants use random IDs.
            shifts.append({"id": f"{day.isoformat()}-{len(shifts)}", "date": day.isoformat(), "service": service, "role": role,
                           "start": start, "end": end, "count": count, "required": required,
                           "assignments": [], "fixed": False})
    return {"start": value, "label": "", "status": "draft", "shifts": shifts + fixed_rows(value, employees),
            "availability": {}, "published": None}


def availability(week, employee):
    return week["availability"].get(str(employee["id"]), {
        "values": employee["defaults"].get("values", {}),
        "preferences": employee["defaults"].get("preferences", {}),
        "confirmed": False, "allAvailable": False,
    })


def state_for(week, employee, shift):
    av = availability(week, employee)
    return av.get("values", {}).get(key(shift), "available" if av.get("allAvailable") else "unknown")


def conflicts(employee, shift, existing, rules):
    reasons = []
    if not qualified(employee, shift):
        reasons.append("Compétence manquante")
    start, end = interval(shift)
    hours = duration(shift)
    days = {shift["date"]}
    week_start = monday(shift["date"])
    week_hours = hours
    for other in existing:
        a, b = interval(other)
        if shift["date"] == other["date"]:
            hours += duration(other)
            if shift["service"] == other["service"]:
                reasons.append("Déjà affecté à ce service")
        if start < b and a < end:
            reasons.append("Chevauchement horaire")
        elif shift["date"] != other["date"] and min(abs(start - b), abs(a - end)) < rules["minRestHours"] * 60:
            reasons.append("Repos entre deux journées insuffisant")
        if monday(other["date"]) == week_start:
            week_hours += duration(other)
            days.add(other["date"])
    if hours > rules["maxDailyHours"] * 60:
        reasons.append("Maximum journalier dépassé")
    if week_hours > rules["maxWeeklyHours"] * 60:
        reasons.append("Maximum hebdomadaire dépassé")
    if len(days) > rules["maxDaysPerWeek"]:
        reasons.append("Trop de jours travaillés")
    return list(dict.fromkeys(reasons))


def all_assignments(weeks):
    result = defaultdict(list)
    for week in weeks:
        for shift in week["shifts"]:
            for assignment in shift["assignments"]:
                result[assignment["employeeId"]].append(shift)
    return result


def audit(weeks, employees, rules):
    staff = {e["id"]: e for e in employees}
    booked = all_assignments(weeks)
    issues = []
    for week in weeks:
        for employee in employees:
            if employee["active"] and "cuisine" in employee["skills"] and not employee["fixedShifts"]:
                issues.append({"week": week["start"], "shiftId": "setup", "date": week["start"], "service": "cuisine", "severity": "error", "message": f'{employee["name"]} : horaires fixes de cuisine à renseigner dans Équipe'})
        for shift in week["shifts"]:
            base = {"week": week["start"], "shiftId": shift["id"], "date": shift["date"], "service": shift["service"]}
            missing = shift["count"] - len(shift["assignments"])
            if missing > 0:
                issues.append({**base, "severity": "error", "message": f'{missing} poste(s) {shift["role"]} à pourvoir'})
            for assignment in shift["assignments"]:
                employee = staff[assignment["employeeId"]]
                for reason in conflicts(employee, shift, [s for s in booked[employee["id"]] if s is not shift], rules):
                    issues.append({**base, "severity": "error", "message": f'{employee["name"]} : {reason}'})
                if shift.get("fixed"):
                    continue
                status = state_for(week, employee, shift)
                av = availability(week, employee)
                if status == "unavailable":
                    issues.append({**base, "severity": "error", "message": f'{employee["name"]} : indisponible'})
                elif status == "unknown" or not av.get("confirmed"):
                    issues.append({**base, "severity": "error", "message": f'{employee["name"]} : disponibilités à confirmer'})
                elif status == "prefer_not":
                    issues.append({**base, "severity": "warning", "message": f'{employee["name"]} : préférence de disponibilité non respectée'})
    return issues


def generate(selected, all_weeks, employees, rules):
    """Deterministic greedy proposal: scarce shifts first, then hours and preferences.

    This is a heuristic, not a proof that an unfilled slot cannot be filled.
    Published versions are immutable snapshots until the next explicit publication.
    """
    for week in selected:
        for shift in week["shifts"]:
            if not shift.get("fixed"):
                shift["assignments"] = [a for a in shift["assignments"] if a["locked"]]
        week["status"] = "draft"
    booked = all_assignments(all_weeks)
    staff = {e["id"]: e for e in employees}
    selected_dates = { (date.fromisoformat(w["start"]) + timedelta(days=i)).isoformat() for w in selected for i in range(7) }
    totals = Counter({eid: sum(duration(s) for s in shifts if s["date"] in selected_dates) for eid, shifts in booked.items()})
    pairs = Counter()
    for week in all_weeks:
        for day in range(7):
            for service in ("midi", "soir"):
                ids = sorted({a["employeeId"] for s in week["shifts"] if date.fromisoformat(s["date"]).weekday() == day and s["service"] == service for a in s["assignments"]})
                for i, eid in enumerate(ids):
                    for other in ids[i+1:]:
                        pairs[tuple(sorted((eid, other)))] += 1

    def eligible(week, shift):
        return [e for e in employees if "cuisine" not in e["skills"] and qualified(e, shift)
                and (availability(week, e).get("confirmed") or e.get("defaults", {}).get("values"))
                and state_for(week, e, shift) in {"available", "prefer_not"}]

    tasks = [(week, shift) for week in selected for shift in week["shifts"] if not shift.get("fixed")]
    tasks.sort(key=lambda pair: (len(eligible(*pair)) - pair[1]["count"], pair[1]["date"], pair[1]["start"]))
    compromises = []
    for week, shift in tasks:
        for _ in range(shift["count"] - len(shift["assignments"])):
            candidates = [e for e in eligible(week, shift) if not conflicts(e, shift, booked[e["id"]], rules)]
            if not candidates:
                break
            coworkers = {a["employeeId"] for s in week["shifts"] if s["date"] == shift["date"] and s["service"] == shift["service"] for a in s["assignments"]}

            def score(e):
                av = availability(week, e)
                pref = av.get("preferences", {})
                eid = e["id"]
                target = max(e["weeklyHours"] * len(selected) * 60, 60)
                cost = (totals[eid] + duration(shift)) / target * 100
                same_day = any(s["date"] == shift["date"] for s in booked[eid])
                cost += pref.get("weekends", 0) * 14 * (date.fromisoformat(shift["date"]).weekday() >= 5)
                cost += pref.get("split", 0) * 16 * same_day
                cost -= pref.get("compact", 0) * 12 * same_day
                cost += pref.get("evenings" if shift["service"] == "soir" else "lunches", 0) * 16
                cost += (pref.get("variety", 1)) * sum(pairs[tuple(sorted((eid, other)))] for other in coworkers) * 3
                if any(key(s) == key(shift) and s["date"] != shift["date"] for s in booked[eid]):
                    cost -= pref.get("stable", 0) * 15
                week_minutes = sum(duration(s) for s in booked[eid] if monday(s["date"]) == week["start"])
                desired = max(1, e["weeklyHours"] + pref.get("hoursDelta", 0)) * 60
                cost += week_minutes / desired * 30
                return (state_for(week, e, shift) == "prefer_not", cost, eid)

            chosen = min(candidates, key=score)
            eid = chosen["id"]
            shift["assignments"].append({"employeeId": eid, "locked": False})
            booked[eid].append(shift)
            totals[eid] += duration(shift)
            for other in coworkers:
                pairs[tuple(sorted((eid, other)))] += 1
            pref = availability(week, chosen).get("preferences", {})
            if (pref.get("weekends", 0) and date.fromisoformat(shift["date"]).weekday() >= 5
                    or pref.get("evenings" if shift["service"] == "soir" else "lunches", 0)
                    or pref.get("split", 0) and any(s is not shift and s["date"] == shift["date"] for s in booked[eid])):
                compromises.append({"week": week["start"], "shiftId": shift["id"], "date": shift["date"], "service": shift["service"], "severity": "warning", "message": f'{staff[eid]["name"]} : préférence de répartition non respectée'})
    return compromises
