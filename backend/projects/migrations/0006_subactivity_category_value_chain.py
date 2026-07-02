from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0005_project_background_project_collaborators_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="subactivity",
            name="category",
            field=models.CharField(
                blank=True,
                choices=[
                    ("Value Chain", "Value Chain"),
                    ("Project Coordination", "Project Coordination"),
                    ("ICT", "ICT"),
                ],
                max_length=50,
            ),
        ),
        migrations.AddField(
            model_name="subactivity",
            name="value_chain",
            field=models.CharField(blank=True, max_length=120),
        ),
    ]
