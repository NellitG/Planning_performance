from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0011_remove_project_completion_rate_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProjectComponent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=500, unique=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Project Component",
                "verbose_name_plural": "Project Components",
                "ordering": ["name"],
            },
        ),
        migrations.CreateModel(
            name="ProjectSubComponent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=500)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "component",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="sub_components", to="projects.projectcomponent"),
                ),
            ],
            options={
                "verbose_name": "Project Sub Component",
                "verbose_name_plural": "Project Sub Components",
                "ordering": ["component__name", "name"],
                "unique_together": {("component", "name")},
            },
        ),
        migrations.AddField(
            model_name="mainactivity",
            name="sub_component",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="main_activities",
                to="projects.projectsubcomponent",
            ),
        ),
        migrations.CreateModel(
            name="ActivityIndicator",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("indicator", models.CharField(max_length=500)),
                ("target", models.CharField(max_length=500)),
                ("unit_of_measure", models.CharField(max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "sub_activity",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="activity_indicators", to="projects.subactivity"),
                ),
            ],
            options={
                "verbose_name": "Indicator",
                "verbose_name_plural": "Indicators",
                "ordering": ["-created_at"],
            },
        ),
    ]
