from decimal import Decimal

from django.core import mail
from rest_framework.test import APITestCase

from accounts.models import User
from courses.models import Course, Subject
from enrollments.models import Enrollment

BASE = "/api/manage/enrollments/"


class ManageBase(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user("stu@example.com", "Pass-12345", full_name="Stu")
        self.other = User.objects.create_user("other@example.com", "Pass-12345", full_name="Other")
        self.staff = User.objects.create_user("staff@example.com", "Pass-12345", full_name="Staff")
        self.staff.role = "staff"
        self.staff.save()
        self.root = User.objects.create_superuser("root@example.com", "Pass-12345", full_name="Root")
        self.subject = Subject.objects.create(name="Science")
        self.course = Course.objects.create(title="Physics", subject=self.subject, description="d", fee=Decimal("100"), seats=5)
        self.other_course = Course.objects.create(title="Chemistry", subject=self.subject, description="d", fee=Decimal("200"), seats=5)

    def as_(self, user):
        self.client.force_authenticate(user)


class PermissionTests(ManageBase):
    def test_anonymous_gets_401(self):
        self.assertEqual(self.client.get(BASE).status_code, 401)

    def test_student_gets_403(self):
        self.as_(self.student)
        self.assertEqual(self.client.get(BASE).status_code, 403)

    def test_staff_and_superadmin_can_list(self):
        for user in (self.staff, self.root):
            self.as_(user)
            self.assertEqual(self.client.get(BASE).status_code, 200)

    def test_no_write_endpoints(self):
        self.as_(self.staff)
        self.assertEqual(self.client.post(BASE, {}).status_code, 405)
        e = Enrollment.objects.create(student=self.student, course=self.course, amount=100, status="pending")
        self.assertEqual(self.client.delete(f"{BASE}{e.id}/").status_code, 405)


class ListFilterTests(ManageBase):
    def setUp(self):
        super().setUp()
        self.pending = Enrollment.objects.create(student=self.student, course=self.course, amount=100, status="pending")
        self.paid = Enrollment.objects.create(student=self.other, course=self.other_course, amount=200, status="paid")
        self.as_(self.staff)

    def test_list_includes_everyone(self):
        ids = {r["id"] for r in self.client.get(BASE).data["results"]}
        self.assertEqual(ids, {self.pending.id, self.paid.id})

    def test_filter_by_status(self):
        r = self.client.get(f"{BASE}?status=paid").data["results"]
        self.assertEqual([x["id"] for x in r], [self.paid.id])

    def test_filter_by_course(self):
        r = self.client.get(f"{BASE}?course={self.course.id}").data["results"]
        self.assertEqual([x["id"] for x in r], [self.pending.id])

    def test_search_by_student_name(self):
        r = self.client.get(f"{BASE}?q=Other").data["results"]
        self.assertEqual([x["id"] for x in r], [self.paid.id])

    def test_rows_include_names(self):
        row = self.client.get(f"{BASE}{self.pending.id}/").data
        self.assertEqual((row["student_name"], row["course_title"]), ("Stu", "Physics"))


class ActionTests(ManageBase):
    def test_mark_paid_sends_one_receipt_and_is_idempotent(self):
        e = Enrollment.objects.create(student=self.student, course=self.course, amount=100, status="pending")
        self.as_(self.staff)
        r = self.client.post(f"{BASE}{e.id}/mark-paid/", {"payment_ref": "cash-001"})
        self.assertEqual((r.status_code, r.data["status"], r.data["payment_ref"]), (200, "paid", "cash-001"))
        self.assertEqual(len(mail.outbox), 1)
        r2 = self.client.post(f"{BASE}{e.id}/mark-paid/", {"payment_ref": "cash-002"})
        self.assertEqual(r2.data["payment_ref"], "cash-001")  # already paid: ignored
        self.assertEqual(len(mail.outbox), 1)  # no second receipt

    def test_mark_paid_without_ref_uses_staff_email(self):
        e = Enrollment.objects.create(student=self.student, course=self.course, amount=100, status="pending")
        self.as_(self.staff)
        r = self.client.post(f"{BASE}{e.id}/mark-paid/")
        self.assertIn("staff@example.com", r.data["payment_ref"])

    def test_mark_failed_from_pending(self):
        e = Enrollment.objects.create(student=self.student, course=self.course, amount=100, status="pending")
        self.as_(self.staff)
        r = self.client.post(f"{BASE}{e.id}/mark-failed/")
        self.assertEqual(r.data["status"], "failed")

    def test_mark_failed_never_downgrades_paid(self):
        e = Enrollment.objects.create(student=self.student, course=self.course, amount=100, status="paid", payment_ref="x")
        self.as_(self.staff)
        r = self.client.post(f"{BASE}{e.id}/mark-failed/")
        self.assertEqual(r.data["status"], "paid")

    def test_actions_need_staff(self):
        e = Enrollment.objects.create(student=self.student, course=self.course, amount=100, status="pending")
        self.as_(self.student)
        self.assertEqual(self.client.post(f"{BASE}{e.id}/mark-paid/").status_code, 403)


class RevenueSummaryTests(ManageBase):
    def test_summary_totals(self):
        Enrollment.objects.create(student=self.student, course=self.course, amount=100, status="paid")
        Enrollment.objects.create(student=self.other, course=self.course, amount=150, status="paid")
        Enrollment.objects.create(student=self.student, course=self.other_course, amount=200, status="paid")
        Enrollment.objects.create(student=self.other, course=self.course, amount=50, status="pending")
        self.as_(self.staff)
        r = self.client.get(f"{BASE}summary/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(Decimal(r.data["total_paid"]), Decimal("450"))
        self.assertEqual(r.data["total_paid_count"], 3)
        self.assertEqual(r.data["pending_count"], 1)
        by_course = {row["course_title"]: row for row in r.data["by_course"]}
        self.assertEqual(Decimal(by_course["Physics"]["total"]), Decimal("250"))
        self.assertEqual(by_course["Physics"]["paid_count"], 2)

    def test_summary_needs_staff(self):
        self.as_(self.student)
        self.assertEqual(self.client.get(f"{BASE}summary/").status_code, 403)
