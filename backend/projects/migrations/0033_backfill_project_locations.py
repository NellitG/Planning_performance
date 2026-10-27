from django.db import migrations


def backfill_project_locations(apps, schema_editor):
    Project = apps.get_model("projects", "Project")
    County = apps.get_model("projects", "County")
    SubCounty = apps.get_model("projects", "SubCounty")
    Ward = apps.get_model("projects", "Ward")
    ProjectLocation = apps.get_model("projects", "ProjectLocation")
    database = schema_editor.connection.alias

    for project in Project.objects.using(database).exclude(locations=[]).iterator():
        if not isinstance(project.locations, list):
            continue
        for location in project.locations:
            if not isinstance(location, dict):
                continue
            county_id = location.get("countyId")
            county = County.objects.using(database).filter(pk=county_id).first()
            if not county:
                continue

            sub_county_id = location.get("subCountyId") or None
            sub_county = None
            if sub_county_id:
                sub_county = SubCounty.objects.using(database).filter(
                    pk=sub_county_id, county_id=county.pk
                ).first()
                if not sub_county:
                    continue

            ward_id = location.get("wardId") or None
            ward = None
            if ward_id:
                if not sub_county:
                    continue
                ward = Ward.objects.using(database).filter(
                    pk=ward_id, sub_county_id=sub_county.pk
                ).first()
                if not ward:
                    continue

            ProjectLocation.objects.using(database).get_or_create(
                project_id=project.pk,
                county_id=county.pk,
                sub_county_id=sub_county.pk if sub_county else None,
                ward_id=ward.pk if ward else None,
            )


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0032_indicatorreport_project_location_and_more"),
    ]

    operations = [
        migrations.RunPython(backfill_project_locations, migrations.RunPython.noop),
    ]
