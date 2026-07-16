from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0012_project_components_activity_indicators"),
    ]

    operations = [
        migrations.AlterField(
            model_name="mainactivityindicator",
            name="category",
            field=models.CharField(
                choices=[
                    ("ICT", "ICT"),
                    ("Value Chain", "Value Chain"),
                    ("Thematic Area", "Thematic Area"),
                    ("Project Coordination", "Project Coordination"),
                ],
                default="ICT",
                max_length=40,
            ),
        ),
        migrations.AlterField(
            model_name="subactivity",
            name="category",
            field=models.CharField(
                blank=True,
                choices=[
                    ("Value Chain", "Value Chain"),
                    ("Project Coordination", "Project Coordination"),
                    ("ICT", "ICT"),
                    ("Thematic Area", "Thematic Area"),
                ],
                max_length=50,
            ),
        ),
        migrations.AddField(
            model_name="technicalreport",
            name="category",
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name="technicalreport",
            name="value_chain",
            field=models.CharField(blank=True, max_length=120),
        ),
    ]
