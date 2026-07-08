from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0009_mainactivityindicator"),
    ]

    operations = [
        migrations.CreateModel(
            name="TechnicalReport",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("title", models.CharField(max_length=500)),
                ("sub_sub_activities", models.JSONField(blank=True, default=list)),
                ("indicators", models.JSONField(blank=True, default=list)),
                ("reporting_period", models.CharField(blank=True, max_length=120)),
                ("start_date", models.DateField(blank=True, null=True)),
                ("end_date", models.DateField(blank=True, null=True)),
                (
                    "disbursed_amount",
                    models.DecimalField(decimal_places=2, default=0, max_digits=20),
                ),
                (
                    "utilized_amount",
                    models.DecimalField(decimal_places=2, default=0, max_digits=20),
                ),
                (
                    "percentage_utilization",
                    models.DecimalField(decimal_places=2, default=0, max_digits=5),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("Draft", "Draft"),
                            ("Submitted", "Submitted"),
                            ("Under Review", "Under Review"),
                            ("Approved", "Approved"),
                        ],
                        default="Draft",
                        max_length=20,
                    ),
                ),
                ("achievement", models.TextField(blank=True)),
                ("remarks", models.TextField(blank=True)),
                ("supporting_information", models.TextField(blank=True)),
                ("supporting_documents", models.JSONField(blank=True, default=list)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "main_activity",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="technical_reports",
                        to="projects.mainactivity",
                    ),
                ),
                (
                    "sub_activity",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="technical_reports",
                        to="projects.subactivity",
                    ),
                ),
            ],
            options={
                "verbose_name": "Technical Report",
                "verbose_name_plural": "Technical Reports",
                "ordering": ["-created_at"],
            },
        ),
    ]
