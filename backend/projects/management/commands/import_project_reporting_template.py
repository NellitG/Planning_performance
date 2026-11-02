"""Idempotently import project records from the KALRO reporting workbook."""

from __future__ import annotations

import json
import re
import unicodedata
from collections import defaultdict
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from openpyxl import load_workbook

from projects.main_projects import get_or_create_main_project
from projects.models import (
    County,
    ExpectedOutput,
    KeyActivity,
    KeyResultArea,
    MainProject,
    OutputIndicator,
    Project,
    ProjectLocation,
    ProjectMapping,
    Strategy,
    StrategicObjective,
)
from user_management.models import Institute, ValueChain


DEFAULT_SOURCE = Path(
    r"D:\KALRO\PPM QC\Project Documents\KALRO PROJECT DATABASE REPORTING TEMPLATE AND ALIGNMENT TO KALRO STRATEGIC PLAN 20.4.26 (2) (1).xlsx"
)
FUNDING_AGENCIES = {
    "usaid", "world bank", "african development bank", "bill & melinda gates foundation",
    "fa o", "fao", "ifad", "eu", "giz", "jica", "dfid / fcdo", "government of kenya",
    "cgiar", "cimmyt", "icrisat", "cip", "iita", "other",
}
FUNDING_AGENCY_ALIASES = {
    "usaid": "USAID", "world bank": "World Bank", "eu": "EU",
    "european union": "EU", "african development bank": "African Development Bank",
    "bill & melinda gates foundation": "Bill & Melinda Gates Foundation",
    "gates foundation": "Bill & Melinda Gates Foundation", "fao": "FAO",
    "food and agriculture organization": "FAO", "ifad": "IFAD", "giz": "GIZ",
    "jica": "JICA", "cgiar": "CGIAR", "cimmyt": "CIMMYT", "icrisat": "ICRISAT",
    "cip": "CIP", "iita": "IITA", "government of kenya": "Government of Kenya",
}
FUNDING_TYPES = {
    "grant", "loan", "government allocation", "donor funding", "own revenue",
    "public-private partnership", "other",
}
PARENT_PLACEHOLDERS = {"", "-", "n/a", "na", "yes", "main", "main project", "mega"}
VALUE_CHAIN_ALIASES = {
    "green gram": "Green grams", "green grams": "Green grams", "mungbean": "Green grams",
    "mung beans": "Green grams", "cowpea": "Cowpeas", "cowpeas": "Cowpeas",
    "rice": "Rice", "maize": "Maize", "bean": "Beans", "beans": "Beans",
    "potato": "Potato", "potatoes": "Potato", "coffee": "Coffee", "cashew": "Cashew",
    "dairy": "Dairy", "chicken": "Indigenuos chicken", "indigenous chicken": "Indigenuos chicken",
}
INSTITUTE_ALIASES = {
    "amri": "AMRI Katumani", "fcri": "FCRI Kitale", "hri": "HRI Kandara",
    "icri": "ICRI Mtwapa", "vsri": "VSRI Muguga", "biori": "BioRI Muguga",
    "gerri": "GeRRI Muguga", "nri": "NRI Kakamega", "dri": "DRI Naivasha",
    "sgcri": "SGCRI Marsabit", "abiri": "ABIRI Perkerra", "mri": "MRI Laare",
    "tri": "TRI Kericho", "cri": "CRI Ruiru", "arlri": "ARLRI Kiboko",
    "bri": "BRI Lanet",
}


def clean(value):
    if value is None:
        return ""
    if isinstance(value, str):
        return value.replace("\u00a0", " ").replace("\u202f", " ").strip()
    return str(value).strip()


def normalized(value):
    value = unicodedata.normalize("NFKD", clean(value)).casefold()
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    value = value.replace("apvcs", "agricultural products value chains")
    value = re.sub(r"\b(kra|so)\s*\d+(?:\.\d+)?\s*[:.)-]?\s*", "", value)
    return re.sub(r"[^a-z0-9]+", "", value)


def distinct_text(values):
    result = []
    seen = set()
    for value in values:
        value = clean(value)
        if value.casefold() in {"-", "n/a", "na", "none"}:
            continue
        key = normalized(value)
        if value and key not in seen:
            seen.add(key)
            result.append(value)
    return result


def parse_date(value):
    if isinstance(value, datetime):
        return value.date() if value.year >= 2000 else None
    if isinstance(value, date):
        return value if value.year >= 2000 else None
    if not isinstance(value, str):
        return None
    text = clean(value)
    if not re.search(r"\b(?:19|20)\d{2}\b", text):
        return None
    # Do not turn year-only, month/year, or reporting periods into made-up dates.
    if re.fullmatch(r"\s*(?:19|20)\d{2}\s*", text) or re.fullmatch(r"\s*\d{4}\s*[/–-]\s*\d{4}\s*", text):
        return None
    text = re.sub(r"\b(\d{1,2})(st|nd|rd|th)\b", r"\1", text, flags=re.I)
    formats = (
        "%Y-%m-%d", "%d/%m/%Y", "%d.%m.%Y", "%d-%m-%Y",
        "%d %B %Y", "%d %b %Y", "%B %d, %Y", "%b %d, %Y",
        "%d %B, %Y", "%d %b, %Y",
    )
    text = re.sub(r"\s+", " ", text)
    for fmt in formats:
        try:
            value_date = datetime.strptime(text, fmt).date()
            return value_date if value_date.year >= 2000 else None
        except ValueError:
            pass
    return None


def parse_kes(value):
    text = clean(value)
    if not text:
        return None
    # Foreign currencies and prose cannot safely go into the system's KES fields.
    if re.search(r"\b(?:USD|US\$|AU\$|EUR|EURO|GBP|KES\s*\$)\b|[$€£]", text, re.I):
        return None
    if re.search(r"\b(?:KES|KSHS?|SHILLINGS?)\b", text, re.I):
        text = re.sub(r"\b(?:KES|KSHS?|SHILLINGS?)\b", "", text, flags=re.I)
    if not re.fullmatch(r"\s*[\d,]+(?:\.\d{1,2})?\s*", text):
        return None
    try:
        amount = Decimal(text.replace(",", ""))
        return amount if amount >= 0 else None
    except InvalidOperation:
        return None


def parse_integer(value):
    text = clean(value).replace(",", "")
    if re.fullmatch(r"\d+", text):
        return int(text)
    return None


def source_records(sheet):
    """Return one source record per project title, folding merged continuation rows."""
    merged_end = {}
    for merged_range in sheet.merged_cells.ranges:
        if merged_range.min_col == 3 and merged_range.max_col == 3:
            merged_end[merged_range.min_row] = merged_range.max_row
    records = []
    for row_number in range(4, sheet.max_row + 1):
        title = clean(sheet.cell(row_number, 3).value)
        if not title:
            continue
        bottom = merged_end.get(row_number, row_number)
        cells = defaultdict(list)
        for source_row in range(row_number, bottom + 1):
            for col in range(1, 50):  # A:AW, all source columns in the template.
                value = sheet.cell(source_row, col).value
                if value is not None and clean(value):
                    cells[col].append(value)
        records.append({
            "row": row_number,
            "bottom_row": bottom,
            "title": title,
            "cells": {col: distinct_text(values) for col, values in cells.items()},
        })
    return records


def field(record, col):
    return record["cells"].get(col, [])


def field_text(record, col):
    return "\n".join(field(record, col))


def parent_for(record, donor_names):
    values = field(record, 4)
    if not values:
        return "", ""
    candidate = values[0]
    key = normalized(candidate)
    # In this reporting template NRF appears in both the parent and donor columns.
    # The Main Project column explicitly assigns these titles to NRF.
    if clean(candidate).casefold() == "nrf":
        return "NRF", ""
    if key in {normalized(item) for item in PARENT_PLACEHOLDERS}:
        return "", "placeholder label in Main Project column"
    if key == normalized(record["title"]):
        return "", "parent label repeats the project title"
    if key in donor_names or key in {normalized(item) for item in FUNDING_AGENCIES}:
        return "", "Main Project value matches a donor/funder label"
    if clean(candidate).casefold().startswith("to "):
        return "", "Main Project value reads as an objective, not a parent name"
    return clean(candidate), ""


def named_sections(record, columns):
    sections = []
    for label, col in columns:
        value = field_text(record, col)
        if value:
            sections.append(f"{label}:\n{value}")
    return "\n\n".join(sections)


def split_value_chains(source, available):
    result = []
    missed = []
    alias_map = {normalized(key): value for key, value in VALUE_CHAIN_ALIASES.items()}
    available_map = {normalized(name): name for name in available}
    for piece in re.split(r"[,;/\n]+|\band\b", source, flags=re.I):
        key = normalized(piece)
        if not key:
            continue
        value = alias_map.get(key)
        if value and normalized(value) in available_map:
            actual = available_map[normalized(value)]
            if actual not in result:
                result.append(actual)
        elif key in available_map and available_map[key] not in result:
            result.append(available_map[key])
        elif key not in {"and", "the"}:
            missed.append(clean(piece))
    return result, missed


def exact_related_ids(model, source_values, parent_lookup=None):
    texts = set()
    for source in source_values:
        for line in re.split(r"[\n;]+", clean(source)):
            line = re.sub(r"^\s*(?:\d+(?:\.\d+)?|[a-z])\s*[.)-]\s*", "", line, flags=re.I)
            line = clean(line)
            if normalized(line):
                texts.add(normalized(line))
    ids = []
    for obj in model.objects.all():
        if parent_lookup and parent_lookup(obj) is False:
            continue
        if normalized(getattr(obj, "text", "")) in texts:
            ids.append(obj.pk)
    return ids


class Command(BaseCommand):
    help = "Import all project titles and supported reporting data from the KALRO Excel template."

    def add_arguments(self, parser):
        parser.add_argument("--source", default=str(DEFAULT_SOURCE))
        parser.add_argument("--report", default="project_import_report.json")
        parser.add_argument("--dry-run", action="store_true", help="Build a summary without writing database records.")

    def handle(self, *args, **options):
        source = Path(options["source"])
        if not source.is_file():
            raise CommandError(f"Workbook not found: {source}")
        workbook = load_workbook(source, data_only=True, read_only=False)
        if not workbook.worksheets:
            raise CommandError("Workbook has no worksheets.")
        sheet = workbook.worksheets[0]
        if clean(sheet.cell(2, 3).value).casefold() != "project title":
            raise CommandError("First worksheet does not have the expected Project Title column in C2.")
        records = source_records(sheet)
        if not records:
            raise CommandError("No project titles were found in the workbook.")

        donor_names = {normalized(clean(sheet.cell(row, 32).value)) for row in range(4, sheet.max_row + 1) if clean(sheet.cell(row, 32).value)}
        donor_names.update(normalized(clean(sheet.cell(row, 33).value)) for row in range(4, sheet.max_row + 1) if clean(sheet.cell(row, 33).value))
        all_titles = {normalized(record["title"]): record["title"] for record in records}
        existing_projects_by_title = defaultdict(list)
        for existing_project in Project.objects.select_related("main_project_record"):
            existing_projects_by_title[normalized(existing_project.project_name)].append(existing_project)
        for record in records:
            parent, ignored = parent_for(record, donor_names)
            # A shorthand parent can point at a full project title in this same source.
            if parent and normalized(parent) in all_titles:
                parent = all_titles[normalized(parent)]
            # When a source parent label is ambiguous, preserve the parent already
            # attached to an exact existing title so reruns remain idempotent.
            if not parent:
                existing_matches = existing_projects_by_title.get(normalized(record["title"]), [])
                existing_parent_names = {
                    (project.main_project_record.name if project.main_project_record_id else project.main_project or project.project_name)
                    for project in existing_matches
                }
                if len(existing_parent_names) == 1:
                    parent = existing_parent_names.pop()
            # Existing Main Project labels can be referenced by an acronym in a title.
            if not parent:
                existing = list(MainProject.objects.all())
                for candidate in existing:
                    candidate_name = clean(candidate.name)
                    if not candidate_name.isupper() or not re.fullmatch(r"[A-Z0-9]{2,10}", candidate_name):
                        continue
                    key = normalized(candidate.name)
                    title_key = normalized(record["title"])
                    if key and (title_key.endswith(key) or re.search(rf"\b{re.escape(candidate_name)}\b", record["title"], re.I)):
                        parent = candidate.name
                        break
            record["parent"] = parent
            record["parent_review"] = ignored

        # Exact project title + parent is the idempotency key. Repeated source rows are
        # coalesced so continuation or duplicate lines never create duplicate titles.
        unique = {}
        repeated_source_rows = []
        for record in records:
            key = (normalized(record["parent"] or record["title"]), normalized(record["title"]))
            if key not in unique:
                unique[key] = record
            else:
                previous = unique[key]
                previous["bottom_row"] = max(previous["bottom_row"], record["bottom_row"])
                for col, values in record["cells"].items():
                    previous["cells"][col] = distinct_text(previous["cells"].get(col, []) + values)
                repeated_source_rows.append({"row": record["row"], "title": record["title"], "reason": "same title under same parent; source fields consolidated"})
        records = list(unique.values())

        available_chains = list(ValueChain.objects.filter(is_active=True).values_list("name", flat=True))
        available_counties = list(County.objects.all())
        available_institutes = {normalized(name): obj for name, obj in ((i.name, i) for i in Institute.objects.all())}
        existing_parents = {normalized(obj.name): obj for obj in MainProject.objects.all()}
        report = {
            "source_file": str(source),
            "worksheet": sheet.title,
            "source_project_title_rows": len(source_records(sheet)),
            "distinct_project_titles_identified": len(records),
            "main_projects_created": 0,
            "main_projects_reused": 0,
            "project_titles_created": 0,
            "project_titles_reused": 0,
            "project_records_populated_successfully": 0,
            "partially_completed_projects": 0,
            "potential_duplicates_flagged": repeated_source_rows,
            "records_not_imported": [],
            "parent_labels_for_review": [],
            "unmatched_value_chains": [],
            "unmapped_locations": [],
            "foreign_or_unparsed_finance_values": [],
            "unparsed_dates": [],
            "missing_fields": {"project_type": [], "coordinator_user": [], "investigator_accounts": []},
            "documents_imported": 0,
            "source_document_note": "The workbook contains no project document attachments or document-file references.",
            "strategic_alignment": {"projects_with_records": 0, "kra_matches": 0, "objective_matches": 0},
            "dry_run": options["dry_run"],
        }
        hierarchy = defaultdict(list)
        for record in records:
            hierarchy[record["parent"] or record["title"]].append(record["title"])
        report["main_project_hierarchy"] = [
            {"main_project": name, "project_titles": titles}
            for name, titles in sorted(hierarchy.items(), key=lambda item: item[0].casefold())
        ]

        if options["dry_run"]:
            # Forecast counts using current records and the planned parent/title keys.
            preexisting_parent_keys = set(existing_parents)
            project_keys = {
                (normalized(project.main_project_record.name if project.main_project_record_id else project.main_project), normalized(project.project_name))
                for project in Project.objects.select_related("main_project_record")
            }
            title_names = {normalized(name) for name in Project.objects.values_list("project_name", flat=True)}
            parents_to_create = set()
            parents_to_reuse = set()
            for record in records:
                parent_name = record["parent"] or record["title"]
                parent_key = normalized(parent_name)
                if parent_key in preexisting_parent_keys:
                    parents_to_reuse.add(parent_key)
                else:
                    parents_to_create.add(parent_key)
                project_key = (parent_key, normalized(record["title"]))
                if project_key in project_keys:
                    report["project_titles_reused"] += 1
                else:
                    report["project_titles_created"] += 1
                    if normalized(record["title"]) in title_names:
                        report["potential_duplicates_flagged"].append({"row": record["row"], "title": record["title"], "source_parent": parent_name, "reason": "exact project title exists under a different parent; kept separate for review"})
                project_keys.add(project_key)
                title_names.add(normalized(record["title"]))
                report["project_records_populated_successfully"] += 1
                report["partially_completed_projects"] += 1
                if record["parent_review"] and record["parent_review"] not in {
                    "placeholder label in Main Project column",
                    "parent label repeats the project title",
                }:
                    raw_parent = field_text(record, 4)
                    report["parent_labels_for_review"].append({"row": record["row"], "title": record["title"], "value": raw_parent, "reason": record["parent_review"]})
            report["main_projects_created"] = len(parents_to_create)
            report["main_projects_reused"] = len(parents_to_reuse)
            self._write_report(report, options["report"])
            self.stdout.write(
                f"Dry run: {len(records)} project titles; "
                f"{report['main_projects_created']} main projects to create, "
                f"{report['main_projects_reused']} to reuse; "
                f"{report['project_titles_created']} titles to create, "
                f"{report['project_titles_reused']} to reuse. "
                f"Review {len(report['parent_labels_for_review'])} parent labels in {options['report']}."
            )
            return

        preexisting_parent_keys = set(existing_parents)
        created_parent_keys = set()
        reused_parent_keys = set()
        known_projects = list(Project.objects.select_related("main_project_record").all())
        projects_by_parent_title = {
            (project.main_project_record_id, normalized(project.project_name)): project
            for project in known_projects
        }
        projects_by_title = defaultdict(list)
        for project in known_projects:
            projects_by_title[normalized(project.project_name)].append(project)
        with transaction.atomic():
            for record in records:
                title = record["title"]
                parent_name = record["parent"] or title
                parent_key = normalized(parent_name)
                parent = existing_parents.get(parent_key)
                if parent:
                    if parent_key in preexisting_parent_keys:
                        reused_parent_keys.add(parent_key)
                else:
                    parent, created_parent = get_or_create_main_project(parent_name)
                    existing_parents[parent_key] = parent
                    if created_parent:
                        created_parent_keys.add(parent_key)
                    else:
                        reused_parent_keys.add(parent_key)

                title_key = normalized(title)
                project = projects_by_parent_title.get((parent.pk, title_key))
                is_new = project is None
                if is_new:
                    # Reuse an existing exact title only when its parent also matches.
                    elsewhere = next(
                        (candidate for candidate in projects_by_title.get(title_key, []) if candidate.main_project_record_id != parent.pk),
                        None,
                    )
                    if elsewhere:
                        report["potential_duplicates_flagged"].append({
                            "row": record["row"], "title": title,
                            "existing_project_id": elsewhere.pk,
                            "existing_parent": elsewhere.main_project_record.name if elsewhere.main_project_record_id else elsewhere.main_project,
                            "source_parent": parent_name,
                            "reason": "exact project title exists under a different parent; kept separate for review",
                        })
                    project = Project.objects.create(
                        project_name=title,
                        main_project=parent_name,
                        main_project_record=parent,
                        status="Not Started",
                        project_type="",
                        is_draft=True,
                        current_step=1,
                    )
                    projects_by_parent_title[(parent.pk, title_key)] = project
                    projects_by_title[title_key].append(project)
                    report["project_titles_created"] += 1
                else:
                    report["project_titles_reused"] += 1

                updates = []
                if not project.main_project:
                    project.main_project = parent_name
                    updates.append("main_project")
                for attribute, value in (("start_date", parse_date(field(record, 5)[0]) if field(record, 5) else None),
                                         ("end_date", parse_date(field(record, 6)[0]) if field(record, 6) else None)):
                    if value and not getattr(project, attribute):
                        setattr(project, attribute, value)
                        updates.append(attribute)

                pi = field(record, 7)[0] if field(record, 7) else ""
                copis = [value for col in range(8, 12) for value in field(record, col)]
                institution_names = [value for col in range(12, 18) for value in field(record, col)]
                people_lines = []
                if pi:
                    people_lines.append(f"Principal Investigator (source): {pi}")
                people_lines.extend(f"Co-Principal Investigator (source): {name}" for name in distinct_text(copis))
                for col, label in ((12, "PI institute"), (13, "PI centre"), (14, "Co-PI 1 institute/centre"), (15, "Co-PI 2 institute/centre"), (16, "Co-PI 3 institute/centre"), (17, "Co-PI 4 institute/centre")):
                    for value in field(record, col):
                        people_lines.append(f"{label}: {value}")
                collaborators = "\n".join(people_lines)
                if collaborators and not project.collaborators:
                    project.collaborators = collaborators
                    updates.append("collaborators")

                objectives = field_text(record, 20)
                if objectives and not project.project_objectives:
                    project.project_objectives = objectives
                    updates.append("project_objectives")

                expected_text = named_sections(record, [
                    ("Project document output indicators", 21), ("Project document outcome indicators", 22),
                    ("Strategic plan aligned outputs", 23), ("Output baseline", 24),
                    ("Output target", 25), ("Output actual achievement", 26),
                    ("Strategic plan aligned outcomes", 27), ("Outcome baseline", 28),
                    ("Outcome target", 29), ("Outcome actual achievement", 30),
                ])
                if expected_text and not project.expected_outcomes:
                    project.expected_outcomes = expected_text
                    updates.append("expected_outcomes")

                value_chain_source = field_text(record, 37)
                if value_chain_source:
                    chain_names, unmatched = split_value_chains(value_chain_source, available_chains)
                    if chain_names:
                        old = list(project.value_chains or [])
                        project.value_chains = list(dict.fromkeys(old + chain_names))
                        updates.append("value_chains")
                    if unmatched:
                        report["unmatched_value_chains"].append({"row": record["row"], "title": title, "source": value_chain_source, "unmatched_terms": unmatched})

                budget = parse_kes(field(record, 31)[0]) if field(record, 31) else None
                if budget is not None and project.expected_budget is None:
                    project.expected_budget = budget
                    updates.append("expected_budget")
                donor = field(record, 32)[0] if field(record, 32) else ""
                funding_source = field(record, 33)[0] if field(record, 33) else ""
                disbursed = parse_kes(field(record, 34)[0]) if field(record, 34) else None
                utilized = parse_kes(field(record, 35)[0]) if field(record, 35) else None
                if donor.casefold() in {"-", "n/a", "na"}:
                    donor = ""
                if funding_source.casefold() in {"-", "n/a", "na"}:
                    funding_source = ""
                if donor or funding_source:
                    donor_key = clean(donor).casefold()
                    known_agency = FUNDING_AGENCY_ALIASES.get(donor_key)
                    funding_entry = {
                        "sourceName": funding_source or donor,
                        "fundingAgency": known_agency or ("Other" if donor else ""),
                        "fundingAgencyOther": "" if known_agency else donor,
                        "type": clean(funding_source) if clean(funding_source).casefold() in FUNDING_TYPES else "",
                        "amount": str(budget) if budget is not None else "",
                        "disbursed": str(disbursed) if disbursed is not None else "",
                        "utilized": str(utilized) if utilized is not None else "",
                    }
                    old_sources = list(project.funding_sources or [])
                    source_key = tuple(normalized(funding_entry[key]) for key in ("sourceName", "fundingAgency", "fundingAgencyOther", "type", "amount", "disbursed", "utilized"))
                    old_keys = {
                        tuple(normalized(entry.get(key, "")) for key in ("sourceName", "fundingAgency", "fundingAgencyOther", "type", "amount", "disbursed", "utilized"))
                        for entry in old_sources if isinstance(entry, dict)
                    }
                    if source_key not in old_keys:
                        old_sources.append(funding_entry)
                        project.funding_sources = old_sources
                        updates.append("funding_sources")
                for label, col in (("budget", 31), ("disbursement", 34), ("expenditure", 35)):
                    if field(record, col) and parse_kes(field(record, col)[0]) is None:
                        report["foreign_or_unparsed_finance_values"].append({"row": record["row"], "title": title, "field": label, "source": field_text(record, col)})

                target_beneficiaries = parse_integer(field(record, 41)[0]) if field(record, 41) else None
                if target_beneficiaries is not None and project.total_beneficiaries is None:
                    project.total_beneficiaries = target_beneficiaries
                    updates.append("total_beneficiaries")

                background = named_sections(record, [
                    ("Source project code", 2), ("Donor", 32), ("Source of funding", 33),
                    ("Total disbursement (source value)", 34), ("Total expenditure (source value)", 35),
                    ("Completion rate (source value)", 36), ("Project publications", 43),
                    ("Farmer income realized (source value)", 44), ("Project challenges", 45),
                    ("Proposed solutions", 46), ("Remarks", 47), ("Last updated (source value)", 48),
                    ("Source institute", 49), ("Value chains (source value)", 37),
                    ("Counties covered (source value)", 38), ("Sub-counties covered (source value)", 39),
                    ("Wards covered (source value)", 40), ("Beneficiary target (source value)", 41),
                    ("Beneficiaries reached by gender (source value)", 42),
                ])
                if background and not project.background:
                    project.background = background
                    updates.append("background")

                if updates:
                    project.save(update_fields=list(dict.fromkeys(updates + ["updated_at"])))

                # Investigator institute links are only added when a unique local registry
                # match exists. Names that are not registered remain in collaborators.
                for inst_value in field(record, 12):
                    inst_key = normalized(inst_value)
                    acronym_matches = [canonical for acronym, canonical in INSTITUTE_ALIASES.items() if re.search(rf"\b{re.escape(acronym)}\b", clean(inst_value), re.I)]
                    if len(acronym_matches) == 1:
                        institute = available_institutes.get(normalized(acronym_matches[0]))
                        if institute:
                            project.investigator_institutes.add(institute)
                    elif inst_key in available_institutes:
                        project.investigator_institutes.add(available_institutes[inst_key])

                # Exact KRA/objective matches only; unmatched plan text is retained above.
                kra_names = field(record, 18)
                kra_lookup = {normalized(kra.title): kra for kra in KeyResultArea.objects.all()}
                kra_ids = []
                for source_kra in kra_names:
                    key = normalized(source_kra)
                    kra = kra_lookup.get(key)
                    if kra and kra.pk not in kra_ids:
                        kra_ids.append(kra.pk)
                objective_ids = []
                for source_objective in field(record, 19):
                    key = normalized(source_objective)
                    for objective in StrategicObjective.objects.select_related("key_result_area").all():
                        if normalized(objective.text) == key and (not kra_ids or objective.key_result_area_id in kra_ids):
                            if objective.pk not in objective_ids:
                                objective_ids.append(objective.pk)
                strategy_ids = exact_related_ids(Strategy, field(record, 23))
                activity_ids = exact_related_ids(KeyActivity, field(record, 23))
                output_ids = exact_related_ids(OutputIndicator, field(record, 23))
                expected_ids = exact_related_ids(ExpectedOutput, field(record, 23))
                if kra_ids or objective_ids or strategy_ids or activity_ids or expected_ids or output_ids:
                    mapping, created = ProjectMapping.objects.get_or_create(project=project)
                    mapping.kra_ids = list(dict.fromkeys((mapping.kra_ids or []) + kra_ids))
                    mapping.objective_ids = list(dict.fromkeys((mapping.objective_ids or []) + objective_ids))
                    mapping.strategy_ids = list(dict.fromkeys((mapping.strategy_ids or []) + strategy_ids))
                    mapping.key_activity_ids = list(dict.fromkeys((mapping.key_activity_ids or []) + activity_ids))
                    mapping.expected_output_ids = list(dict.fromkeys((mapping.expected_output_ids or []) + expected_ids))
                    mapping.output_indicator_ids = list(dict.fromkeys((mapping.output_indicator_ids or []) + output_ids))
                    mapping.save()
                    report["strategic_alignment"]["kra_matches"] += len(kra_ids)
                    report["strategic_alignment"]["objective_matches"] += len(objective_ids)
                    report["strategic_alignment"]["projects_with_records"] += 1

                # Match geographic names exactly against reference data. Ambiguous or
                # unrecognized fragments stay in the workbook and are reported for review.
                county_source = field_text(record, 38)
                subcounty_source = field_text(record, 39)
                ward_source = field_text(record, 40)
                found_counties = []
                for county in available_counties:
                    county_words = re.sub(r"[^a-z0-9]+", " ", unicodedata.normalize("NFKD", county.name).casefold()).strip()
                    source_words = re.sub(r"[^a-z0-9]+", " ", unicodedata.normalize("NFKD", f" {county_source} ").casefold())
                    if county_words and re.search(rf"(?<![a-z0-9]){re.escape(county_words)}(?![a-z0-9])", source_words):
                        found_counties.append(county)
                for county in found_counties:
                    matched_subcounties = []
                    for subcounty in county.sub_counties.all():
                        sub_words = re.sub(r"[^a-z0-9]+", " ", unicodedata.normalize("NFKD", subcounty.name).casefold()).strip()
                        source_words = re.sub(r"[^a-z0-9]+", " ", unicodedata.normalize("NFKD", f" {subcounty_source} ").casefold())
                        if sub_words and re.search(rf"(?<![a-z0-9]){re.escape(sub_words)}(?![a-z0-9])", source_words):
                            matched_subcounties.append(subcounty)
                    if matched_subcounties:
                        for subcounty in matched_subcounties:
                            matched_wards = []
                            for ward in subcounty.wards.all():
                                ward_words = re.sub(r"[^a-z0-9]+", " ", unicodedata.normalize("NFKD", ward.name).casefold()).strip()
                                source_words = re.sub(r"[^a-z0-9]+", " ", unicodedata.normalize("NFKD", f" {ward_source} ").casefold())
                                if ward_words and re.search(rf"(?<![a-z0-9]){re.escape(ward_words)}(?![a-z0-9])", source_words):
                                    matched_wards.append(ward)
                            if matched_wards:
                                for ward in matched_wards:
                                    ProjectLocation.objects.get_or_create(project=project, county=county, sub_county=subcounty, ward=ward)
                            else:
                                ProjectLocation.objects.get_or_create(project=project, county=county, sub_county=subcounty, ward=None)
                    else:
                        ProjectLocation.objects.get_or_create(project=project, county=county, sub_county=None, ward=None)
                if county_source and not found_counties:
                    report["unmapped_locations"].append({"row": record["row"], "title": title, "source": county_source})

                if record["parent_review"] and record["parent_review"] not in {
                    "placeholder label in Main Project column",
                    "parent label repeats the project title",
                }:
                    report["parent_labels_for_review"].append({"row": record["row"], "title": title, "value": field_text(record, 4), "reason": record["parent_review"]})
                for col in (5, 6):
                    if field(record, col) and not parse_date(field(record, col)[0]):
                        report["unparsed_dates"].append({"row": record["row"], "title": title, "field": "start_date" if col == 5 else "end_date", "source": field_text(record, col)})
                report["project_records_populated_successfully"] += 1
                report["partially_completed_projects"] += 1
                report["missing_fields"]["project_type"].append({"row": record["row"], "title": title})
                report["missing_fields"]["coordinator_user"].append({"row": record["row"], "title": title, "source_pi": pi})
                report["missing_fields"]["investigator_accounts"].append({"row": record["row"], "title": title, "source_investigators": distinct_text([pi] + copis)})

        report["main_projects_created"] = len(created_parent_keys)
        report["main_projects_reused"] = len(reused_parent_keys)
        report["main_projects_identified"] = len({normalized(record["parent"] or record["title"]) for record in records})
        report["total_project_titles_identified"] = len(records)
        report["project_records_populated_successfully"] = report["project_titles_created"] + report["project_titles_reused"]
        report["partially_completed_projects"] = report["project_records_populated_successfully"]
        report["dry_run"] = False
        self._write_report(report, options["report"])
        self.stdout.write(
            f"Imported {report['project_records_populated_successfully']} project titles; "
            f"{report['main_projects_created']} main projects created, "
            f"{report['main_projects_reused']} reused; "
            f"{report['project_titles_created']} titles created, "
            f"{report['project_titles_reused']} reused. "
            f"Summary: {options['report']}"
        )

    def _write_report(self, report, report_path):
        path = Path(report_path)
        if not path.is_absolute():
            path = Path.cwd() / path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
