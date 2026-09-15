import csv
from pathlib import Path

from django.core.management.base import BaseCommand

from projects.models import County, SubCounty, Ward


class Command(BaseCommand):
    help = "Load the County, Sub-County and Ward hierarchy from the supplied CSV."

    def add_arguments(self, parser):
        parser.add_argument("csv_path", nargs="?", default=str(Path(__file__).resolve().parents[3] / "reference_data" / "kenya-geography.csv"))

    def handle(self, *args, **options):
        current_county = None
        current_sub_county = None
        with Path(options["csv_path"]).open(newline="", encoding="utf-8-sig") as source:
            for row in csv.DictReader(source):
                county_name = row["County"].strip()
                if county_name:
                    current_county, _ = County.objects.update_or_create(name=county_name.title(), defaults={"svg_id": ""})
                current_sub_county, _ = SubCounty.objects.get_or_create(county=current_county, name=row["Constituency_name"].strip().title())
                Ward.objects.get_or_create(sub_county=current_sub_county, name=row["Ward"].strip().title())
        self.stdout.write(self.style.SUCCESS("Geographic hierarchy loaded."))