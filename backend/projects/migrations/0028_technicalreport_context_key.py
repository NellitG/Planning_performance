from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("projects", "0027_indicatorreport_ward")]

    operations = [
        migrations.AddField(
            model_name="technicalreport",
            name="context_key",
            field=models.CharField(blank=True, max_length=64, null=True, unique=True),
        ),
    ]
