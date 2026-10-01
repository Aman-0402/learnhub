from datetime import time
from decimal import Decimal
from unittest import mock

from django.core import mail
from rest_framework.test import APITestCase

from courses.models import Batch, Course, Subject
from enrollments.models import Enrollment
from enrollments.services import mark_failed, mark_paid


class WelcomeEmailTests(APITestCase):
    def register(self, name="Asha Rao", email="asha@example.com"):
        return self.client.post("/api/auth/register/", {"email": email, "full_name": name, "password": "Str0ng-pass-99"})

    def test_welcome_email_sent_once_on_register(self):
        self.assertEqual(self.register().status_code, 201)
        self.assertEqual(len(mail.outbox), 1)
        msg = mail.outbox[0]
        self.assertEqual(msg.to, ["asha@example.com"])
        self.assertIn("Welcome to LearnHub, Asha!", msg.body)
        self.assertEqual(msg.alternatives[0][1], "text/html")
        self.assertIn("/courses", msg.body)

    def test_html_part_escapes_the_name(self):
        self.register(name="<script>alert(1)</script> Eve", email="eve@example.com")
        html = mail.outbox[0].alternatives[0][0]
        self.assertNotIn("<script>", html)

    def test_failed_email_does_not_break_registration(self):
        with mock.patch("django.core.mail.EmailMultiAlternatives.send", side_effect=OSError("smtp down")):
            res = self.register()
        self.assertEqual(res.status_code, 201)
        self.assertIn("access", res.data)

    def test_duplicate_registration_sends_nothing_extra(self):
        self.register()
        self.register()
        self.assertEqual(len(mail.outbox), 1)


class ReceiptEmailTests(APITestCase):
    def setUp(self):
        from accounts.models import User
        self.user = User.objects.create_user("stu@example.com", "Str0ng-pass-99", full_name="Stu Dent")
        subject = Subject.objects.create(name="Science")
        self.course = Course.objects.create(title="Physics Made Simple", subject=subject, mode="hybrid", description="d", fee=Decimal("1999.00"))
        self.batch = Batch.objects.create(course=self.course, label="Weekday evenings", days="Mon,Wed", start_time=time(18), end_time=time(19, 30))
        self.enrollment = Enrollment.objects.create(student=self.user, course=self.course, batch=self.batch, amount=Decimal("1999.00"))

    def test_receipt_sent_when_paid(self):
        mark_paid(self.enrollment, "pay_123")
        self.assertEqual(len(mail.outbox), 1)
        msg = mail.outbox[0]
        self.assertEqual(msg.to, ["stu@example.com"])
        self.assertEqual(msg.subject, "Receipt for Physics Made Simple")
        for needle in (str(self.enrollment.reference), "Weekday evenings", "Mon, Wed", "18:00 to 19:30", "INR 1,999.00", f"/learn/{self.course.slug}"):
            self.assertIn(needle, msg.body)

    def test_second_mark_paid_does_not_send_again(self):
        mark_paid(self.enrollment, "pay_123")
        mark_paid(self.enrollment, "pay_123")
        self.assertEqual(len(mail.outbox), 1)

    def test_no_receipt_for_failed_payment(self):
        mark_failed(self.enrollment)
        self.assertEqual(len(mail.outbox), 0)

    def test_email_failure_does_not_block_payment(self):
        with mock.patch("django.core.mail.EmailMultiAlternatives.send", side_effect=OSError("smtp down")):
            mark_paid(self.enrollment, "pay_123")
        self.enrollment.refresh_from_db()
        self.assertEqual(self.enrollment.status, Enrollment.Status.PAID)

    def test_receipt_sent_through_the_pay_endpoint(self):
        self.client.force_authenticate(self.user)
        res = self.client.post(f"/api/enrollments/{self.enrollment.reference}/pay/", {"order_id": "x"}, format="json")
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(len(mail.outbox), 1)
