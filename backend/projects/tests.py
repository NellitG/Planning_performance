from importlib import import_module
from types import SimpleNamespace

from django.db import connection
from django.apps import apps
from django.test import TestCase

from .models import (
    County,
    IndicatorReport,
    MainActivity,
    MainActivityIndicator,
    MainProject,
    Project,
    ProjectLocation,
    SubCounty,
    TechnicalReport,
    Ward,
)
from .serializers import IndicatorReportSerializer, ProjectSerializer, TechnicalReportSerializer


class TechnicalReportFlexibleLocationTests(TestCase):
    def setUp(self):
        self.parent = MainProject.objects.create(name="Main")
        self.project = Project.objects.create(project_name="Title", main_project_record=self.parent)
        self.county = County.objects.create(name="Configured County")
        self.sub_county = SubCounty.objects.create(county=self.county, name="Configured Sub-county")
        self.ward = Ward.objects.create(sub_county=self.sub_county, name="Configured Ward")
        self.county_location = ProjectLocation.objects.create(project=self.project, county=self.county)
        self.sub_county_location = ProjectLocation.objects.create(project=self.project, county=self.county, sub_county=self.sub_county)
        self.ward_location = ProjectLocation.objects.create(project=self.project, county=self.county, sub_county=self.sub_county, ward=self.ward)

    def validate_location(self, location):
        return TechnicalReportSerializer(data={
            "title": "Report",
            "projectId": self.project.pk,
            "selectedLocations": [location],
        }, partial=True)

    def test_county_location_is_valid_without_subcounty_or_ward(self):
        serializer = self.validate_location({
            "projectLocationId": self.county_location.pk,
            "countyId": self.county.pk,
            "countyName": self.county.name,
            "level": "County",
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_subcounty_location_is_valid_without_ward(self):
        serializer = self.validate_location({
            "projectLocationId": self.sub_county_location.pk,
            "countyId": self.county.pk,
            "subCountyId": self.sub_county.pk,
            "level": "Sub-county",
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_ward_location_is_valid_with_parent_ids(self):
        serializer = self.validate_location({
            "projectLocationId": self.ward_location.pk,
            "countyId": self.county.pk,
            "subCountyId": self.sub_county.pk,
            "wardId": self.ward.pk,
            "level": "Ward",
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_report_saves_indicator_rows_for_selected_location_levels(self):
        activity = MainActivity.objects.create(name="Reporting Activity")
        indicator = MainActivityIndicator.objects.create(
            main_activity=activity,
            category="ICT",
            indicator="People reached",
            target="10",
        )
        locations = [
            {
                "projectLocationId": self.county_location.pk,
                "countyId": self.county.pk,
                "countyName": "Untrusted County",
            },
            {
                "projectLocationId": self.sub_county_location.pk,
                "countyId": self.county.pk,
                "countyName": "Untrusted County",
                "subCountyId": self.sub_county.pk,
                "subCountyName": "Untrusted Sub-county",
            },
            {
                "projectLocationId": self.ward_location.pk,
                "countyId": self.county.pk,
                "countyName": "Untrusted County",
                "subCountyId": self.sub_county.pk,
                "subCountyName": "Untrusted Sub-county",
                "wardId": self.ward.pk,
                "wardName": "Untrusted Ward",
            },
        ]
        serializer = TechnicalReportSerializer(data={
            "title": "Flexible location report",
            "projectId": self.project.pk,
            "mainActivityId": activity.pk,
            "category": "ICT",
            "quarter": "Quarter 1",
            "financialYear": "2026-2027",
            "selectedLocations": locations,
            "indicatorReports": [
                {
                    "projectLocationId": location["projectLocationId"],
                    **({"wardId": location["wardId"]} if location.get("wardId") else {}),
                    "indicatorId": str(indicator.pk),
                    "indicator": indicator.indicator,
                    "target": "10",
                    "reportedProgress": "1",
                }
                for location in locations
            ],
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)

        report = serializer.save()
        report.refresh_from_db()
        rows = list(report.indicator_reports.select_related(
            "project_location__county",
            "project_location__sub_county",
            "project_location__ward",
        ).order_by("project_location_id"))
        self.assertEqual(
            {row.project_location_id for row in rows},
            {self.county_location.pk, self.sub_county_location.pk, self.ward_location.pk},
        )

        representation = TechnicalReportSerializer(report).data
        reporting_locations = {
            location["locationId"]: location
            for location in representation["relatedWardReports"]
        }
        self.assertEqual(len(reporting_locations), 3)
        self.assertEqual(
            reporting_locations[str(self.county_location.pk)]["locationLevel"],
            "County",
        )
        self.assertEqual(
            reporting_locations[str(self.county_location.pk)]["countyName"],
            self.county.name,
        )
        self.assertEqual(
            reporting_locations[str(self.sub_county_location.pk)]["locationLevel"],
            "Sub-county",
        )
        self.assertEqual(
            reporting_locations[str(self.sub_county_location.pk)]["subCountyName"],
            self.sub_county.name,
        )
        self.assertEqual(
            reporting_locations[str(self.ward_location.pk)]["locationLevel"],
            "Ward",
        )
        self.assertEqual(
            reporting_locations[str(self.ward_location.pk)]["wardName"],
            self.ward.name,
        )
        self.assertEqual(
            [location["countyName"] for location in representation["selectedLocations"]],
            [self.county.name] * 3,
        )
        self.assertEqual(
            representation["selectedLocations"][1]["subCountyName"],
            self.sub_county.name,
        )
        self.assertEqual(
            representation["selectedLocations"][2]["wardName"],
            self.ward.name,
        )

    def test_location_from_another_project_is_rejected(self):
        other = Project.objects.create(project_name="Other Title", main_project_record=self.parent)
        other_location = ProjectLocation.objects.create(project=other, county=self.county)
        serializer = self.validate_location({
            "projectLocationId": other_location.pk,
            "countyId": self.county.pk,
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn("selectedLocations", serializer.errors)

    def test_report_without_specific_location_is_valid(self):
        serializer = TechnicalReportSerializer(data={"title": "Report", "projectId": self.project.pk}, partial=True)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_saving_project_locations_preserves_unchanged_location_rows(self):
        original_id = self.county_location.pk
        ProjectSerializer()._sync_project_locations(self.project, [{"countyId": str(self.county.pk)}])
        locations = list(ProjectLocation.objects.filter(project=self.project))
        self.assertEqual(len(locations), 1)
        self.assertEqual(locations[0].pk, original_id)

    def test_new_project_county_location_is_reportable_after_save(self):
        serializer = ProjectSerializer(data={
            "name": "New County Title",
            "mainProjectId": self.parent.pk,
            "locations": [{
                "county": self.county.name,
                "countyId": str(self.county.pk),
                "subCounty": "",
                "ward": "",
            }],
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        project = serializer.save()

        self.assertEqual(project.project_locations.count(), 1)
        location = ProjectSerializer(project).data["locations"][0]
        self.assertEqual(location["countyId"], str(self.county.pk))
        self.assertEqual(location["county"], self.county.name)
        self.assertTrue(location["projectLocationId"])
        self.assertEqual(location["subCountyId"], "")
        self.assertEqual(location["wardId"], "")

    def test_legacy_project_county_location_is_backfilled_for_reporting(self):
        project = Project.objects.create(
            project_name="Legacy County Title",
            main_project_record=self.parent,
            locations=[{
                "county": self.county.name,
                "countyId": str(self.county.pk),
                "subCounty": "",
                "ward": "",
            }],
        )
        self.assertFalse(project.project_locations.exists())

        migration = import_module("projects.migrations.0033_backfill_project_locations")
        migration.backfill_project_locations(
            apps,
            SimpleNamespace(connection=connection),
        )
        project.refresh_from_db()
        location = ProjectSerializer(project).data["locations"][0]

        self.assertEqual(location["countyId"], str(self.county.pk))
        self.assertEqual(location["county"], self.county.name)
        self.assertTrue(location["projectLocationId"])
        self.assertEqual(location["subCountyId"], "")
        self.assertEqual(location["wardId"], "")

    def test_indicator_cumulative_totals_are_scoped_to_saved_location(self):
        first_report = TechnicalReport.objects.create(title="First", project=self.project)
        second_report = TechnicalReport.objects.create(title="Second", project=self.project)
        first_row = IndicatorReport.objects.create(
            technical_report=first_report,
            project_location=self.county_location,
            indicator_id="indicator-1",
            indicator_name="Indicator",
            target=10,
            reported_value=2,
        )
        IndicatorReport.objects.create(
            technical_report=second_report,
            project_location=self.sub_county_location,
            indicator_id="indicator-1",
            indicator_name="Indicator",
            target=10,
            reported_value=4,
        )
        self.assertEqual(IndicatorReportSerializer().get_cumulativeReported(first_row), "2.00")
