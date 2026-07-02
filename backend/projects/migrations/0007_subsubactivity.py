from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0006_subactivity_category_value_chain"),
    ]

    operations = [
        migrations.CreateModel(
            name="SubSubActivity",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("value_chain", models.CharField(blank=True, max_length=120)),
                ("name", models.CharField(blank=True, max_length=500)),
                ("approved_activity_budget", models.DecimalField(decimal_places=2, max_digits=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("sub_activity", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="sub_sub_activities", to="projects.subactivity")),
            ],
            options={
                "verbose_name": "Sub-Sub Activity",
                "verbose_name_plural": "Sub-Sub Activities",
                "ordering": ["-created_at"],
            },
        ),
    ]
