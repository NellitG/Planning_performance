from django.db import migrations, models
import django.db.models.deletion


def backfill_main_project_implementation(apps, schema_editor):
    MainProject = apps.get_model("projects", "MainProject")
    Project = apps.get_model("projects", "Project")
    County = apps.get_model("projects", "County")
    ProjectLocation = apps.get_model("projects", "ProjectLocation")
    MainProjectLocation = apps.get_model("projects", "MainProjectLocation")
    database = schema_editor.connection.alias

    for main_project in MainProject.objects.using(database).all().iterator():
        county_ids = set(
            ProjectLocation.objects.using(database)
            .filter(project__main_project_record_id=main_project.pk)
            .values_list("county_id", flat=True)
        )
        for project in Project.objects.using(database).filter(
            main_project_record_id=main_project.pk
        ).only("locations").iterator():
            if not isinstance(project.locations, list):
                continue
            for location in project.locations:
                if not isinstance(location, dict):
                    continue
                county_id = location.get("countyId")
                if county_id and County.objects.using(database).filter(pk=county_id).exists():
                    county_ids.add(int(county_id))

        MainProjectLocation.objects.using(database).bulk_create(
            [
                MainProjectLocation(
                    main_project_id=main_project.pk,
                    county_id=county_id,
                )
                for county_id in county_ids
            ],
            ignore_conflicts=True,
        )
        MainProject.objects.using(database).filter(pk=main_project.pk).update(
            implementation_complete=True,
            implementation_step=5,
        )


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0039_alter_indicatorreport_reported_value"),
        ("user_management", "0010_fundingtype"),
    ]

    operations = [
        migrations.AddField(
            model_name="mainproject",
            name="project_budget",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=20, null=True),
        ),
        migrations.AddField(
            model_name="mainproject",
            name="background",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="mainproject",
            name="project_objectives",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="mainproject",
            name="implementation_complete",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="mainproject",
            name="implementation_step",
            field=models.PositiveSmallIntegerField(default=1),
        ),
        migrations.CreateModel(
            name="MainProjectFundingSource",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("source_name", models.CharField(max_length=255)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=20)),
                ("funding_agency", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="user_management.fundingagency")),
                ("funding_type", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="user_management.fundingtype")),
                ("main_project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="funding_sources", to="projects.mainproject")),
            ],
            options={"ordering": ["id"]},
        ),
        migrations.CreateModel(
            name="MainProjectDocument",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=500)),
                ("document_type", models.CharField(choices=[("Project Proposal", "Project Proposal"), ("MOU / Agreement", "MOU / Agreement")], max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("main_project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="documents", to="projects.mainproject")),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="MainProjectDocumentFile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("file", models.FileField(upload_to="main_project_documents/")),
                ("name", models.CharField(blank=True, max_length=500)),
                ("size", models.BigIntegerField(default=0)),
                ("file_type", models.CharField(blank=True, max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("document", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="files", to="projects.mainprojectdocument")),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="MainProjectLocation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("county", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="projects.county")),
                ("main_project", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="county_locations", to="projects.mainproject")),
            ],
        ),
        migrations.AddConstraint(
            model_name="mainprojectlocation",
            constraint=models.UniqueConstraint(fields=("main_project", "county"), name="unique_main_project_county"),
        ),
        migrations.RunPython(backfill_main_project_implementation, migrations.RunPython.noop),
    ]
