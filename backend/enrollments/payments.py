"""Payment gateways.

`get_gateway()` returns the gateway chosen by settings.PAYMENT_GATEWAY:

- "mock" (default): marks payments as successful without charging anyone.
- "razorpay": creates a Razorpay order, verifies the checkout signature, and
  verifies webhook signatures. Needs RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET
  (and RAZORPAY_WEBHOOK_SECRET for webhooks) in the environment.

Every gateway implements the same two methods, so views never depend on a
specific provider:

    create_order(enrollment) -> dict   # sent to the frontend to start checkout
    verify(enrollment, payload) -> (ok: bool, payment_ref: str)
"""
import base64
import hashlib
import hmac
import json
import urllib.error
import urllib.request
import uuid

from django.conf import settings

RAZORPAY_API = "https://api.razorpay.com/v1"


class PaymentError(Exception):
    """The gateway could not complete a request (network error, bad keys, rejected order)."""


class BaseGateway:
    name = "base"

    def create_order(self, enrollment):
        raise NotImplementedError

    def verify(self, enrollment, payload):
        raise NotImplementedError


class MockGateway(BaseGateway):
    name = "mock"

    def create_order(self, enrollment):
        return {"gateway": self.name, "order_id": f"mock_{uuid.uuid4().hex[:12]}", "amount": str(enrollment.amount)}

    def verify(self, enrollment, payload):
        # Mock: always succeeds. Real gateways must verify a signature here.
        return True, payload.get("order_id") or f"mock_{uuid.uuid4().hex[:12]}"


def _signature(secret, message):
    return hmac.new(secret.encode(), message.encode() if isinstance(message, str) else message, hashlib.sha256).hexdigest()


class RazorpayGateway(BaseGateway):
    name = "razorpay"

    def __init__(self):
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = settings.RAZORPAY_KEY_SECRET
        if not (self.key_id and self.key_secret):
            raise PaymentError("Razorpay keys are not configured.")

    # -- HTTP -------------------------------------------------------------
    def _post(self, path, body):
        """POST JSON to the Razorpay API with basic auth. Isolated so tests can replace it."""
        token = base64.b64encode(f"{self.key_id}:{self.key_secret}".encode()).decode()
        req = urllib.request.Request(
            f"{RAZORPAY_API}{path}",
            data=json.dumps(body).encode(),
            headers={"Content-Type": "application/json", "Authorization": f"Basic {token}"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                return json.load(resp)
        except urllib.error.HTTPError as e:
            raise PaymentError(f"Razorpay rejected the request ({e.code}).") from e
        except (urllib.error.URLError, TimeoutError) as e:
            raise PaymentError("Could not reach Razorpay.") from e

    # -- Gateway interface ------------------------------------------------
    def create_order(self, enrollment):
        paise = int(round(enrollment.amount * 100))  # Razorpay amounts are in the smallest unit (paise)
        order = self._post("/orders", {
            "amount": paise,
            "currency": "INR",
            "receipt": str(enrollment.reference),
            "notes": {"enrollment": str(enrollment.reference), "course": enrollment.course.title[:100]},
        })
        enrollment.gateway_order_id = order["id"]
        enrollment.save(update_fields=["gateway_order_id"])
        return {"gateway": self.name, "order_id": order["id"], "amount": paise, "currency": "INR", "key_id": self.key_id}

    def verify(self, enrollment, payload):
        """Verify the signature Razorpay Checkout returns to the browser."""
        order_id = payload.get("razorpay_order_id", "")
        payment_id = payload.get("razorpay_payment_id", "")
        signature = payload.get("razorpay_signature", "")
        if not (order_id and payment_id and signature) or order_id != enrollment.gateway_order_id:
            return False, ""
        expected = _signature(self.key_secret, f"{order_id}|{payment_id}")
        return hmac.compare_digest(expected, signature), payment_id


def verify_razorpay_webhook(raw_body: bytes, signature: str) -> bool:
    """Check the X-Razorpay-Signature header against the raw request body."""
    secret = settings.RAZORPAY_WEBHOOK_SECRET
    if not (secret and signature):
        return False
    return hmac.compare_digest(_signature(secret, raw_body), signature)


def get_gateway():
    return RazorpayGateway() if settings.PAYMENT_GATEWAY == "razorpay" else MockGateway()
