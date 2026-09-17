from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("projects", "0026_technicalreport_status")]

    operations = [
        migrations.AddField(
            model_name="indicatorreport",
            name="ward",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="indicator_reports", to="projects.ward"),
        ),
        migrations.RemoveConstraint(model_name="indicatorreport", name="unique_indicator_report_per_technical_report"),
        migrations.AddConstraint(
            model_name="indicatorreport",
            constraint=models.UniqueConstraint(fields=("technical_report", "ward", "indicator_id"), name="unique_indicator_report_per_report_ward"),
        ),
    ]
