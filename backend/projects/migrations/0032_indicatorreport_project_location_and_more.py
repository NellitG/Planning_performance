import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0031_technicalreport_main_project'),
    ]

    operations = [
        migrations.AddField(
            model_name='indicatorreport',
            name='project_location',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='indicator_reports', to='projects.projectlocation'),
        ),
        migrations.AddConstraint(
            model_name='indicatorreport',
            constraint=models.UniqueConstraint(fields=('technical_report', 'project_location', 'indicator_id'), name='unique_indicator_report_per_report_location'),
        ),
    ]
