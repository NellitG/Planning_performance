from django.db import migrations


ROLES = [
    ("value_chain_lead", "Value Chain Lead"), ("accountant", "Accountant"),
    ("project_coordinator", "Project-Coordinator"), ("me", "M&E"),
    ("principal_investigator", "Principal Investigator"),
    ("co_principal_investigator", "Co-principal investigator"),
    ("staff_user", "Staff User"), ("system_admin", "System admin"),
]


def standardize(apps, schema_editor):
    Role = apps.get_model("user_management", "Role")
    Role.objects.exclude(key__in=[key for key, _ in ROLES]).delete()
    for key, name in ROLES:
        Role.objects.update_or_create(key=key, defaults={"name": name})


class Migration(migrations.Migration):
    dependencies = [("user_management", "0008_alter_useraccount_role")]
    operations = [migrations.RunPython(standardize, migrations.RunPython.noop)]
