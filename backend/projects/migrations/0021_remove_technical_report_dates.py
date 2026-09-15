from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [("projects", "0020_geography")]

    operations = [
        migrations.RemoveField(model_name="technicalreport", name="start_date"),
        migrations.RemoveField(model_name="technicalreport", name="end_date"),
    ]