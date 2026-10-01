import shutil
import tempfile
from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase

from accounts.models import User
from courses.models import Course, Lesson, Subject
from enrollments.models import Enrollment

BASE = "/api/manage/"
MEDIA_TMP = tempfile.mkdtemp()


def tiny_video(name="clip.mp4"):
    return SimpleUploadedFile(name, b"\x00\x00\x00\x18ftypmp42" + b"0" * 100, content_type="video/mp4")


@override_settings(MEDIA_ROOT=MEDIA_TMP)
class LessonVideoTests(APITestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA_TMP, ignore_errors=True)

    def setUp(self):
        self.student = User.objects.create_user("stu@example.com", "Pass-12345", full_name="Stu")
        self.staff = User.objects.create_user("staff@example.com", "Pass-12345", full_name="Staff")
        self.staff.role = "staff"
        self.staff.save()
        self.subject = Subject.objects.create(name="Science")
        self.course = Course.objects.create(title="Physics", subject=self.subject, description="d", fee=Decimal("100"))
        self.lesson = Lesson.objects.create(course=self.course, title="Intro", kind="video", order=1)

    def as_(self, user):
        self.client.force_authenticate(user)

    def test_staff_can_upload_video(self):
        self.as_(self.staff)
        r = self.client.patch(f"{BASE}lessons/{self.lesson.id}/", {"video": tiny_video()}, format="multipart")
        self.assertEqual(r.status_code, 200, r.data)
        self.assertTrue(r.data["video_url"].endswith(".mp4"))
        self.lesson.refresh_from_db()
        self.assertTrue(self.lesson.video.name)

    def test_student_cannot_upload_video(self):
        self.as_(self.student)
        r = self.client.patch(f"{BASE}lessons/{self.lesson.id}/", {"video": tiny_video()}, format="multipart")
        self.assertEqual(r.status_code, 403)

    def test_anonymous_cannot_upload_video(self):
        r = self.client.patch(f"{BASE}lessons/{self.lesson.id}/", {"video": tiny_video()}, format="multipart")
        self.assertEqual(r.status_code, 401)

    def test_non_video_extension_rejected(self):
        self.as_(self.staff)
        bad = SimpleUploadedFile("notes.txt", b"hello", content_type="text/plain")
        r = self.client.patch(f"{BASE}lessons/{self.lesson.id}/", {"video": bad}, format="multipart")
        self.assertIn("video", r.data)

    def test_replacing_video_deletes_the_old_file(self):
        self.as_(self.staff)
        self.client.patch(f"{BASE}lessons/{self.lesson.id}/", {"video": tiny_video("first.mp4")}, format="multipart")
        self.lesson.refresh_from_db()
        first_path = self.lesson.video.path
        self.assertTrue(self.lesson.video.storage.exists(first_path))
        self.client.patch(f"{BASE}lessons/{self.lesson.id}/", {"video": tiny_video("second.mp4")}, format="multipart")
        self.assertFalse(self.lesson.video.storage.exists(first_path))

    def test_video_url_hidden_from_lessons_api_without_paid_enrollment(self):
        self.lesson.video = tiny_video()
        self.lesson.save()
        self.as_(self.student)
        r = self.client.get(f"/api/courses/{self.course.slug}/lessons/")
        self.assertEqual(r.status_code, 403)

    def test_paid_student_sees_video_url(self):
        self.lesson.video = tiny_video()
        self.lesson.save()
        Enrollment.objects.create(student=self.student, course=self.course, amount=100, status="paid")
        self.as_(self.student)
        r = self.client.get(f"/api/courses/{self.course.slug}/lessons/")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.data[0]["video_url"].startswith("http"))
        self.assertTrue(r.data[0]["video_url"].endswith(".mp4"))

    def test_lesson_without_video_has_empty_video_url(self):
        Enrollment.objects.create(student=self.student, course=self.course, amount=100, status="paid")
        self.as_(self.student)
        r = self.client.get(f"/api/courses/{self.course.slug}/lessons/")
        self.assertEqual(r.data[0]["video_url"], "")
