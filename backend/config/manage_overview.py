"""Staff-only dashboard overview (mounted at /api/manage/overview/).

Small aggregation across accounts, courses, enrollments and contact, so it lives
outside any one app rather than bending an app boundary to hold it.
"""
from django.db.models import Sum
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.permissions import IsStaffRole
from contact.models import ContactMessage
from courses.models import Course
from enrollments.models import Enrollment
from enrollments.services import current_month_range


class OverviewView(APIView):
    permission_classes = [IsStaffRole]

    def get(self, request):
        start, end = current_month_range()
        revenue_this_month = Enrollment.objects.filter(
            status="paid", paid_at__gte=start, paid_at__lt=end,
        ).aggregate(v=Sum("amount"))["v"] or 0
        recent_messages = ContactMessage.objects.order_by("-created_at")[:5]
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
        })
