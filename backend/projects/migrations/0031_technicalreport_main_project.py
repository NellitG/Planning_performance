# Generated manually to preserve Main Project/report relationships for existing data.

import django.db.models.deletion
from django.db import migrations, models


def backfill_main_project(apps, schema_editor):
    TechnicalReport = apps.get_model("projects", "TechnicalReport")
    for report in TechnicalReport.objects.select_related("project__main_project_record").all().iterator():
        if report.project_id and report.project.main_project_record_id:
            report.main_project_id = report.project.main_project_record_id
            report.save(update_fields=["main_project"])


class Migration(migrations.Migration):
    dependencies = [("projects", "0030_mainproject_project_main_project_record")]

    operations = [
        migrations.AddField(
            model_name="technicalreport",
            name="main_project",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="technical_reports", to="projects.mainproject"),
        ),
        migrations.RunPython(backfill_main_project, migrations.RunPython.noop),
    ]
