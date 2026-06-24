from rest_framework.permissions import BasePermission, SAFE_METHODS


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
