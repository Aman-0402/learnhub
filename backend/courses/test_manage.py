from decimal import Decimal

from rest_framework.test import APITestCase

from accounts.models import User
from courses.models import Batch, Course, Instructor, Lesson, Subject
from enrollments.models import Enrollment

BASE = "/api/manage/"
ENDPOINTS = ["subjects", "instructors", "courses", "batches", "lessons"]


class ManageBase(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user("stu@example.com", "Pass-12345", full_name="Stu")
        self.staff = User.objects.create_user("staff@example.com", "Pass-12345", full_name="Staff")
        self.staff.role = "staff"
        self.staff.save()
        self.root = User.objects.create_superuser("root@example.com", "Pass-12345", full_name="Root")
        self.subject = Subject.objects.create(name="Science")
        self.course = Course.objects.create(title="Physics", subject=self.subject, description="d", fee=Decimal("100"), seats=2)

    def as_(self, user):
        self.client.force_authenticate(user)


class PermissionTests(ManageBase):
    def test_anonymous_gets_401_everywhere(self):
        for ep in ENDPOINTS:
            self.assertEqual(self.client.get(f"{BASE}{ep}/").status_code, 401, ep)
            self.assertEqual(self.client.post(f"{BASE}{ep}/", {}).status_code, 401, ep)

    def test_student_gets_403_everywhere(self):
        self.as_(self.student)
        for ep in ENDPOINTS:
            self.assertEqual(self.client.get(f"{BASE}{ep}/").status_code, 403, ep)
            self.assertEqual(self.client.post(f"{BASE}{ep}/", {}).status_code, 403, ep)
        self.assertEqual(self.client.delete(f"{BASE}courses/{self.course.id}/").status_code, 403)
        self.assertTrue(Course.objects.filter(pk=self.course.pk).exists())

    def test_staff_and_superadmin_can_list(self):
        for user in (self.staff, self.root):
            self.as_(user)
            for ep in ENDPOINTS:
                self.assertEqual(self.client.get(f"{BASE}{ep}/").status_code, 200, ep)

    def test_staff_flag_without_role_is_not_enough(self):
        # role is the source of truth, and save() keeps flags in step, so a student can never hold staff access by accident
        self.assertEqual(self.student.role, "student")
        self.as_(self.student)
        self.assertEqual(self.client.get(f"{BASE}courses/").status_code, 403)


class SubjectInstructorTests(ManageBase):
    def test_subject_crud_and_slug(self):
        self.as_(self.staff)
        r = self.client.post(f"{BASE}subjects/", {"name": "Art History"})
        self.assertEqual((r.status_code, r.data["slug"]), (201, "art-history"))
        sid = r.data["id"]
        self.assertEqual(self.client.patch(f"{BASE}subjects/{sid}/", {"name": "Art"}).data["name"], "Art")
        self.assertEqual(self.client.delete(f"{BASE}subjects/{sid}/").status_code, 204)

    def test_subject_with_courses_cannot_be_deleted(self):
        self.as_(self.staff)
        r = self.client.delete(f"{BASE}subjects/{self.subject.id}/")
        self.assertEqual(r.status_code, 409)
        self.assertTrue(Subject.objects.filter(pk=self.subject.pk).exists())

    def test_duplicate_subject_name_rejected(self):
        self.as_(self.staff)
        self.assertEqual(self.client.post(f"{BASE}subjects/", {"name": "Science"}).status_code, 400)

    def test_instructor_crud_and_inactive_listed(self):
        self.as_(self.staff)
        r = self.client.post(f"{BASE}instructors/", {"name": "Asha Rao", "headline": "Maths", "is_active": False})
        self.assertEqual((r.status_code, r.data["slug"]), (201, "asha-rao"))
        names = [i["name"] for i in self.client.get(f"{BASE}instructors/").data["results"]]
        self.assertIn("Asha Rao", names)  # unlike the public list, staff see inactive instructors
        self.assertEqual(self.client.delete(f"{BASE}instructors/{r.data['id']}/").status_code, 204)

    def test_deleting_instructor_keeps_the_course(self):
        inst = Instructor.objects.create(name="Temp")
        self.course.instructor = inst
        self.course.save()
        self.as_(self.staff)
        self.assertEqual(self.client.delete(f"{BASE}instructors/{inst.id}/").status_code, 204)
        self.course.refresh_from_db()
        self.assertIsNone(self.course.instructor)


class CourseTests(ManageBase):
    payload = {"title": "Chemistry", "mode": "online", "description": "Atoms", "fee": "2500.00", "duration_weeks": 6}

    def test_create_update_publish_toggle_delete(self):
        self.as_(self.staff)
        r = self.client.post(f"{BASE}courses/", {**self.payload, "subject": self.subject.id})
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual(r.data["slug"], "chemistry")
        cid = r.data["id"]
        r = self.client.patch(f"{BASE}courses/{cid}/", {"is_published": False, "title": "Chemistry 2"})
        self.assertEqual((r.data["is_published"], r.data["slug"]), (False, "chemistry"))  # slug stays stable
        self.assertEqual(self.client.get("/api/courses/chemistry/").status_code, 404)  # hidden from the public API
        self.assertEqual(self.client.delete(f"{BASE}courses/{cid}/").status_code, 204)

    def test_list_includes_unpublished_and_filters(self):
        Course.objects.create(title="Hidden", subject=self.subject, description="d", fee=1, is_published=False)
        self.as_(self.staff)
        titles = [c["title"] for c in self.client.get(f"{BASE}courses/").data["results"]]
        self.assertEqual(sorted(titles), ["Hidden", "Physics"])
        only = self.client.get(f"{BASE}courses/?published=false").data["results"]
        self.assertEqual([c["title"] for c in only], ["Hidden"])
        self.assertEqual(len(self.client.get(f"{BASE}courses/?q=phys").data["results"]), 1)

    def test_validation(self):
        self.as_(self.staff)
        base = {**self.payload, "subject": self.subject.id}
        self.assertIn("location", self.client.post(f"{BASE}courses/", {**base, "mode": "offline"}).data)
        self.assertIn("fee", self.client.post(f"{BASE}courses/", {**base, "fee": "-1"}).data)
        self.assertIn("duration_weeks", self.client.post(f"{BASE}courses/", {**base, "duration_weeks": 0}).data)
        ok = self.client.post(f"{BASE}courses/", {**base, "mode": "offline", "location": "Vadodara Centre"})
        self.assertEqual(ok.status_code, 201)

    def test_course_with_enrollments_cannot_be_deleted(self):
        Enrollment.objects.create(student=self.student, course=self.course, amount=100, status="paid")
        self.as_(self.staff)
        r = self.client.delete(f"{BASE}courses/{self.course.id}/")
        self.assertEqual(r.status_code, 409)
        self.assertIn("unpublish", r.data["detail"])
        self.assertTrue(Course.objects.filter(pk=self.course.pk).exists())

    def test_seats_cannot_drop_below_paid(self):
        other = User.objects.create_user("o@example.com", "Pass-12345", full_name="O")
        for u in (self.student, other):
            Enrollment.objects.create(student=u, course=self.course, amount=100, status="paid")
        self.as_(self.staff)
        self.assertIn("seats", self.client.patch(f"{BASE}courses/{self.course.id}/", {"seats": 1}).data)
        self.assertEqual(self.client.patch(f"{BASE}courses/{self.course.id}/", {"seats": 5}).status_code, 200)

    def test_counts_are_reported(self):
        Enrollment.objects.create(student=self.student, course=self.course, amount=100, status="paid")
        self.as_(self.staff)
        row = self.client.get(f"{BASE}courses/{self.course.id}/").data
        self.assertEqual((row["paid_count"], row["enrollment_count"]), (1, 1))

    def test_public_api_unchanged_for_anonymous(self):
        self.assertEqual(self.client.get("/api/courses/").status_code, 200)
        self.assertEqual(self.client.post("/api/courses/", {}).status_code, 405)


class BatchLessonTests(ManageBase):
    def batch(self, **kw):
        return {"course": self.course.id, "label": "Evenings", "days": ["Wed", "Mon"], "start_time": "18:00", "end_time": "19:30", **kw}

    def test_batch_crud_days_in_week_order(self):
        self.as_(self.staff)
        r = self.client.post(f"{BASE}batches/", self.batch(), format="json")
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual(r.data["days"], ["Mon", "Wed"])
        self.assertEqual(Batch.objects.get(pk=r.data["id"]).days, "Mon,Wed")
        self.assertEqual(len(self.client.get(f"{BASE}batches/?course={self.course.id}").data["results"]), 1)
        self.assertEqual(self.client.delete(f"{BASE}batches/{r.data['id']}/").status_code, 204)

    def test_batch_validation(self):
        self.as_(self.staff)
        self.assertIn("days", self.client.post(f"{BASE}batches/", self.batch(days=["Funday"]), format="json").data)
        self.assertIn("days", self.client.post(f"{BASE}batches/", self.batch(days=[]), format="json").data)
        self.assertIn("end_time", self.client.post(f"{BASE}batches/", self.batch(end_time="17:00"), format="json").data)

    def test_deleting_batch_with_enrollment_keeps_the_enrollment(self):
        b = Batch.objects.create(course=self.course, label="L", days="Mon", start_time="10:00", end_time="11:00")
        e = Enrollment.objects.create(student=self.student, course=self.course, batch=b, amount=100, status="paid")
        self.as_(self.staff)
        self.assertEqual(self.client.delete(f"{BASE}batches/{b.id}/").status_code, 204)
        e.refresh_from_db()
        self.assertIsNone(e.batch)

    def test_lesson_crud_and_course_filter(self):
        self.as_(self.staff)
        r = self.client.post(f"{BASE}lessons/", {"course": self.course.id, "title": "Intro", "kind": "video", "order": 1,
                                                  "url": "https://example.com/v", "is_published": False})
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual(len(self.client.get(f"{BASE}lessons/?course={self.course.id}").data["results"]), 1)  # drafts visible to staff
        self.assertEqual(self.client.patch(f"{BASE}lessons/{r.data['id']}/", {"is_published": True}).data["is_published"], True)
        self.assertEqual(self.client.delete(f"{BASE}lessons/{r.data['id']}/").status_code, 204)
        self.assertFalse(Lesson.objects.exists())

    def test_lesson_bad_url_rejected(self):
        self.as_(self.staff)
        r = self.client.post(f"{BASE}lessons/", {"course": self.course.id, "title": "x", "url": "not a url"})
        self.assertIn("url", r.data)
