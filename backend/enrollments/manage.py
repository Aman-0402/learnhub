"""Staff-only enrollments and payments API (mounted at /api/manage/)."""
from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsStaffRole
from courses.manage import ManagePagination

from .models import Enrollment
from .services import mark_failed as mark_failed_service
from .services import mark_paid as mark_paid_service


class EnrollmentManageSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    student_email = serializers.CharField(source="student.email", read_only=True)
    course_title = serializers.CharField(source="course.title", read_only=True)
    batch_label = serializers.CharField(source="batch.label", read_only=True, default="")

    class Meta:
        model = Enrollment
        fields = (
            "id", "reference", "student", "student_name", "student_email", "course", "course_title",
            "batch", "batch_label", "status", "amount", "payment_ref", "gateway_order_id", "created_at", "paid_at",
        )
        read_only_fields = fields


class EnrollmentManageViewSet(viewsets.ReadOnlyModelViewSet):
    """List, filter and manually settle enrollments. No create/update/delete: enrollments
    are created by the student checkout flow; status changes go through the mark-paid /
    mark-failed actions below so the service functions' email and idempotency rules apply."""

    permission_classes = [IsStaffRole]
    pagination_class = ManagePagination
    serializer_class = EnrollmentManageSerializer

    def get_queryset(self):
        qs = Enrollment.objects.select_related("student", "course", "batch")
        p = self.request.query_params
        if p.get("status") in ("pending", "paid", "failed"):
            qs = qs.filter(status=p["status"])
        if p.get("course"):
            qs = qs.filter(course_id=p["course"])
        if p.get("q"):
            qs = qs.filter(
                Q(student__full_name__icontains=p["q"]) | Q(student__email__icontains=p["q"])
                | Q(course__title__icontains=p["q"]) | Q(payment_ref__icontains=p["q"])
            )
        start, end = p.get("start"), p.get("end")
        if start:
            qs = qs.filter(created_at__date__gte=start)
        if end:
            qs = qs.filter(created_at__date__lte=end)
        return qs.order_by("-created_at", "-id")

    @action(detail=True, methods=["post"], url_path="mark-paid")
    def mark_paid(self, request, pk=None):
        enrollment = self.get_object()
        payment_ref = (request.data.get("payment_ref") or "").strip() or f"manual-{request.user.email}"
        mark_paid_service(enrollment, payment_ref)
        return Response(self.get_serializer(enrollment).data)

    @action(detail=True, methods=["post"], url_path="mark-failed")
    def mark_failed(self, request, pk=None):
        enrollment = self.get_object()
        mark_failed_service(enrollment)
        return Response(self.get_serializer(enrollment).data)

    @action(detail=False, methods=["get"])
    def summary(self, request):
        paid = Enrollment.objects.filter(status="paid")
        now = timezone.now()
        this_month = paid.filter(paid_at__year=now.year, paid_at__month=now.month)
        by_course = (
            paid.values("course_id", "course__title")
            .annotate(paid_count=Count("id"), total=Sum("amount"))
            .order_by("-total")
        )
        return Response({
            "total_paid": paid.aggregate(v=Sum("amount"))["v"] or 0,
            "total_paid_count": paid.count(),
            "this_month": this_month.aggregate(v=Sum("amount"))["v"] or 0,
            "this_month_count": this_month.count(),
            "pending_count": Enrollment.objects.filter(status="pending").count(),
            "by_course": [
                {"course_id": r["course_id"], "course_title": r["course__title"], "paid_count": r["paid_count"], "total": r["total"]}
                for r in by_course
            ],
        })
