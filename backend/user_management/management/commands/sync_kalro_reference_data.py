import csv
import re
from collections import defaultdict
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from user_management.models import Centre, County, Institute, SubCentre


SOURCE = Path(__file__).resolve().parents[3] / "reference_data" / "kalro-institutes-centres.csv"


def normalized(value):
    return re.sub(r"[^a-z0-9]", "", value.casefold())


class Command(BaseCommand):
    help = "Synchronize KALRO institute and centre selections from the maintained source CSV."

    @transaction.atomic
    def handle(self, *args, **options):
        rows = list(csv.DictReader(SOURCE.open(encoding="utf-8-sig", newline="")))
        if not rows or not {"institute", "centre"}.issubset(rows[0]):
            raise CommandError(f"Reference source is missing or invalid: {SOURCE}")

        hierarchy = defaultdict(list)
        for row in rows:
            institute_name = row["institute"].strip()
            centre_name = row["centre"].strip()
            if not institute_name:
                raise CommandError("Every source row must identify an institute.")
            hierarchy[institute_name]
            if centre_name and centre_name not in hierarchy[institute_name]:
                hierarchy[institute_name].append(centre_name)

        institutes = list(Institute.objects.select_related("county").all())
        institute_by_source = {}
        reserved_ids = set()
        for official_name in hierarchy:
            key = normalized(official_name)
            candidates = [item for item in institutes if item.pk not in reserved_ids and
                          (normalized(item.name) == key or normalized(item.name).startswith(key)
                           or key.startswith(normalized(item.name)))]
            if len(candidates) != 1:
                raise CommandError(
                    f"Expected one existing institute matching '{official_name}', found {len(candidates)}."
                )
            institute = candidates[0]
            reserved_ids.add(institute.pk)
            institute.name = official_name
            institute.is_active = True
            institute.save(update_fields=["name", "is_active"])
            institute_by_source[official_name] = institute

        Institute.objects.exclude(pk__in=reserved_ids).update(is_active=False)
        Centre.objects.update(is_active=False)
        SubCentre.objects.update(is_active=False)

        centre_rows = list(Centre.objects.select_related("county", "institute").all())
        subcentre_rows = list(SubCentre.objects.select_related("county", "institute").all())
        county_by_name = {normalized(item.name): item for item in County.objects.all()}
        made_active = 0

        for institute_name, centre_names in hierarchy.items():
            institute = institute_by_source[institute_name]
            for official_centre_name in centre_names:
                key = normalized(official_centre_name)
                candidates = [item for item in centre_rows if item.institute_id == institute.pk and
                              normalized(item.name) == key]
                if len(candidates) > 1:
                    raise CommandError(f"Duplicate existing centre '{official_centre_name}' under '{institute_name}'.")
                if candidates:
                    centre = candidates[0]
                    centre.name = official_centre_name
                    centre.is_active = True
                    centre.save(update_fields=["name", "is_active"])
                else:
                    county_ids = {item.county_id for item in centre_rows + subcentre_rows
                                  if normalized(item.name) == key}
                    if len(county_ids) == 1:
                        county = County.objects.get(pk=county_ids.pop())
                    elif len(county_ids) > 1:
                        raise CommandError(
                            f"County for '{official_centre_name}' is ambiguous in existing reference data."
                        )
                    else:
                        # The source table omits most county values. Retain the institute's
                        # established county for a newly listed centre with no county match.
                        county = institute.county
                    centre = Centre.objects.create(
                        name=official_centre_name,
                        institute=institute,
                        county=county,
                        is_active=True,
                    )
                    centre_rows.append(centre)
                made_active += 1

        self.stdout.write(self.style.SUCCESS(
            f"Synchronized {len(institute_by_source)} institutes and {made_active} centres from {SOURCE.name}; "
            "unlisted institutes, centres, and sub-centres are archived and remain in the database."
        ))
