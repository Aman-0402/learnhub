from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from courses.models import Course

from .models import Enrollment
from .payments import PaymentError, get_gateway, verify_razorpay_webhook
from .services import mark_failed, mark_paid
from .serializers import EnrollCreateSerializer, EnrollmentSerializer


class EnrollView(APIView):
    """Create (or reuse) a pending enrollment and return a payment order."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ser = EnrollCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            course = Course.objects.get(pk=ser.validated_data["course"], is_published=True)
        except Course.DoesNotExist:
            return Response({"detail": "Course not found."}, status=404)

        if Enrollment.objects.filter(student=request.user, course=course, status="paid").exists():
            return Response({"detail": "You are already enrolled in this course."}, status=400)

        if course.seats is not None and course.enrollments.filter(status="paid").count() >= course.seats:
            return Response({"detail": "This course is full."}, status=400)

        enrollment, _ = Enrollment.objects.get_or_create(
            student=request.user, course=course, status="pending", defaults={"amount": course.fee}
        )
        try:
            order = get_gateway().create_order(enrollment)
        except PaymentError as e:
            return Response({"detail": f"Payment could not be started. {e}"}, status=502)
        return Response(
            {"enrollment": EnrollmentSerializer(enrollment).data, "order": order},
            status=status.HTTP_201_CREATED,
        )


class PayView(APIView):
    """Confirm payment for a pending enrollment."""

    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, reference):
        try:
            enrollment = Enrollment.objects.select_for_update().select_related("course").get(
                reference=reference, student=request.user
            )
        except Enrollment.DoesNotExist:
            return Response({"detail": "Enrollment not found."}, status=404)

        if enrollment.status == "paid":
            return Response(EnrollmentSerializer(enrollment).data)

        if Enrollment.objects.filter(student=request.user, course=enrollment.course, status="paid").exists():
            return Response({"detail": "You are already enrolled in this course."}, status=400)

        course = enrollment.course
        if course.seats is not None and course.enrollments.filter(status="paid").count() >= course.seats:
            return Response({"detail": "This course is full."}, status=400)

        try:
            ok, ref = get_gateway().verify(enrollment, request.data)
        except PaymentError as e:
            return Response({"detail": str(e)}, status=502)
        if not ok:
            mark_failed(enrollment)
            return Response({"detail": "Payment verification failed."}, status=402)

        mark_paid(enrollment, ref)
        return Response(EnrollmentSerializer(enrollment).data)


class MyEnrollmentsView(generics.ListAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return Enrollment.objects.filter(student=self.request.user, status="paid").select_related("course__subject")


class RazorpayWebhookView(APIView):
    """Razorpay calls this when a payment succeeds or fails, even if the student closed the browser.

    Configure it in the Razorpay dashboard: URL /api/payments/razorpay/webhook/,
    events payment.captured and payment.failed, secret = RAZORPAY_WEBHOOK_SECRET.
    """

    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not verify_razorpay_webhook(request.body, request.headers.get("X-Razorpay-Signature", "")):
            return Response({"detail": "Invalid signature."}, status=400)

        event = request.data.get("event", "")
        entity = (request.data.get("payload", {}).get("payment", {}) or {}).get("entity", {}) or {}
        order_id = entity.get("order_id", "")
        enrollment = Enrollment.objects.filter(gateway_order_id=order_id).first() if order_id else None
        if enrollment is None:
            return Response({"detail": "Ignored."})  # unknown order: acknowledge so Razorpay stops retrying

        if event == "payment.captured":
            mark_paid(enrollment, entity.get("id", ""))
        elif event == "payment.failed":
            mark_failed(enrollment)
        return Response({"detail": "OK."})


class PaymentConfigView(APIView):
    """Tells the frontend which gateway is active (never exposes secrets)."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from django.conf import settings

        return Response({"gateway": "razorpay" if settings.PAYMENT_GATEWAY == "razorpay" else "mock"})
