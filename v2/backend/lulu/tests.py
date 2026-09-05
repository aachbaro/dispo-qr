from copy import deepcopy
from datetime import timedelta

from django.contrib.auth.hashers import make_password
from django.utils import timezone
from rest_framework.test import APITestCase

from .domain import audit, duration, generate, key, new_week
from .models import Board, Employee, Session
from .views import DEFAULT_RULES, employee_data


class LuluTests(APITestCase):
    def setUp(self):
        self.manager = Employee.objects.create(name="Jean-Sébastien", manager=True, pin_hash=make_password("937461"), skills=["salle", "ouverture", "fermeture", "cles"])
        self.employee = Employee.objects.create(name="Adam", pin_hash=make_password("182736"), skills=["salle"])
        self.board = Board.objects.create(pk=1)
        self.start = "2026-09-07"

    def login_as(self, employee):
        pin = "937461" if employee == self.manager else "182736"
        response = self.client.post("/api/lulu/login/", {"employeeId": employee.id, "pin": pin}, format="json")
        self.assertEqual(response.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f'Lulu {response.data["token"]}')

    def action(self, action, **values):
        self.board.refresh_from_db()
        return self.client.post(f"/api/lulu/board/?week={self.start}", {"action": action, "week": self.start, "revision": self.board.revision, **values}, format="json")

    def minimal_week(self):
        staff = [employee_data(self.manager), employee_data(self.employee)]
        week = new_week(self.start, staff)
        shift = next(s for s in week["shifts"] if s["start"] == "11:00" and s["date"] == self.start)
        shift["count"] = 1
        week["shifts"] = [shift]
        self.board.data = {"weeks": {self.start: week}}
        self.board.save()
        return week, shift, staff

    def test_authentication_permissions_privacy_and_expiry(self):
        self.assertIn(self.client.get("/api/lulu/board/").status_code, (401, 403))
        self.login_as(self.employee)
        self.assertEqual(self.action("generate").status_code, 403)
        response = self.client.get(f"/api/lulu/board/?week={self.start}")
        self.assertNotIn("weeklyHours", response.data["employees"][0])
        self.assertNotIn("availability", response.data["weeks"][self.start])
        self.assertFalse(any("pin" in k for e in response.data["employees"] for k in e))
        Session.objects.update(expires_at=timezone.now() - timedelta(seconds=1))
        self.assertIn(self.client.get("/api/lulu/board/").status_code, (401, 403))

    def test_pin_lockout_and_no_plaintext_storage(self):
        for _ in range(5):
            response = self.client.post("/api/lulu/login/", {"employeeId": self.employee.id, "pin": "000000"}, format="json")
            self.assertEqual(response.status_code, 401)
        response = self.client.post("/api/lulu/login/", {"employeeId": self.employee.id, "pin": "182736"}, format="json")
        self.assertEqual(response.status_code, 429)
        self.assertNotEqual(self.employee.pin_hash, "182736")

    def test_net_hours_and_correct_closing_times(self):
        week = new_week(self.start, [])
        for s in week["shifts"]:
            if s["service"] == "soir":
                self.assertEqual(s["end"], "00:00" if s["date"] in ("2026-09-11", "2026-09-12") else "23:00")
                self.assertEqual(duration(s), 300 if s["end"] == "00:00" else 240)
        opening = week["shifts"][0]
        self.assertEqual(duration(opening), 300)

    def test_availability_confirmation_defaults_and_notifications(self):
        _, shift, _ = self.minimal_week()
        self.login_as(self.employee)
        response = self.action("availability", availability={"values": {}, "confirmed": True})
        self.assertEqual(response.status_code, 400)
        av = {"values": {key(shift): "prefer_not"}, "preferences": {"split": 2}, "confirmed": True, "allAvailable": False}
        response = self.action("availability", availability=av, saveDefaults=True)
        self.assertEqual(response.status_code, 200)
        self.employee.refresh_from_db()
        self.assertEqual(self.employee.defaults["preferences"]["split"], 2)
        self.board.refresh_from_db()
        self.assertEqual(self.board.data["notifications"][0]["employeeId"], self.manager.id)
        response = self.client.get("/api/lulu/board/?week=2026-09-14")
        next_av = response.data["weeks"]["2026-09-14"]["mine"]
        self.assertFalse(next_av["confirmed"])
        self.assertEqual(next_av["values"][key(shift)], "prefer_not")
        self.assertEqual(response.data["notifications"], [])

    def test_generator_respects_hard_unavailability_and_uses_soft_fallback(self):
        week, shift, staff = self.minimal_week()
        for person in staff:
            week["availability"][str(person["id"])] = {"confirmed": True, "values": {key(shift): "unavailable" if person["manager"] else "prefer_not"}}
        generate([week], [week], staff, DEFAULT_RULES)
        self.assertEqual(shift["assignments"][0]["employeeId"], self.employee.id)
        self.assertTrue(any(i["severity"] == "warning" for i in audit([week], staff, DEFAULT_RULES)))
        week["availability"][str(self.employee.id)]["confirmed"] = False
        generate([week], [week], staff, DEFAULT_RULES)
        self.assertEqual(shift["assignments"], [])

    def test_fixed_cooks_and_locked_assignments_survive_generation(self):
        cook = Employee.objects.create(name="Karan", pin_hash=make_password("182736"), skills=["cuisine"], fixed_shifts=[{"day": 0, "service": "midi", "start": "08:30", "end": "15:30"}])
        staff = [employee_data(self.manager), employee_data(cook)]
        week = new_week(self.start, staff)
        row = week["shifts"][0]
        row["assignments"] = [{"employeeId": self.manager.id, "locked": True}]
        fixed = deepcopy(week["shifts"][-1])
        generate([week], [week], staff, DEFAULT_RULES)
        self.assertEqual(week["shifts"][-1], fixed)
        self.assertEqual(row["assignments"], [{"employeeId": self.manager.id, "locked": True}])

    def test_no_overlap_double_service_or_daily_excess(self):
        week, shift, staff = self.minimal_week()
        shift["start"] = "10:00"
        shift["end"] = "19:00"
        other = {**deepcopy(shift), "id": "other", "service": "soir", "start": "18:30", "end": "23:00"}
        week["shifts"].append(other)
        week["availability"][str(self.employee.id)] = {"confirmed": True, "allAvailable": True}
        generate([week], [week], staff, DEFAULT_RULES)
        self.assertEqual(sum(len(s["assignments"]) for s in week["shifts"]), 1)
        other["start"] = "19:00"
        generate([week], [week], staff, DEFAULT_RULES)
        self.assertEqual(sum(len(s["assignments"]) for s in week["shifts"]), 1)  # Daily max, even without overlap.

    def test_hours_balance_across_weeks(self):
        _, _, staff = self.minimal_week()
        weeks = [new_week(start, staff) for start in (self.start, "2026-09-14")]
        for week in weeks:
            week["shifts"] = [s for s in week["shifts"] if s["role"] == "salle" and not s["required"] and s["service"] == "midi"]
            for s in week["shifts"]:
                s["count"] = 1
            for e in staff:
                week["availability"][str(e["id"])] = {"confirmed": True, "allAvailable": True}
        generate(weeks, weeks, staff, DEFAULT_RULES)
        totals = [sum(duration(s) for w in weeks for s in w["shifts"] if any(a["employeeId"] == e["id"] for a in s["assignments"])) for e in staff]
        self.assertLessEqual(abs(totals[0]-totals[1]), 450)
        self.assertGreater(min(totals), 0)

    def test_publication_snapshot_is_separate_from_drafts(self):
        _, shift, _ = self.minimal_week()
        self.login_as(self.employee)
        self.assertEqual(self.action("availability", availability={"values": {}, "allAvailable": True, "confirmed": True}).status_code, 200)
        self.login_as(self.manager)
        self.assertEqual(self.action("generate", count=1).status_code, 200)
        self.assertEqual(self.action("publish").status_code, 200)
        self.assertEqual(self.action("assign", shiftId=shift["id"], assignments=[]).status_code, 200)
        self.login_as(self.employee)
        response = self.client.get(f"/api/lulu/board/?week={self.start}")
        week = response.data["weeks"][self.start]
        self.assertEqual(week["shifts"][0]["assignments"], [])
        self.assertEqual(week["published"]["shifts"][0]["assignments"][0]["employeeId"], self.employee.id)

    def test_publish_blocks_missing_unavailable_or_unknown_assignments(self):
        _, shift, _ = self.minimal_week()
        self.login_as(self.manager)
        self.assertEqual(self.action("publish").status_code, 400)
        self.assertEqual(self.action("assign", shiftId=shift["id"], assignments=[{"employeeId": self.employee.id, "locked": False}]).status_code, 200)
        self.assertEqual(self.action("publish").status_code, 400)

    def test_concurrent_edit_and_malformed_shift_do_not_write(self):
        self.minimal_week()
        self.login_as(self.manager)
        response = self.action("shifts", shifts=[{"service": "midi", "start": "99:00", "end": "23:00"}])
        self.assertEqual(response.status_code, 400)
        response = self.client.post("/api/lulu/board/", {"action": "remind", "revision": 999}, format="json")
        self.assertEqual(response.status_code, 409)

    def test_templates_reset_assignments_and_confirmation(self):
        self.minimal_week()
        self.login_as(self.manager)
        self.assertEqual(self.action("saveTemplate", name="A").status_code, 200)
        response = self.action("applyTemplate", name="A", week="2026-09-14")
        self.assertEqual(response.status_code, 200)
        copied = response.data["weeks"]["2026-09-14"]
        self.assertEqual(copied["shifts"][0]["date"], "2026-09-14")
        self.assertEqual(copied["shifts"][0]["assignments"], [])

    def test_reset_pin_invalidates_sessions(self):
        self.login_as(self.employee)
        token = self.client._credentials["HTTP_AUTHORIZATION"]
        self.login_as(self.manager)
        value = employee_data(self.employee)
        value["pin"] = "345678"
        self.assertEqual(self.action("employee", employee=value).status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=token)
        self.assertIn(self.client.get("/api/lulu/board/").status_code, (401, 403))

    def test_changes_to_requirements_invalidate_confirmation(self):
        _, shift, _ = self.minimal_week()
        self.login_as(self.employee)
        self.action("availability", availability={"allAvailable": True, "confirmed": True})
        self.login_as(self.manager)
        shift["start"] = "10:30"
        response = self.action("shifts", shifts=[shift])
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["weeks"][self.start]["confirmation"][str(self.employee.id)])

    def test_generator_never_automatically_assigns_a_multiskilled_cook(self):
        week, shift, staff = self.minimal_week()
        staff[1]["skills"].append("cuisine")
        week["availability"][str(self.employee.id)] = {"confirmed": True, "allAvailable": True}
        generate([week], [week], staff, DEFAULT_RULES)
        self.assertEqual(shift["assignments"], [])

    def test_rest_is_checked_across_the_generation_boundary(self):
        week, shift, staff = self.minimal_week()
        previous = deepcopy(week)
        previous["start"] = "2026-08-31"
        previous["shifts"][0].update(id="previous", date="2026-09-06", service="soir", start="18:30", end="01:00", assignments=[{"employeeId": self.employee.id, "locked": False}])
        week["availability"][str(self.employee.id)] = {"confirmed": True, "allAvailable": True}
        generate([week], [previous, week], staff, DEFAULT_RULES)
        self.assertEqual(shift["assignments"], [])

    def test_read_only_suggestions_are_not_counted_as_prepared(self):
        self.login_as(self.manager)
        response = self.client.get(f"/api/lulu/board/?week={self.start}")
        self.assertFalse(response.data["weeks"][self.start]["prepared"])
        response = self.action("remind")
        self.assertTrue(response.data["weeks"][self.start]["prepared"])

    def test_invalid_json_values_return_validation_errors(self):
        self.minimal_week()
        self.login_as(self.employee)
        response = self.action("availability", availability={"values": {"x": []}})
        self.assertEqual(response.status_code, 400)

    def test_missing_cook_schedule_is_a_blocking_setup_issue(self):
        week, _, staff = self.minimal_week()
        staff[1]["skills"].append("cuisine")
        issues = audit([week], staff, DEFAULT_RULES)
        self.assertTrue(any(i["shiftId"] == "setup" and i["severity"] == "error" for i in issues))

    def test_first_manual_assignment_can_target_an_unsaved_suggested_week(self):
        self.login_as(self.manager)
        response = self.client.get(f"/api/lulu/board/?week={self.start}")
        shift = response.data["weeks"][self.start]["shifts"][0]
        response = self.action("assign", shiftId=shift["id"], assignments=[{"employeeId": self.manager.id, "locked": True}])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["weeks"][self.start]["shifts"][0]["assignments"][0]["employeeId"], self.manager.id)
