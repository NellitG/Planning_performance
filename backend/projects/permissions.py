from rest_framework.permissions import BasePermission, SAFE_METHODS


def has_role(user, *keys):
    return bool(getattr(user, "account", None) and (user.account.roles.filter(key__in=keys).exists() or user.account.role in keys))


class ProjectPermission(BasePermission):
    def has_permission(self, request, view):
        if has_role(request.user, "system_admin"):
            return True
        # Coordinators may inspect projects but cannot create/edit them.
        return request.method in SAFE_METHODS and has_role(request.user, "project_coordinator")


class ReportPermission(BasePermission):
    def has_permission(self, request, view):
        return has_role(request.user, "system_admin", "value_chain_lead", "accountant", "project_coordinator", "me")


class IsAuthenticatedOrReadOnly(BasePermission):
    """Allow read for everyone, writes for authenticated users.

    The frontend currently uses a mock auth layer, so the project-wide
    default permission is AllowAny. This class is provided for endpoints
    that should later be locked down without further refactoring.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)
