# Generated for the KALRO PPM User Management module.

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="StrategicPlanDocument",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("document_title", models.CharField(max_length=255)),
                (
                    "uploaded_file",
                    models.FileField(
                        upload_to="strategic_plan/",
                        validators=[
                            django.core.validators.FileExtensionValidator(
                                allowed_extensions=["pdf", "doc", "docx", "xls", "xlsx"]
                            )
                        ],
                    ),
                ),
                ("uploaded_by", models.CharField(blank=True, max_length=255)),
                ("date_uploaded", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Strategic Plan Document",
                "verbose_name_plural": "Strategic Plan Documents",
                "ordering": ["-date_uploaded"],
            },
        ),
        migrations.CreateModel(
            name="UserAccount",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("full_name", models.CharField(max_length=255)),
                ("email", models.EmailField(max_length=254, unique=True)),
                (
                    "role",
                    models.CharField(
                        choices=[
                            ("system_admin", "System Admin"),
                            ("national_me", "National M&E"),
                            ("high_level", "High Level"),
                            ("business_logic", "Business Logic"),
                            ("project_manager", "Project Manager"),
                            ("department_head", "Department Head"),
                            ("staff_user", "Staff User"),
                        ],
                        max_length=50,
                    ),
                ),
                ("institute", models.CharField(max_length=255)),
                ("password", models.CharField(max_length=255)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "User",
                "verbose_name_plural": "Users",
                "ordering": ["full_name"],
            },
        ),
        migrations.CreateModel(
            name="ValueChain",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255, unique=True)),
                (
                    "category",
                    models.CharField(
                        choices=[("Crops", "Crops"), ("Fisheries", "Fisheries"), ("Livestock", "Livestock")],
                        max_length=30,
                    ),
                ),
                (
                    "priority",
                    models.CharField(
                        choices=[("High", "High"), ("Medium", "Medium"), ("Low", "Low")],
                        default="Medium",
                        max_length=20,
                    ),
                ),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Value Chain",
                "verbose_name_plural": "Value Chains",
                "ordering": ["name"],
            },
        ),
    ]
