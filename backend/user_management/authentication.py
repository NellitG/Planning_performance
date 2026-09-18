"""Database-backed bearer-token authentication for UserAccount."""
import secrets
from django.utils import timezone
from rest_framework import authentication, exceptions
from .models import UserSession


class AccountPrincipal:
    def __init__(self, account):
        self.account = account
        self.pk = account.pk
        self.is_authenticated = True
        self.is_anonymous = False

    def __getattr__(self, name):
        return getattr(self.account, name)


class AccountTokenAuthentication(authentication.BaseAuthentication):
    keyword = "Bearer"

    def authenticate(self, request):
        header = authentication.get_authorization_header(request).decode("utf-8")
        if not header:
            return None
        prefix, _, token = header.partition(" ")
        if prefix.lower() != self.keyword.lower() or not token:
            raise exceptions.AuthenticationFailed("Invalid authorization header.")
        session = UserSession.objects.select_related("user").filter(token=token, revoked_at__isnull=True).first()
        if not session or not session.user.is_active:
            raise exceptions.AuthenticationFailed("Invalid or expired session.")
        session.last_used_at = timezone.now()
        session.save(update_fields=["last_used_at"])
        return AccountPrincipal(session.user), token


def create_session(account):
    return UserSession.objects.create(user=account, token=secrets.token_urlsafe(32))
