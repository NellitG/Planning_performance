from django.db import migrations, models


FUNDING_TYPES = [
    "Grant",
    "Loan",
    "Government Allocation",
    "Donor Funding",
    "Own Revenue",
    "Public-Private Partnership",
    "Other",
]


def create_funding_types(apps, schema_editor):
    FundingType = apps.get_model("user_management", "FundingType")
    database = schema_editor.connection.alias
    for name in FUNDING_TYPES:
        FundingType.objects.using(database).get_or_create(name=name)


class Migration(migrations.Migration):
    dependencies = [
        ("user_management", "0009_standardize_workflow_roles"),
    ]

    operations = [
        migrations.CreateModel(
            name="FundingType",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100, unique=True)),
                ("active", models.BooleanField(default=True)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.RunPython(create_funding_types, migrations.RunPython.noop),
    ]
