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

    def test_revenue_trend_covers_six_months_current_last(self):
        self.client.force_authenticate(self.staff)
        r = self.client.get(BASE)
        trend = r.data["revenue_trend"]
        self.assertEqual(len(trend), 6)
        this_month = trend[-1]
        self.assertEqual(this_month["month"], timezone.localtime(timezone.now()).strftime("%b %Y"))
        self.assertEqual(Decimal(this_month["total"]), Decimal("200"))
        self.assertEqual(this_month["count"], 1)
        self.assertEqual(trend[0]["total"], 0)  # five months back: no data in the fixture

    def test_top_courses_ranked_by_revenue(self):
        other = Course.objects.filter(is_published=False).first()
        other.is_published = True
        other.save()
        Enrollment.objects.create(student=self.student, course=other, amount=500, status="paid", paid_at=timezone.now())
        self.client.force_authenticate(self.staff)
        r = self.client.get(BASE)
        top = r.data["top_courses"]
        self.assertEqual(top[0]["course_title"], "Draft")
        self.assertEqual(Decimal(top[0]["total"]), Decimal("500"))
        self.assertEqual(top[1]["course_title"], "Physics")

    def test_low_seats_flags_nearly_full_courses(self):
        from courses.models import Subject
        subject = Subject.objects.first()
        tight = Course.objects.create(title="Tight", subject=subject, description="d", fee=100, is_published=True, seats=2)
        Enrollment.objects.create(student=self.student, course=tight, amount=100, status="paid", paid_at=timezone.now())
        roomy = Course.objects.create(title="Roomy", subject=subject, description="d", fee=100, is_published=True, seats=50)
        self.client.force_authenticate(self.staff)
        r = self.client.get(BASE)
        slugs = [row["slug"] for row in r.data["low_seats"]]
        self.assertIn(tight.slug, slugs)
        self.assertNotIn(roomy.slug, slugs)
        self.assertNotIn(self.course.slug, slugs)  # seats is None: unlimited, never "low"
        row = next(x for x in r.data["low_seats"] if x["slug"] == tight.slug)
        self.assertEqual(row["seats_left"], 1)
