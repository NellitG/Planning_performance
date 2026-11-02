import re
import unicodedata

from django.db import migrations, models
from django.db.models.functions import Lower, Trim


NRF_PROJECT_TITLES_WITH_SELF_PARENTS = {
    "Augmenting Food Security Through Integrated Management of MLND in Kenya",
    "Productivity of High Value Horticultural Crops through Innovative Technologies in Diverse Agro-Ecological Zones of Kenya for Food Security, Nutrition and Commercialization",
    "Enhancing production, utilization and commercialization of green-shelled beans (Phaseolus vulgaris L.) for improved nutrition and livelihoods in Kenya",
}


def normalize(value):
    value = unicodedata.normalize("NFKC", str(value or "")).casefold()
    return re.sub(r"[^a-z0-9]+", "", value)


def normalize_parent_name(value):
    return unicodedata.normalize("NFKC", str(value or "")).strip().casefold()


def merge_parent_metadata(canonical, parents):
    defaults = {
        "logo": "",
        "description": "",
        "start_date": None,
        "end_date": None,
        "status": "Not Started",
    }
    updates = []
    for field, default in defaults.items():
        values = {getattr(parent, field) for parent in parents if getattr(parent, field) != default}
        if len(values) > 1:
            raise RuntimeError(
                f"Conflicting NRF Main Project values for {field}; review before merging."
            )
        if getattr(canonical, field) == default and values:
            setattr(canonical, field, values.pop())
            updates.append(field)
    canonical.name = "NRF"
    updates.append("name")
    canonical.save(update_fields=list(dict.fromkeys(updates)))


def consolidate_nrf(apps, schema_editor):
    MainProject = apps.get_model("projects", "MainProject")
    Project = apps.get_model("projects", "Project")
    TechnicalReport = apps.get_model("projects", "TechnicalReport")
    alias = schema_editor.connection.alias

    parents = list(MainProject.objects.using(alias).all().order_by("id"))
    nrf_parents = [parent for parent in parents if normalize_parent_name(parent.name) == "nrf"]
    if nrf_parents:
        canonical = sorted(nrf_parents, key=lambda item: item.pk)[0]
    else:
        canonical = MainProject.objects.using(alias).create(name="NRF")
        nrf_parents = [canonical]
    merge_parent_metadata(canonical, nrf_parents)

    nrf_parent_ids = {parent.pk for parent in nrf_parents}
    extra_title_keys = {normalize(title) for title in NRF_PROJECT_TITLES_WITH_SELF_PARENTS}
    extra_projects = [
        project
        for project in Project.objects.using(alias).select_related("main_project_record").all()
        if normalize(project.project_name) in extra_title_keys
        and project.main_project_record_id not in nrf_parent_ids
        and any(
            isinstance(entry, dict)
            and "nrf" in normalize(" ".join(str(value) for value in entry.values()))
            for entry in (project.funding_sources or [])
        )
    ]
    extra_parent_ids = {
        project.main_project_record_id
        for project in extra_projects
        if project.main_project_record_id
        and project.main_project_record_id not in nrf_parent_ids
    }
    extra_parents = list(
        MainProject.objects.using(alias).filter(pk__in=extra_parent_ids).order_by("id")
    )
    merge_parent_metadata(canonical, nrf_parents + extra_parents)

    target_project_ids = set(
        Project.objects.using(alias)
        .filter(main_project_record_id__in=nrf_parent_ids)
        .values_list("id", flat=True)
    )
    target_project_ids.update(project.pk for project in extra_projects)
    target_project_ids.update(
        Project.objects.using(alias)
        .filter(main_project__iexact="NRF")
        .values_list("id", flat=True)
    )

    # Preserve every project row and its nine-step relationships; only move its
    # parent foreign key and redundant display string.
    Project.objects.using(alias).filter(pk__in=target_project_ids).update(
        main_project_record_id=canonical.pk,
        main_project="NRF",
    )

    # Technical Reports carry their own Main Project reference in addition to the
    # project foreign key. Move both direct duplicate references and reports for
    # any title moved above.
    TechnicalReport.objects.using(alias).filter(
        models.Q(main_project_id__in=nrf_parent_ids | extra_parent_ids)
        | models.Q(project_id__in=target_project_ids)
    ).update(main_project_id=canonical.pk)

    # Do not remove a parent row while any project or report still points to it.
    duplicate_nrf_ids = nrf_parent_ids - {canonical.pk}
    for duplicate_id in duplicate_nrf_ids:
        if Project.objects.using(alias).filter(main_project_record_id=duplicate_id).exists():
            raise RuntimeError("An NRF duplicate still has project titles after reassignment.")
        if TechnicalReport.objects.using(alias).filter(main_project_id=duplicate_id).exists():
            raise RuntimeError("An NRF duplicate still has Technical Reports after reassignment.")
    MainProject.objects.using(alias).filter(pk__in=duplicate_nrf_ids).delete()

    for stale_parent in extra_parents:
        if Project.objects.using(alias).filter(main_project_record_id=stale_parent.pk).exists():
            continue
        if TechnicalReport.objects.using(alias).filter(main_project_id=stale_parent.pk).exists():
            continue
        MainProject.objects.using(alias).filter(pk=stale_parent.pk).delete()

    # The normalized-name constraint below is global to Main Projects. Refuse to
    # silently merge any unrelated collisions discovered in another database.
    normalized_names = {}
    for parent in MainProject.objects.using(alias).all():
        key = normalize_parent_name(parent.name)
        normalized_names.setdefault(key, []).append(parent.pk)
    conflicts = {key: ids for key, ids in normalized_names.items() if key and len(ids) > 1}
    if conflicts:
        raise RuntimeError(
            f"Other normalized Main Project name duplicates require review: {conflicts}"
        )


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0033_backfill_project_locations"),
    ]

    operations = [
        migrations.RunPython(consolidate_nrf, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name="mainproject",
            constraint=models.UniqueConstraint(
                Lower(Trim("name")), name="uniq_mainproject_name_ci_trim"
            ),
        ),
    ]
