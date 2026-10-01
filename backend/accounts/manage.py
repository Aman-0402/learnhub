"""Staff-only user directory API (mounted at /api/manage/)."""
from django.db.models import Q
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from courses.manage import ManagePagination

from .models import User
from .permissions import IsStaffRole, IsSuperAdminRole


class UserManageSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "full_name", "phone", "role", "is_active", "date_joined")
        read_only_fields = fields


class RoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=User.Role.choices)


class UserManageViewSet(viewsets.ReadOnlyModelViewSet):
    """List the directory and, for super admins only, change a user's role. No create/update/
    delete here: accounts are created through registration and never edited by staff."""

    pagination_class = ManagePagination
    serializer_class = UserManageSerializer

    def get_permissions(self):
        if self.action == "set_role":
            return [IsSuperAdminRole()]
        return [IsStaffRole()]

    def get_queryset(self):
        qs = User.objects.all()
        p = self.request.query_params
        if p.get("role") in ("student", "staff", "superadmin"):
            qs = qs.filter(role=p["role"])
        if p.get("q"):
            qs = qs.filter(Q(full_name__icontains=p["q"]) | Q(email__icontains=p["q"]))
        return qs.order_by("-date_joined")

    @action(detail=True, methods=["post"], url_path="set-role")
    def set_role(self, request, pk=None):
        user = self.get_object()
        serializer = RoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_role = serializer.validated_data["role"]
        if user == request.user and new_role != User.Role.SUPERADMIN:
            raise serializers.ValidationError({"role": "You cannot remove your own super admin access."})
        user.role = new_role
        user.save()
        return Response(self.get_serializer(user).data)
