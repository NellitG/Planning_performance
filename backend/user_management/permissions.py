from rest_framework.permissions import AllowAny


class UserManagementPermission(AllowAny):
    """Development permission hook for User Management endpoints."""

