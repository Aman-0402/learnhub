from decimal import Decimal

from django.utils import timezone
from rest_framework.test import APITestCase

from accounts.models import User
from contact.models import ContactMessage
from courses.models import Course, Subject
from enrollments.models import Enrollment

BASE = "/api/manage/overview/"


class OverviewTests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user("stu@example.com", "Pass-12345", full_name="Stu")
        User.objects.create_user("stu2@example.com", "Pass-12345", full_name="Stu2")
        self.staff = User.objects.create_user("staff@example.com", "Pass-12345", full_name="Staff")
        self.staff.role = "staff"
        self.staff.save()
        subject = Subject.objects.create(name="Science")
        self.course = Course.objects.create(title="Physics", subject=subject, description="d", fee=Decimal("100"), is_published=True)
        Course.objects.create(title="Draft", subject=subject, description="d", fee=Decimal("100"), is_published=False)
        Enrollment.objects.create(student=self.student, course=self.course, amount=100, status="pending")
        Enrollment.objects.create(student=self.student, course=self.course, amount=200, status="paid", paid_at=timezone.now())
        ContactMessage.objects.create(name="A", email="a@example.com", message="hi")
        ContactMessage.objects.create(name="B", email="b@example.com", message="hi", is_handled=True)

    def test_anonymous_gets_401(self):
        self.assertEqual(self.client.get(BASE).status_code, 401)

    def test_student_gets_403(self):
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.get(BASE).status_code, 403)

    def test_staff_sees_overview(self):
        self.client.force_authenticate(self.staff)
        r = self.client.get(BASE)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["students_count"], 2)
        self.assertEqual(r.data["active_courses"], 1)
        self.assertEqual(r.data["pending_enrollments"], 1)
        self.assertEqual(Decimal(r.data["revenue_this_month"]), Decimal("200"))
        self.assertEqual(r.data["unhandled_messages"], 1)
        self.assertEqual(len(r.data["recent_messages"]), 2)
