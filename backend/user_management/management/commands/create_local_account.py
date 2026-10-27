import getpass

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.core.management.base import BaseCommand, CommandError

from user_management.models import UserAccount


class Command(BaseCommand):
    help = "Create a local system administrator account (DEBUG mode only)."

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("This command is available only when DEBUG=True.")

        self.stdout.write("Create a local system administrator account.")
        full_name = self._read_required("Full name: ")
        email = self._read_required("Email: ").lower()
        try:
            validate_email(email)
        except ValidationError as exc:
            raise CommandError("Enter a valid email address.") from exc

        if UserAccount.objects.filter(email__iexact=email).exists():
            raise CommandError("A user with this email already exists.")

        institute = self._read_required("Institute/organization: ")
        password = getpass.getpass("Password (minimum 8 characters): ")
        confirmation = getpass.getpass("Confirm password: ")
        if len(password) < 8:
            raise CommandError("Password must be at least 8 characters long.")
        if password != confirmation:
            raise CommandError("Passwords do not match.")

        UserAccount.objects.create(
            full_name=full_name,
            email=email,
            role="system_admin",
            institute=institute,
            password=make_password(password),
            is_active=True,
        )
        self.stdout.write(self.style.SUCCESS(f"Created local account for {email}."))

    def _read_required(self, prompt):
        value = input(prompt).strip()
        if not value:
            raise CommandError(f"{prompt.rstrip(': ')} is required.")
        return value
