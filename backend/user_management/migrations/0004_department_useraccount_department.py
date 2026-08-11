from django.db import migrations, models
import django.db.models.deletion


DEPARTMENTS = [
    "Crop Systems",
    "Livestock Systems",
    "Environment and Natural Resource Management",
    "Socio-economics and Policy Development",
    "Knowledge, Information and Outreach",
    "Agricultural Research Fund and Donor Funds",
    "Planning Performance Management and Quality Control",
    "Partnership and Business Development",
    "Human Resource and Administration",
    "Finance and Accounts",
    "Information and Communication Technology",
    "Supply Chain Management",
    "Corporate Communication",
    "Internal Audit",
    "Legal Services",
]


def seed_departments(apps, schema_editor):
    Department = apps.get_model("user_management", "Department")
    for name in DEPARTMENTS:
        Department.objects.get_or_create(name=name)


class Migration(migrations.Migration):
    dependencies = [("user_management", "0003_useraccount_reference_locations")]

    operations = [
        migrations.CreateModel(
            name="Department",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255, unique=True)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.AddField(
            model_name="useraccount",
            name="department",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="users", to="user_management.department"),
        ),
        migrations.RunPython(seed_departments, migrations.RunPython.noop),
    ]
