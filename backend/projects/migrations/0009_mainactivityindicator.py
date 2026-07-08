from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0008_outcome_outputindicator_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="MainActivityIndicator",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("category", models.CharField(choices=[("ICT", "ICT"), ("Value Chain", "Value Chain"), ("Project Coordination", "Project Coordination")], default="ICT", max_length=40)),
                ("value_chain", models.CharField(blank=True, max_length=120)),
                ("indicator", models.CharField(max_length=500)),
                ("target", models.CharField(blank=True, max_length=500)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("main_activity", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="indicators", to="projects.mainactivity")),
            ],
            options={
                "verbose_name": "Main Activity Indicator",
                "verbose_name_plural": "Main Activity Indicators",
                "ordering": ["created_at"],
            },
        ),
    ]
