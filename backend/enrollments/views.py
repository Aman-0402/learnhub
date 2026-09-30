from django.db import transaction
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from courses.models import Course

from .models import Enrollment
from .payments import get_gateway
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
        order = get_gateway().create_order(enrollment)
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

        course = enrollment.course
        if course.seats is not None and course.enrollments.filter(status="paid").count() >= course.seats:
            return Response({"detail": "This course is full."}, status=400)

        ok, ref = get_gateway().verify(enrollment, request.data)
        if not ok:
            enrollment.status = "failed"
            enrollment.save(update_fields=["status"])
            return Response({"detail": "Payment verification failed."}, status=402)

        enrollment.status = "paid"
        enrollment.payment_ref = ref
        enrollment.paid_at = timezone.now()
        enrollment.save(update_fields=["status", "payment_ref", "paid_at"])
        return Response(EnrollmentSerializer(enrollment).data)


class MyEnrollmentsView(generics.ListAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return Enrollment.objects.filter(student=self.request.user, status="paid").select_related("course__subject")
