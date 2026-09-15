from django.db import migrations, models
import django.db.models.deletion
from pathlib import Path
import csv


def load_geography(apps, schema_editor):
    County = apps.get_model("projects", "County")
    SubCounty = apps.get_model("projects", "SubCounty")
    Ward = apps.get_model("projects", "Ward")
    source = Path(__file__).resolve().parents[2] / "reference_data" / "kenya-geography.csv"
    if not source.exists():
        return
    current_county = None
    with source.open(newline="", encoding="utf-8-sig") as handle:
        for row in csv.DictReader(handle):
            county_name = row["County"].strip()
            if county_name:
                current_county, _ = County.objects.get_or_create(name=county_name.title())
            sub_county, _ = SubCounty.objects.get_or_create(county=current_county, name=row["Constituency_name"].strip().title())
            Ward.objects.get_or_create(sub_county=sub_county, name=row["Ward"].strip().title())


class Migration(migrations.Migration):
    dependencies = [("projects", "0019_alter_project_status")]

    operations = [
        migrations.CreateModel(
            name="County",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120, unique=True)),
                ("svg_id", models.CharField(blank=True, max_length=120)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="SubCounty",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=160)),
                ("county", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="sub_counties", to="projects.county")),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="Ward",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=160)),
                ("sub_county", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="wards", to="projects.subcounty")),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="ProjectLocation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("county", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="projects.county")),
                ("sub_county", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to="projects.subcounty")),
                ("ward", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to="projects.ward")),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="project_locations", to="projects.project")),
            ],
        ),
        migrations.AddConstraint(model_name="subcounty", constraint=models.UniqueConstraint(fields=("county", "name"), name="unique_subcounty_per_county")),
        migrations.AddConstraint(model_name="ward", constraint=models.UniqueConstraint(fields=("sub_county", "name"), name="unique_ward_per_subcounty")),
        migrations.AddConstraint(model_name="projectlocation", constraint=models.UniqueConstraint(fields=("project", "county", "sub_county", "ward"), name="unique_project_location")),
        migrations.RunPython(load_geography, migrations.RunPython.noop),
    ]