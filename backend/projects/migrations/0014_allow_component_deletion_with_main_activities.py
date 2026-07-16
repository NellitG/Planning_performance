from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0013_technicalreport_category_value_chain_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="mainactivity",
            name="sub_component",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="main_activities",
                to="projects.projectsubcomponent",
            ),
        ),
    ]
