"""Staff-only dashboard overview (mounted at /api/manage/overview/).

Small aggregation across accounts, courses, enrollments and contact, so it lives
outside any one app rather than bending an app boundary to hold it.
"""
from django.db.models import Count, F, Q, Sum
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.permissions import IsStaffRole
from contact.models import ContactMessage
from courses.models import Course
from enrollments.models import Enrollment
from enrollments.services import current_month_range, month_ranges

LOW_SEATS_THRESHOLD = 3


class OverviewView(APIView):
    permission_classes = [IsStaffRole]

    def get(self, request):
        start, end = current_month_range()
        revenue_this_month = Enrollment.objects.filter(
            status="paid", paid_at__gte=start, paid_at__lt=end,
        ).aggregate(v=Sum("amount"))["v"] or 0
        recent_messages = ContactMessage.objects.order_by("-created_at")[:5]

        revenue_trend = []
        for m_start, m_end in month_ranges(6):
            row = Enrollment.objects.filter(status="paid", paid_at__gte=m_start, paid_at__lt=m_end).aggregate(
                total=Sum("amount"), count=Count("id"),
            )
            revenue_trend.append({"month": m_start.strftime("%b %Y"), "total": row["total"] or 0, "count": row["count"]})

        top_courses = (
            Enrollment.objects.filter(status="paid")
            .values("course_id", "course__title")
            .annotate(total=Sum("amount"), count=Count("id"))
            .order_by("-total")[:5]
        )

        low_seats = (
            Course.objects.filter(is_published=True, seats__isnull=False)
            .annotate(paid_count=Count("enrollments", filter=Q(enrollments__status="paid")))
            .annotate(seats_left=F("seats") - F("paid_count"))
            .filter(seats_left__lte=LOW_SEATS_THRESHOLD, seats_left__gte=0)
            .order_by("seats_left")[:5]
        )

        return Response({
            "students_count": User.objects.filter(role=User.Role.STUDENT).count(),
            "active_courses": Course.objects.filter(is_published=True).count(),
            "pending_enrollments": Enrollment.objects.filter(status="pending").count(),
            "revenue_this_month": revenue_this_month,
            "unhandled_messages": ContactMessage.objects.filter(is_handled=False).count(),
            "recent_messages": [
                {"id": m.id, "name": m.name, "email": m.email, "is_handled": m.is_handled, "created_at": m.created_at}
                for m in recent_messages
            ],
            "revenue_trend": revenue_trend,
            "top_courses": [
                {"course_id": r["course_id"], "course_title": r["course__title"], "total": r["total"], "count": r["count"]}
                for r in top_courses
            ],
            "low_seats": [
                {"course_id": c.id, "course_title": c.title, "slug": c.slug, "seats_left": c.seats_left}
                for c in low_seats
            ],
        })
