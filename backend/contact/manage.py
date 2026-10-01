"""Staff-only contact messages API (mounted at /api/manage/)."""
from django.db.models import Q
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsStaffRole
from courses.manage import ManagePagination

from .models import ContactMessage


class ContactMessageManageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ("id", "name", "email", "message", "is_handled", "created_at")
        read_only_fields = fields


class ContactMessageManageViewSet(viewsets.ReadOnlyModelViewSet):
    """List and mark handled/unhandled. No create/update/delete: messages come from the
    public contact form and are never edited, only triaged."""

    permission_classes = [IsStaffRole]
    pagination_class = ManagePagination
    serializer_class = ContactMessageManageSerializer

    def get_queryset(self):
        qs = ContactMessage.objects.all()
        p = self.request.query_params
        if p.get("handled") in ("true", "false"):
            qs = qs.filter(is_handled=p["handled"] == "true")
        if p.get("q"):
            qs = qs.filter(Q(name__icontains=p["q"]) | Q(email__icontains=p["q"]) | Q(message__icontains=p["q"]))
        return qs.order_by("-created_at")

    @action(detail=True, methods=["post"], url_path="mark-handled")
    def mark_handled(self, request, pk=None):
        msg = self.get_object()
        msg.is_handled = True
        msg.save(update_fields=["is_handled"])
        return Response(self.get_serializer(msg).data)

    @action(detail=True, methods=["post"], url_path="mark-unhandled")
    def mark_unhandled(self, request, pk=None):
        msg = self.get_object()
        msg.is_handled = False
        msg.save(update_fields=["is_handled"])
        return Response(self.get_serializer(msg).data)
