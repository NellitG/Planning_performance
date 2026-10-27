from io import StringIO
from unittest.mock import patch

from django.contrib.auth.hashers import check_password
from django.contrib.auth.models import User
from django.core.management import call_command, CommandError
from django.test import Client, TestCase, override_settings

from .models import UserAccount


class CreateLocalAccountCommandTests(TestCase):
    @override_settings(DEBUG=False)
    def test_command_is_rejected_when_debug_is_disabled(self):
        with patch("builtins.input") as prompt:
            with self.assertRaisesMessage(CommandError, "available only when DEBUG=True"):
                call_command("create_local_account")
        prompt.assert_not_called()
        self.assertFalse(UserAccount.objects.exists())

    @override_settings(DEBUG=True)
    @patch("builtins.input", side_effect=["Local Developer", "local@example.test", "Local Institute"])
    @patch("user_management.management.commands.create_local_account.getpass.getpass")
    def test_command_creates_active_system_admin_with_hashed_password(self, get_password, prompt):
        get_password.side_effect = ["safe-local-password", "safe-local-password"]
        output = StringIO()

        call_command(
            "create_local_account",
            stdout=output,
        )

        account = UserAccount.objects.get(email="local@example.test")
        self.assertEqual(account.role, "system_admin")
        self.assertTrue(account.is_active)
        self.assertTrue(check_password("safe-local-password", account.password))
        self.assertNotIn("safe-local-password", output.getvalue())


class LoginCsrfTests(TestCase):
    def test_login_does_not_require_session_csrf_for_token_authentication(self):
        client = Client(enforce_csrf_checks=True)
        client.force_login(User.objects.create_user(username="admin"))

        response = client.post(
            "/api/auth/login/",
            data={"email": "missing@example.test", "password": "irrelevant"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json(), {"detail": "Invalid email or password."})
