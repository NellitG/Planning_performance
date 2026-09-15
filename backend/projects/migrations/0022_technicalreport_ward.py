from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("projects", "0021_remove_technical_report_dates")]

    operations = [
        migrations.AddField(
            model_name="technicalreport",
            name="ward",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="technical_reports", to="projects.ward"),
        ),
    ]