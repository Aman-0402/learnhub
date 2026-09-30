import hashlib
import hmac
import json
from decimal import Decimal
from unittest.mock import patch

from django.test import override_settings
from rest_framework.test import APITestCase

from accounts.models import User
from courses.models import Course, Subject
from enrollments.models import Enrollment
from enrollments.payments import MockGateway, PaymentError, RazorpayGateway, get_gateway

KEYS = dict(PAYMENT_GATEWAY="razorpay", RAZORPAY_KEY_ID="rzp_test_x", RAZORPAY_KEY_SECRET="secret123",
            RAZORPAY_WEBHOOK_SECRET="whsec")


def sign(secret, msg):
    msg = msg.encode() if isinstance(msg, str) else msg
    return hmac.new(secret.encode(), msg, hashlib.sha256).hexdigest()


@override_settings(**KEYS)
class RazorpayFlowTests(APITestCase):
    def setUp(self):
        subj = Subject.objects.create(name="Maths")
        self.course = Course.objects.create(title="Algebra", subject=subj, description="d", fee=Decimal("1499.50"))
        self.user = User.objects.create_user("a@example.com", "pw-12345-xyz", full_name="A")
        self.client.force_authenticate(self.user)

    def enroll(self):
        with patch.object(RazorpayGateway, "_post", return_value={"id": "order_ABC123"}) as post:
            r = self.client.post("/api/enroll/", {"course": self.course.id})
        return r, post

    def test_gateway_selection(self):
        self.assertIsInstance(get_gateway(), RazorpayGateway)
        with override_settings(PAYMENT_GATEWAY="mock"):
            self.assertIsInstance(get_gateway(), MockGateway)

    def test_missing_keys_raise(self):
        with override_settings(RAZORPAY_KEY_ID="", RAZORPAY_KEY_SECRET=""):
            with self.assertRaises(PaymentError):
                RazorpayGateway()

    def test_enroll_creates_order_in_paise(self):
        r, post = self.enroll()
        self.assertEqual(r.status_code, 201)
        path, body = post.call_args.args
        self.assertEqual((path, body["amount"], body["currency"]), ("/orders", 149950, "INR"))
        self.assertEqual(r.data["order"], {
            "gateway": "razorpay", "order_id": "order_ABC123", "amount": 149950, "currency": "INR", "key_id": "rzp_test_x",
        })
        self.assertEqual(Enrollment.objects.get().gateway_order_id, "order_ABC123")
        self.assertNotIn("secret123", json.dumps(r.data))

    def test_gateway_failure_returns_502_and_charges_nothing(self):
        with patch.object(RazorpayGateway, "_post", side_effect=PaymentError("Could not reach Razorpay.")):
            r = self.client.post("/api/enroll/", {"course": self.course.id})
        self.assertEqual(r.status_code, 502)
        self.assertEqual(Enrollment.objects.filter(status="paid").count(), 0)

    def pay(self, ref, **payload):
        return self.client.post(f"/api/enrollments/{ref}/pay/", payload)

    def test_pay_with_valid_signature(self):
        ref = self.enroll()[0].data["enrollment"]["reference"]
        sig = sign("secret123", "order_ABC123|pay_XYZ789")
        r = self.pay(ref, razorpay_order_id="order_ABC123", razorpay_payment_id="pay_XYZ789", razorpay_signature=sig)
        self.assertEqual((r.status_code, r.data["status"], r.data["payment_ref"]), (200, "paid", "pay_XYZ789"))

    def test_pay_with_bad_signature_fails(self):
        ref = self.enroll()[0].data["enrollment"]["reference"]
        r = self.pay(ref, razorpay_order_id="order_ABC123", razorpay_payment_id="pay_XYZ789", razorpay_signature="0" * 64)
        self.assertEqual(r.status_code, 402)
        self.assertEqual(Enrollment.objects.get().status, "failed")

    def test_pay_with_someone_elses_order_id_fails(self):
        ref = self.enroll()[0].data["enrollment"]["reference"]
        sig = sign("secret123", "order_OTHER|pay_XYZ789")
        r = self.pay(ref, razorpay_order_id="order_OTHER", razorpay_payment_id="pay_XYZ789", razorpay_signature=sig)
        self.assertEqual(r.status_code, 402)

    def test_pay_without_payload_fails(self):
        ref = self.enroll()[0].data["enrollment"]["reference"]
        self.assertEqual(self.pay(ref).status_code, 402)


@override_settings(**KEYS)
class RazorpayWebhookTests(APITestCase):
    def setUp(self):
        subj = Subject.objects.create(name="Maths")
        course = Course.objects.create(title="Algebra", subject=subj, description="d", fee=Decimal("100"))
        user = User.objects.create_user("a@example.com", "pw-12345-xyz", full_name="A")
        self.enrollment = Enrollment.objects.create(student=user, course=course, amount=100, gateway_order_id="order_ABC123")

    def send(self, event, order="order_ABC123", secret="whsec", signature=None):
        body = json.dumps({"event": event, "payload": {"payment": {"entity": {"id": "pay_1", "order_id": order}}}}).encode()
        sig = signature if signature is not None else sign(secret, body)
        return self.client.generic("POST", "/api/payments/razorpay/webhook/", body,
                                   content_type="application/json", HTTP_X_RAZORPAY_SIGNATURE=sig)

    def status(self):
        self.enrollment.refresh_from_db()
        return self.enrollment.status

    def test_captured_marks_paid(self):
        self.assertEqual(self.send("payment.captured").status_code, 200)
        self.assertEqual((self.status(), self.enrollment.payment_ref), ("paid", "pay_1"))
        self.assertIsNotNone(self.enrollment.paid_at)

    def test_captured_twice_is_idempotent(self):
        self.send("payment.captured"); first = self.enrollment.paid_at or Enrollment.objects.get().paid_at
        self.send("payment.captured")
        self.assertEqual(self.status(), "paid")
        self.assertEqual(Enrollment.objects.get().paid_at, first)

    def test_failed_marks_failed_but_never_downgrades_paid(self):
        self.send("payment.failed")
        self.assertEqual(self.status(), "failed")
        Enrollment.objects.filter(pk=self.enrollment.pk).update(status="paid")
        self.send("payment.failed")
        self.assertEqual(self.status(), "paid")

    def test_bad_or_missing_signature_rejected(self):
        self.assertEqual(self.send("payment.captured", signature="bad").status_code, 400)
        self.assertEqual(self.send("payment.captured", secret="wrong").status_code, 400)
        self.assertEqual(self.status(), "pending")

    def test_unknown_order_and_event_are_acknowledged(self):
        self.assertEqual(self.send("payment.captured", order="order_UNKNOWN").status_code, 200)
        self.assertEqual(self.send("order.paid").status_code, 200)
        self.assertEqual(self.status(), "pending")

    @override_settings(RAZORPAY_WEBHOOK_SECRET="")
    def test_webhook_rejects_everything_when_secret_not_set(self):
        self.assertEqual(self.send("payment.captured", secret="").status_code, 400)


class PaymentConfigTests(APITestCase):
    def test_reports_active_gateway_without_secrets(self):
        self.assertEqual(self.client.get("/api/payments/config/").data, {"gateway": "mock"})
        with override_settings(**KEYS):
            r = self.client.get("/api/payments/config/")
        self.assertEqual(r.data, {"gateway": "razorpay"})
