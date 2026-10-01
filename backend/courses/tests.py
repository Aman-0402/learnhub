from decimal import Decimal

from django.utils import timezone
from rest_framework.test import APITestCase

from accounts.models import User
from courses.models import Course, Instructor, Lesson, Subject
from enrollments.models import Enrollment


class InstructorTests(APITestCase):
    def setUp(self):
        subj = Subject.objects.create(name="Science")
        self.inst = Instructor.objects.create(name="Rohan Verma", headline="Physics")
        Course.objects.create(title="Physics A", subject=subj, description="d", fee=Decimal("10"), instructor=self.inst)
        Course.objects.create(title="Hidden", subject=subj, description="d", fee=Decimal("10"),
                              instructor=self.inst, is_published=False)
        Instructor.objects.create(name="Inactive Person", is_active=False)

    def test_slug_is_generated_and_unique(self):
        twin = Instructor.objects.create(name="Rohan Verma")
        self.assertEqual(self.inst.slug, "rohan-verma")
        self.assertEqual(twin.slug, "rohan-verma-2")

    def test_list_only_active_and_only_published_courses(self):
        r = self.client.get("/api/instructors/")
        self.assertEqual([i["name"] for i in r.data], ["Rohan Verma"])
        self.assertEqual([c["title"] for c in r.data[0]["courses"]], ["Physics A"])
        self.assertEqual(r.data[0]["subjects"], ["Science"])

    def test_detail_and_course_exposes_instructor_name(self):
        self.assertEqual(self.client.get("/api/instructors/rohan-verma/").status_code, 200)
        self.assertEqual(self.client.get("/api/instructors/inactive-person/").status_code, 404)
        course = self.client.get("/api/courses/physics-a/").data
        self.assertEqual(course["instructor"], "Rohan Verma")
        self.assertEqual(course["instructor_slug"], "rohan-verma")


class LessonAccessTests(APITestCase):
    def setUp(self):
        subj = Subject.objects.create(name="Maths")
        self.course = Course.objects.create(title="Algebra", subject=subj, description="d", fee=Decimal("10"))
        Lesson.objects.create(course=self.course, title="Intro", order=1, url="https://example.com/v1")
        Lesson.objects.create(course=self.course, title="Live", kind="live", order=2, session_at=timezone.now())
        Lesson.objects.create(course=self.course, title="Draft", order=3, is_published=False)
        self.student = User.objects.create_user("s@example.com", "pw-12345-xyz", full_name="S")
        self.other = User.objects.create_user("o@example.com", "pw-12345-xyz", full_name="O")
        self.staff = User.objects.create_user("t@example.com", "pw-12345-xyz", full_name="T", is_staff=True)
        Enrollment.objects.create(student=self.student, course=self.course, status="paid", amount=10)
        Enrollment.objects.create(student=self.other, course=self.course, status="pending", amount=10)

    def get(self, user=None):
        self.client.force_authenticate(user)
        return self.client.get("/api/courses/algebra/lessons/")

    def test_anonymous_rejected(self):
        self.assertEqual(self.get().status_code, 401)

    def test_unpaid_student_forbidden(self):
        self.assertEqual(self.get(self.other).status_code, 403)

    def test_paid_student_sees_published_lessons_in_order(self):
        r = self.get(self.student)
        self.assertEqual(r.status_code, 200)
        self.assertEqual([l["title"] for l in r.data], ["Intro", "Live"])
        self.assertEqual(r.data[1]["kind_display"], "Live or in-person class")

    def test_staff_can_view(self):
        self.assertEqual(self.get(self.staff).status_code, 200)

    def test_unknown_or_unpublished_course_404(self):
        self.client.force_authenticate(self.staff)
        self.assertEqual(self.client.get("/api/courses/nope/lessons/").status_code, 404)


class SitemapTests(APITestCase):
    """sitemap.xml lists public pages and published courses only."""

    def setUp(self):
        from django.core.cache import cache
        cache.clear()

    def test_sitemap_lists_public_pages_and_published_courses(self):
        subject = Subject.objects.create(name="SEO Subject")
        Course.objects.create(title="Visible SEO Course", subject=subject, mode="online", description="d", fee=100, duration_weeks=2)
        Course.objects.create(title="Hidden SEO Course", subject=subject, mode="online", description="d", fee=100, duration_weeks=2, is_published=False)
        res = self.client.get("/sitemap.xml")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res["Content-Type"], "application/xml")
        body = res.content.decode()
        self.assertIn("/courses/visible-seo-course</loc>", body)
        self.assertNotIn("hidden-seo-course", body)
        for path in ("/courses<", "/about<", "/portfolio<", "/faq<"):
            self.assertIn(path, body)
        self.assertNotIn("/dashboard", body)
        self.assertNotIn("/checkout", body)
