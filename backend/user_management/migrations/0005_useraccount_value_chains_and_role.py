# Generated for Value Chain Lead assignments.

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("user_management", "0004_department_useraccount_department")]

    operations = [
        migrations.AlterField(
            model_name="useraccount",
            name="role",
            field=models.CharField(
                choices=[
                    ("system_admin", "System Admin"),
                    ("national_me", "National M&E"),
                    ("high_level", "High Level"),
                    ("business_logic", "Business Logic"),
                    ("project_manager", "Project Manager"),
                    ("department_head", "Department Head"),
                    ("staff_user", "Staff User"),
                    ("value_chain_leads", "Value Chain Leads"),
                ],
                max_length=50,
            ),
        ),
        migrations.AddField(
            model_name="useraccount",
            name="value_chains",
            field=models.ManyToManyField(blank=True, related_name="value_chain_leads", to="user_management.valuechain"),
        ),
    ]
