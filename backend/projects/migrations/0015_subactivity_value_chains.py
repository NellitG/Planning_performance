from django.db import migrations, models
import django.db.models.deletion


def copy_legacy_value_chains(apps, schema_editor):
    SubActivity = apps.get_model("projects", "SubActivity")
    SubSubActivity = apps.get_model("projects", "SubSubActivity")
    ValueChain = apps.get_model("user_management", "ValueChain")

    by_name = {chain.name.casefold(): chain for chain in ValueChain.objects.all()}
    for sub_activity in SubActivity.objects.exclude(value_chain=""):
        chains = [
            by_name.get(name.strip().casefold())
            for name in sub_activity.value_chain.split(",")
            if name.strip()
        ]
        sub_activity.value_chains.add(*[chain for chain in chains if chain])

    for activity in SubSubActivity.objects.exclude(value_chain=""):
        chain = by_name.get(activity.value_chain.strip().casefold())
        if chain:
            activity.value_chain_reference = chain
            activity.save(update_fields=["value_chain_reference"])


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0014_allow_component_deletion_with_main_activities"),
        ("user_management", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="subactivity",
            name="value_chains",
            field=models.ManyToManyField(blank=True, related_name="sub_activities", to="user_management.valuechain"),
        ),
        migrations.AddField(
            model_name="subsubactivity",
            name="value_chain_reference",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="sub_sub_activities", to="user_management.valuechain"),
        ),
        migrations.RunPython(copy_legacy_value_chains, migrations.RunPython.noop),
    ]
