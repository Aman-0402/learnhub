from rest_framework.permissions import BasePermission


class IsStaffRole(BasePermission):
    """Staff and super admins (by `User.role`). Anonymous requests get 401, students get 403."""

    message = "Staff access required."

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.role in ("staff", "superadmin"))


class IsSuperAdminRole(BasePermission):
    """Super admins only. Used for actions that change another user's access, such as role changes."""

    message = "Super admin access required."

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.role == "superadmin")
