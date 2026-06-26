from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0003_main_activity_sub_activity"),
    ]

    operations = [
        migrations.AddField(
            model_name="subactivity",
            name="main_activity",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="sub_activities",
                to="projects.mainactivity",
                null=True,
            ),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name="subactivity",
            name="main_activity",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="sub_activities",
                to="projects.mainactivity",
            ),
        ),
    ]
