"""Payment gateway seam.

Razorpay (or another gateway) is added later. Until then `MockGateway` marks a
payment as successful immediately so the enrollment flow can be built and
tested end to end. To integrate a real gateway, implement `create_order` and
`verify` and point `get_gateway()` at it.
"""
import uuid


class MockGateway:
    name = "mock"

    def create_order(self, enrollment):
        return {"gateway": self.name, "order_id": f"mock_{uuid.uuid4().hex[:12]}", "amount": str(enrollment.amount)}

    def verify(self, enrollment, payload):
        # Mock: always succeeds. Real gateways must verify a signature here.
        return True, payload.get("order_id") or f"mock_{uuid.uuid4().hex[:12]}"


def get_gateway():
    return MockGateway()
