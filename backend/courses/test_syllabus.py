from decimal import Decimal

from rest_framework.test import APITestCase

from courses.models import Course, Lesson, Subject


class SyllabusTests(APITestCase):
    def setUp(self):
        self.subject = Subject.objects.create(name="Science")
        self.course = Course.objects.create(title="Physics", subject=self.subject, description="d", fee=Decimal("100"))
        self.published = Lesson.objects.create(course=self.course, title="Intro", kind="video", order=1,
                                                description="Covers the basics.", duration_minutes=15,
                                                url="https://example.com/v")
        self.draft = Lesson.objects.create(course=self.course, title="Unlisted", kind="video", order=2, is_published=False)

    def test_anonymous_can_see_published_lesson_outline(self):
        r = self.client.get(f"/api/courses/{self.course.slug}/syllabus/")
        self.assertEqual(r.status_code, 200)
        titles = [l["title"] for l in r.data]
        self.assertEqual(titles, ["Intro"])  # draft lesson excluded

    def test_outline_has_no_content_fields(self):
        r = self.client.get(f"/api/courses/{self.course.slug}/syllabus/")
        row = r.data[0]
        self.assertEqual(set(row.keys()), {"id", "title", "kind", "kind_display", "order", "description", "duration_minutes"})
        self.assertNotIn("url", row)
        self.assertNotIn("video_url", row)

    def test_unknown_or_unpublished_course_404s(self):
        self.assertEqual(self.client.get("/api/courses/nope/syllabus/").status_code, 404)
        self.course.is_published = False
        self.course.save()
        self.assertEqual(self.client.get(f"/api/courses/{self.course.slug}/syllabus/").status_code, 404)
