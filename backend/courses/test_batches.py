from datetime import date, time
from decimal import Decimal

from django.core.exceptions import ValidationError
from rest_framework.test import APITestCase

from accounts.models import User
from courses.models import Batch, Course, Subject


class BatchTestBase(APITestCase):
    def setUp(self):
        subj = Subject.objects.create(name="Maths")
        self.course = Course.objects.create(title="Algebra", subject=subj, description="d", fee=Decimal("1000"),
                                            mode="hybrid", start_date=date(2026, 11, 1))
        self.eve = Batch.objects.create(course=self.course, label="Evenings", days="Wed,Mon,Fri",
                                        start_time=time(18, 0), end_time=time(19, 30), seats=1)
        self.wknd = Batch.objects.create(course=self.course, label="Weekends", days="Sat,Sun", format="In person",
                                         start_time=time(10, 0), end_time=time(12, 0), start_date=date(2026, 11, 7))
        self.student = User.objects.create_user("a@example.com", "pw-12345-xyz", full_name="A")
        self.client.force_authenticate(self.student)

    def enroll(self, batch=None, course=None):
        body = {"course": (course or self.course).id}
        if batch is not None:
            body["batch"] = batch
        return self.client.post("/api/enroll/", body)

    def pay(self, r):
        return self.client.post(f"/api/enrollments/{r.data['enrollment']['reference']}/pay/", {})


class BatchListTests(BatchTestBase):
    def test_public_list_shape_and_defaults(self):
        self.client.force_authenticate(None)
        rows = self.client.get("/api/courses/algebra/batches/").data
        self.assertEqual([r["label"] for r in rows], ["Weekends", "Evenings"])  # ordered by start time
        eve = next(r for r in rows if r["label"] == "Evenings")
        self.assertEqual(eve["days"], ["Mon", "Wed", "Fri"])  # normalised weekday order
        self.assertEqual((eve["start_time"], eve["end_time"]), ("18:00", "19:30"))
        self.assertEqual(eve["start_date"], "2026-11-01")  # falls back to the course start date
        self.assertEqual(eve["format"], "Online + Offline")  # falls back to the course format
        self.assertEqual(eve["seats_left"], 1)
        wknd = next(r for r in rows if r["label"] == "Weekends")
        self.assertEqual((wknd["start_date"], wknd["format"], wknd["seats_left"]), ("2026-11-07", "In person", None))

    def test_inactive_hidden_and_unknown_course_404(self):
        self.wknd.is_active = False
        self.wknd.save()
        self.assertEqual([b["label"] for b in self.client.get("/api/courses/algebra/batches/").data], ["Evenings"])
        self.assertEqual(self.client.get("/api/courses/nope/batches/").status_code, 404)

    def test_validation(self):
        with self.assertRaises(ValidationError):
            Batch(course=self.course, label="x", days="Mon,Funday", start_time=time(9), end_time=time(10)).full_clean()
        with self.assertRaises(ValidationError):
            Batch(course=self.course, label="x", days="Mon", start_time=time(10), end_time=time(9)).full_clean()
        Batch(course=self.course, label="x", days="Mon, Tue", start_time=time(9), end_time=time(10)).full_clean()


class BatchEnrollmentTests(BatchTestBase):
    def test_batch_required_when_course_has_batches(self):
        r = self.enroll()
        self.assertEqual(r.status_code, 400)
        self.assertIn("choose a batch", r.data["detail"])

    def test_batch_from_another_course_or_inactive_rejected(self):
        other = Course.objects.create(title="Other", subject=self.course.subject, description="d", fee=Decimal("1"))
        foreign = Batch.objects.create(course=other, label="F", days="Mon", start_time=time(9), end_time=time(10))
        self.assertEqual(self.enroll(foreign.id).status_code, 400)
        self.wknd.is_active = False
        self.wknd.save()
        self.assertEqual(self.enroll(self.wknd.id).status_code, 400)
        self.assertEqual(self.enroll(99999).status_code, 400)

    def test_enroll_pay_and_batch_shows_in_my_courses(self):
        r = self.enroll(self.wknd.id)
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["enrollment"]["batch"]["label"], "Weekends")
        self.assertEqual(self.pay(r).status_code, 200)
        mine = self.client.get("/api/my-courses/").data
        self.assertEqual(mine[0]["batch"]["days"], ["Sat", "Sun"])

    def test_full_batch_rejected_at_enroll_and_at_payment(self):
        first = self.enroll(self.eve.id)
        self.assertEqual(self.pay(first).status_code, 200)  # takes the only seat
        self.client.force_authenticate(User.objects.create_user("b@example.com", "pw-12345-xyz", full_name="B"))
        self.assertIn("full", self.enroll(self.eve.id).data["detail"])
        # race: second student started before the seat was taken, then pays late
        Batch.objects.filter(pk=self.eve.pk).update(seats=2)
        pending = self.enroll(self.eve.id)
        Batch.objects.filter(pk=self.eve.pk).update(seats=1)
        r = self.pay(pending)
        self.assertEqual(r.status_code, 400)
        self.assertIn("full", r.data["detail"])
        self.assertEqual(self.client.get("/api/courses/algebra/batches/").data[1]["seats_left"], 0)

    def test_changing_batch_before_paying_updates_the_pending_enrollment(self):
        self.enroll(self.eve.id)
        r = self.enroll(self.wknd.id)
        self.assertEqual(r.data["enrollment"]["batch"]["label"], "Weekends")
        from enrollments.models import Enrollment
        self.assertEqual(Enrollment.objects.filter(student=self.student).count(), 1)

    def test_course_without_batches_needs_none(self):
        plain = Course.objects.create(title="Plain", subject=self.course.subject, description="d", fee=Decimal("10"))
        r = self.enroll(course=plain)
        self.assertEqual((r.status_code, r.data["enrollment"]["batch"]), (201, None))
