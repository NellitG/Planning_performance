from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("user_management", "0002_reference_data")]

    operations = [
        migrations.AddField(
            model_name="useraccount",
            name="institute_reference",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="users", to="user_management.institute"),
        ),
        migrations.AddField(
            model_name="useraccount",
            name="centre",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="users", to="user_management.centre"),
        ),
        migrations.AddField(
            model_name="useraccount",
            name="sub_centre",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="users", to="user_management.subcentre"),
        ),
    ]
