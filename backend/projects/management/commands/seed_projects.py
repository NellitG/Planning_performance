from django.core.management.base import BaseCommand

from projects.models import Project

SEED_PROJECTS = [
    ("National Agricultural Productivity Project", "2023-01-15", "2026-12-31", "Active", "NAPP"),
    ("Youth Mainstreaming in Agriculture Program (YMAP)", "2022-06-01", "2025-05-31", "Active", "YMAP"),
    ("Smallholder Insurance Scheme", "2021-03-10", "2024-09-30", "Completed", "SIS"),
    ("Mama Kitchen Garden Initiative", "2024-02-01", "2027-01-31", "Active", "MKG"),
    ("Farm Inputs Subsidy Programme", "2023-09-01", "2026-08-31", "Delayed", "FISP"),
    ("SACCOs & FPOs Strengthening Project", "2024-07-15", "2027-06-30", "Pending", "SFP"),
    ("Rural Value Chain Development", "2022-11-01", "2025-10-31", "Active", "RVC"),
    ("Climate-Smart Agriculture Initiative", "2023-04-01", "2026-03-31", "Active", "CSA"),
    ("Coastal Fisheries Resilience Program", "2022-02-20", "2025-02-19", "Delayed", "CFR"),
    ("Dairy Productivity Enhancement", "2023-08-01", "2026-07-31", "Active", "DPE"),
    ("Horticulture Export Initiative", "2024-01-10", "2026-12-31", "Pending", "HEI"),
    ("Agro-Forestry Restoration Plan", "2021-11-01", "2024-10-31", "Completed", "AFR"),
]


class Command(BaseCommand):
    help = "Seed the database with the initial set of projects."

    def handle(self, *args, **options):
        if Project.objects.exists():
            self.stdout.write(
                self.style.WARNING("Projects already exist — skipping seed.")
            )
            return
        created = 0
        for name, start, end, status, logo in SEED_PROJECTS:
            Project.objects.create(
                project_name=name,
                start_date=start,
                end_date=end,
                status=status,
                logo=logo,
            )
            created += 1
        self.stdout.write(
            self.style.SUCCESS(f"Seeded {created} projects successfully.")
        )
