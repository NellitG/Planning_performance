from importlib import import_module
from decimal import Decimal
from io import BytesIO
from tempfile import TemporaryDirectory
from types import SimpleNamespace

from django.db import connection
from django.apps import apps
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase, override_settings
from PIL import Image
from rest_framework.test import APIClient
from user_management.authentication import AccountPrincipal
from user_management.models import Centre, County as ReferenceCounty, FundingAgency, FundingType, Institute, Role, SubCentre, UserAccount

from .models import (
    County,
    IndicatorReport,
    IndicatorReportEvidence,
    MainActivity,
    MainActivityIndicator,
    MainProject,
    MainProjectDocument,
    MainProjectDocumentFile,
    MainProjectLocation,
    Project,
    ProjectDocument,
    ProjectDocumentFile,
    ProjectLocation,
    ReportWorkflowAudit,
    SubActivity,
    SubCounty,
    TechnicalReport,
    Ward,
    WorkflowNotification,
)
from .serializers import (
    IndicatorReportSerializer,
    MainProjectSerializer,
    ProjectDocumentFileSerializer,
    ProjectSerializer,
    TechnicalReportSerializer,
)
from .views import TechnicalReportViewSet


class ProjectWizardIntegrationTests(TestCase):
    def test_configured_api_host_is_accepted_by_django(self):
        response = Client().get(
            "/api/main-projects/",
            HTTP_HOST="planning-performance.onrender.com",
        )

        self.assertEqual(response.status_code, 403)

    def test_main_project_can_be_updated_without_changing_its_name(self):
        project = MainProject.objects.create(name="Existing Main Project")
        serializer = MainProjectSerializer(project, data={
            "name": project.name,
            "description": project.description,
            "startDate": project.start_date,
            "endDate": project.end_date,
            "status": project.status,
        }, partial=True)

        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()

    def create_user(self, name, email, active=True):
        return UserAccount.objects.create(
            full_name=name,
            email=email,
            role="staff_user",
            institute="KALRO",
            password="test-password",
            is_active=active,
        )

    def create_parent(self, name="Completed Main Project", counties=()):
        parent = MainProject.objects.create(
            name=name,
            implementation_complete=True,
            implementation_step=5,
        )
        MainProjectLocation.objects.bulk_create([
            MainProjectLocation(main_project=parent, county=county)
            for county in counties
        ])
        return parent

    def test_investigators_can_be_any_registered_users(self):
        principal = self.create_user("Principal", "principal@example.test")
        co_principal = self.create_user("Co-principal", "co-principal@example.test", active=False)
        parent = self.create_parent()
        serializer = ProjectSerializer(data={
            "name": "Investigator role-independent project",
            "mainProjectId": parent.pk,
            "principalInvestigatorIds": [principal.pk],
            "coPrincipalInvestigatorIds": [co_principal.pk],
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)
        project = serializer.save()
        self.assertEqual(list(project.principal_investigators.all()), [principal])
        self.assertEqual(list(project.co_principal_investigators.all()), [co_principal])

    def test_value_chain_leads_endpoint_uses_user_role_assignments(self):
        lead_role, _ = Role.objects.get_or_create(
            key="value_chain_lead",
            defaults={"name": "Value Chain Lead"},
        )
        role_assigned_lead = self.create_user("Assigned Lead", "assigned-lead@example.test")
        role_assigned_lead.roles.add(lead_role)
        primary_role_lead = self.create_user("Primary Lead", "primary-lead@example.test")
        primary_role_lead.role = "value_chain_lead"
        primary_role_lead.save(update_fields=["role"])
        other_user = self.create_user("Other User", "other-user@example.test")

        response = Client().get("/api/user-management/users/value-chain-leads/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {user["id"] for user in response.json()},
            {role_assigned_lead.pk, primary_role_lead.pk},
        )
        self.assertNotIn(other_user.pk, {user["id"] for user in response.json()})

    def test_value_chain_lead_assignments_are_validated_and_persisted(self):
        lead_role, _ = Role.objects.get_or_create(
            key="value_chain_lead",
            defaults={"name": "Value Chain Lead"},
        )
        lead = self.create_user("Value Chain Lead", "value-chain-lead@example.test")
        lead.roles.add(lead_role)
        wrong_role_user = self.create_user("Project Staff", "project-staff@example.test")
        parent = self.create_parent("Project lead assignment parent")

        serializer = ProjectSerializer(data={
            "name": "Project with assigned leads",
            "mainProjectId": parent.pk,
            "valueChainLeadIds": [lead.pk],
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        project = serializer.save()
        self.assertEqual(list(project.value_chain_leads.all()), [lead])
        self.assertEqual(
            ProjectSerializer(project).data["valueChainLeadIds"],
            [lead.pk],
        )

        invalid_serializer = ProjectSerializer(data={
            "name": "Project with invalid lead",
            "mainProjectId": parent.pk,
            "valueChainLeadIds": [wrong_role_user.pk],
        })
        self.assertFalse(invalid_serializer.is_valid())
        self.assertIn("valueChainLeadIds", invalid_serializer.errors)

        update = ProjectSerializer(project, data={"description": "Updated"}, partial=True)
        self.assertTrue(update.is_valid(), update.errors)
        update.save()
        self.assertEqual(list(project.value_chain_leads.all()), [lead])

    def test_implementation_unit_records_are_persisted_and_hierarchy_checked(self):
        county = ReferenceCounty.objects.create(name="Reference County")
        institute = Institute.objects.create(name="Reference Institute", county=county)
        centre = Centre.objects.create(name="Reference Centre", county=county, institute=institute)
        sub_centre = SubCentre.objects.create(
            name="Reference Sub-centre",
            county=county,
            institute=institute,
            centre=centre,
        )
        units = {
            "institute": True,
            "instituteId": str(institute.pk),
            "instituteName": institute.name,
            "centreId": str(centre.pk),
            "centre": centre.name,
            "subCentreId": str(sub_centre.pk),
            "subCentre": sub_centre.name,
        }
        parent = self.create_parent("Implementation unit parent")
        serializer = ProjectSerializer(data={
            "name": "Valid reference selection",
            "mainProjectId": parent.pk,
            "implementationUnits": units,
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)
        project = serializer.save()
        self.assertEqual(project.implementation_units["instituteId"], str(institute.pk))
        self.assertEqual(project.implementation_units["centreId"], str(centre.pk))
        self.assertEqual(project.implementation_units["subCentreId"], str(sub_centre.pk))

        other_institute = Institute.objects.create(name="Other Institute", county=county)
        other_centre = Centre.objects.create(name="Other Centre", county=county, institute=other_institute)
        invalid_serializer = ProjectSerializer(data={
            "name": "Invalid reference selection",
            "mainProjectId": parent.pk,
            "implementationUnits": {**units, "centreId": str(other_centre.pk)},
        })
        self.assertFalse(invalid_serializer.is_valid())
        self.assertIn("implementationUnits", invalid_serializer.errors)

    def test_project_cannot_advance_without_a_persisted_document_file(self):
        serializer = ProjectSerializer(data={
            "name": "Project without document",
            "mainProjectId": self.create_parent("Document validation parent").pk,
            "currentStep": 5,
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn("currentStep", serializer.errors)

        project = Project.objects.create(project_name="Project with metadata only", current_step=4)
        ProjectDocument.objects.create(project=project, name="Unuploaded proposal")
        update = ProjectSerializer(project, data={"currentStep": 5}, partial=True)
        self.assertFalse(update.is_valid())
        self.assertIn("currentStep", update.errors)

    def test_project_can_advance_after_a_document_file_is_saved(self):
        with TemporaryDirectory() as media_root:
            with override_settings(MEDIA_ROOT=media_root):
                project = Project.objects.create(
                    project_name="Project with uploaded document",
                    current_step=4,
                )
                document = ProjectDocument.objects.create(project=project, name="Proposal")
                uploaded_file = SimpleUploadedFile("proposal.pdf", b"saved document contents")
                document_file = ProjectDocumentFile.objects.create(
                    document=document,
                    file=uploaded_file,
                    name=uploaded_file.name,
                    size=uploaded_file.size,
                )
                self.assertTrue(ProjectDocumentFileSerializer(document_file).data["available"])
                update = ProjectSerializer(project, data={"currentStep": 5}, partial=True)

                self.assertTrue(update.is_valid(), update.errors)
                document_file.file.delete(save=False)
                self.assertFalse(ProjectDocumentFileSerializer(document_file).data["available"])
                unavailable_update = ProjectSerializer(
                    project,
                    data={"currentStep": 5},
                    partial=True,
                )
                self.assertFalse(unavailable_update.is_valid())
                self.assertIn("currentStep", unavailable_update.errors)

    def test_main_project_implementation_saves_funding_and_counties(self):
        agency = FundingAgency.objects.create(name="Implementation Agency")
        funding_type = FundingType.objects.filter(active=True).first()
        county = County.objects.create(name="Main Project County")
        parent = MainProject.objects.create(name="Main implementation")
        with TemporaryDirectory() as media_root:
            with override_settings(MEDIA_ROOT=media_root):
                document = MainProjectDocument.objects.create(
                    main_project=parent,
                    title="Proposal",
                    document_type="Project Proposal",
                )
                MainProjectDocumentFile.objects.create(
                    document=document,
                    file=SimpleUploadedFile("proposal.pdf", b"proposal"),
                    name="proposal.pdf",
                    size=8,
                )
                serializer = MainProjectSerializer(
                    parent,
                    data={
                        "projectBudget": "1200.00",
                        "background": "Research background",
                        "projectObjectives": "Improve outcomes",
                        "startDate": "2026-01-01",
                        "endDate": "2027-01-01",
                        "implementationStep": 5,
                        "implementationComplete": True,
                        "fundingSources": [{
                            "sourceName": "Research grant",
                            "fundingAgencyId": agency.pk,
                            "fundingTypeId": funding_type.pk,
                            "amount": "900.00",
                        }],
                        "locationCountyIds": [county.pk],
                    },
                    partial=True,
                )

                self.assertTrue(serializer.is_valid(), serializer.errors)
                saved = serializer.save()
                self.assertEqual(saved.project_budget, Decimal("1200.00"))
                self.assertEqual(saved.background, "Research background")
                self.assertEqual(saved.project_objectives, "Improve outcomes")
                self.assertEqual(saved.funding_sources.get().funding_agency, agency)
                self.assertEqual(saved.funding_sources.get().amount, Decimal("900.00"))
                self.assertEqual(list(saved.county_locations.values_list("county_id", flat=True)), [county.pk])
                self.assertTrue(saved.implementation_complete)

    def test_main_project_rejects_reversed_dates_and_missing_documents(self):
        parent = MainProject.objects.create(name="Incomplete Main implementation")
        reversed_dates = MainProjectSerializer(
            parent,
            data={"startDate": "2027-01-02", "endDate": "2027-01-01"},
            partial=True,
        )
        self.assertFalse(reversed_dates.is_valid())
        self.assertIn("endDate", reversed_dates.errors)

        county = County.objects.create(name="Completion County")
        completion = MainProjectSerializer(
            parent,
            data={
                "projectBudget": "1",
                "background": "Background",
                "projectObjectives": "Objectives",
                "startDate": "2026-01-01",
                "endDate": "2027-01-01",
                "implementationStep": 5,
                "implementationComplete": True,
                "locationCountyIds": [county.pk],
            },
            partial=True,
        )
        self.assertFalse(completion.is_valid())
        self.assertIn("documents", completion.errors)

    def test_main_project_document_upload_is_retrievable(self):
        parent = MainProject.objects.create(name="Document API Main Project")
        admin = self.create_user("Project Admin", "project-admin@example.test")
        admin.role = "system_admin"
        admin.save(update_fields=["role"])
        client = APIClient()
        client.force_authenticate(AccountPrincipal(admin))
        with TemporaryDirectory() as media_root:
            with override_settings(MEDIA_ROOT=media_root):
                response = client.post(
                    "/api/main-project-documents/",
                    {
                        "mainProject": parent.pk,
                        "title": "Project proposal",
                        "documentType": "Project Proposal",
                        "files": SimpleUploadedFile("proposal.pdf", b"proposal"),
                    },
                    format="multipart",
                )
                self.assertEqual(response.status_code, 201, response.data)
                self.assertEqual(response.data["mainProject"], parent.pk)
                self.assertTrue(response.data["files"][0]["available"])
                retrieved = client.get(
                    f"/api/main-project-documents/?main_project={parent.pk}"
                )
                self.assertEqual(retrieved.status_code, 200)
                self.assertEqual(retrieved.data[0]["title"], "Project proposal")

    def test_project_title_locations_are_bound_to_main_project_coverage(self):
        allowed = County.objects.create(name="Allowed County")
        blocked = County.objects.create(name="Blocked County")
        parent = self.create_parent("Geographic parent", [allowed])

        valid = ProjectSerializer(data={
            "name": "Within coverage",
            "mainProjectId": parent.pk,
            "locations": [{"countyId": str(allowed.pk), "county": allowed.name}],
        })
        self.assertTrue(valid.is_valid(), valid.errors)
        project = valid.save()

        invalid = ProjectSerializer(data={
            "name": "Outside coverage",
            "mainProjectId": parent.pk,
            "locations": [{"countyId": str(blocked.pk), "county": blocked.name}],
        })
        self.assertFalse(invalid.is_valid())
        self.assertIn("locations", invalid.errors)

        MainProjectLocation.objects.filter(main_project=parent, county=allowed).delete()
        self.assertEqual(
            ProjectSerializer(project).data["invalidLocations"],
            [{"countyId": str(allowed.pk), "county": allowed.name}],
        )

    def test_project_title_requires_implemented_parent(self):
        parent = MainProject.objects.create(name="Unimplemented parent")
        serializer = ProjectSerializer(data={
            "name": "Premature title",
            "mainProjectId": parent.pk,
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn("mainProjectId", serializer.errors)


class TechnicalReportWorkflowTests(TestCase):
    def create_account(self, name, role):
        return UserAccount.objects.create(
            full_name=name,
            email=f"{role}-{name.lower().replace(' ', '-')}@example.test",
            role=role,
            institute="KALRO",
            password="test-password",
        )

    def create_complete_report(self, lead, status="Draft"):
        parent = MainProject.objects.create(name=f"Main project for {status}")
        project = Project.objects.create(
            project_name=f"Project title for {status}",
            main_project_record=parent,
        )
        project.value_chain_leads.add(lead)
        activity = MainActivity.objects.create(name=f"Activity for {status}")
        sub_activity = SubActivity.objects.create(
            main_activity=activity,
            name=f"Sub activity for {status}",
            category="ICT",
        )
        indicator = MainActivityIndicator.objects.create(
            main_activity=activity,
            category="ICT",
            indicator=f"Indicator for {status}",
            target="0",
        )
        report = TechnicalReport.objects.create(
            title="Quarterly report",
            project=project,
            main_project=parent,
            main_activity=activity,
            sub_activity=sub_activity,
            category="ICT",
            financial_year="2026-2027",
            quarter="Quarter 1",
            created_by=lead,
            status=status,
        )
        IndicatorReport.objects.create(
            technical_report=report,
            indicator_id=str(indicator.pk),
            indicator_name=indicator.indicator,
            target=0,
            reported_value=1,
            achievement="Progress against a zero target.",
        )
        return report

    def test_submit_creates_audit_and_scoped_persistent_notifications(self):
        lead = self.create_account("Value Chain Lead", "value_chain_lead")
        accountant = self.create_account("Accountant", "accountant")
        report = self.create_complete_report(lead)
        client = APIClient()
        client.force_authenticate(AccountPrincipal(lead))

        response = client.post(f"/api/technical-reports/{report.pk}/submit/")

        self.assertEqual(response.status_code, 200, response.data)
        report.refresh_from_db()
        self.assertEqual(report.status, "Submitted to Accountant")
        repeated_submission = client.post(f"/api/technical-reports/{report.pk}/submit/")
        self.assertEqual(repeated_submission.status_code, 400)
        audit = ReportWorkflowAudit.objects.get(report=report)
        self.assertEqual(audit.action, "Submitted")
        self.assertEqual(audit.user_id, lead.pk)
        self.assertIsNotNone(audit.created_at)
        self.assertEqual(
            set(WorkflowNotification.objects.filter(workflow_audit=audit).values_list("recipient_id", flat=True)),
            {lead.pk, accountant.pk},
        )

        client.force_authenticate(AccountPrincipal(accountant))
        notifications = client.get("/api/workflow-notifications/")
        self.assertEqual(notifications.status_code, 200)
        self.assertEqual([item["reportId"] for item in notifications.data], [report.pk])
        notification_id = notifications.data[0]["id"]
        read_response = client.post(
            f"/api/workflow-notifications/{notification_id}/mark-read/"
        )
        self.assertEqual(read_response.status_code, 200)
        self.assertTrue(read_response.data["isRead"])
        lead_notification_id = WorkflowNotification.objects.get(
            workflow_audit=audit,
            recipient=lead,
        ).pk
        unauthorized_read = client.post(
            f"/api/workflow-notifications/{lead_notification_id}/mark-read/"
        )
        self.assertEqual(unauthorized_read.status_code, 404)

    def test_rejection_requires_and_records_a_reason(self):
        lead = self.create_account("Value Chain Lead", "value_chain_lead")
        accountant = self.create_account("Accountant", "accountant")
        report = TechnicalReport.objects.create(
            title="Quarterly report",
            created_by=lead,
            status="Submitted to Accountant",
        )
        client = APIClient()
        client.force_authenticate(AccountPrincipal(accountant))

        missing_reason = client.post(f"/api/technical-reports/{report.pk}/reject/", {})
        self.assertEqual(missing_reason.status_code, 400)

        response = client.post(
            f"/api/technical-reports/{report.pk}/reject/",
            {"reason": "Please correct the utilization figures."},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        report.refresh_from_db()
        self.assertEqual(report.status, "Rejected by Accountant")
        audit = ReportWorkflowAudit.objects.get(report=report)
        self.assertEqual(audit.rejection_reason, "Please correct the utilization figures.")
        self.assertTrue(WorkflowNotification.objects.filter(
            workflow_audit=audit,
            recipient=lead,
        ).exists())

    def test_accountant_can_review_finances_but_cannot_update_report_contents(self):
        lead = self.create_account("Value Chain Lead", "value_chain_lead")
        accountant = self.create_account("Accountant", "accountant")
        report = self.create_complete_report(lead, status="Submitted to Accountant")
        client = APIClient()
        client.force_authenticate(AccountPrincipal(accountant))

        pending_reports = client.get("/api/technical-reports/")
        self.assertEqual(pending_reports.status_code, 200)
        self.assertIn(report.pk, [item["id"] for item in pending_reports.data])
        report_details = client.get(f"/api/technical-reports/{report.pk}/")
        self.assertEqual(report_details.status_code, 200)
        self.assertEqual(report_details.data["financialReviewStatus"], "Pending")

        forbidden_update = client.patch(
            f"/api/technical-reports/{report.pk}/",
            {"remarks": "Accountant must not edit report contents."},
            format="json",
        )
        self.assertEqual(forbidden_update.status_code, 403)
        report.refresh_from_db()
        self.assertEqual(report.remarks, "")

        approved = client.post(
            f"/api/technical-reports/{report.pk}/approve/",
            {"comments": "Expenditure evidence reviewed."},
            format="json",
        )
        self.assertEqual(approved.status_code, 200, approved.data)
        self.assertEqual(approved.data["financialReviewStatus"], "Approved")
        audit = ReportWorkflowAudit.objects.get(report=report, user=accountant)
        self.assertEqual(audit.comments, "Expenditure evidence reviewed.")
        self.assertEqual(audit.user_role, "accountant")
        approved_details = client.get(f"/api/technical-reports/{report.pk}/")
        self.assertEqual(approved_details.status_code, 200)
        self.assertEqual(approved_details.data["financialReviewStatus"], "Approved")

    def test_rejected_report_can_be_corrected_and_resubmitted_in_place(self):
        lead = self.create_account("Value Chain Lead", "value_chain_lead")
        report = self.create_complete_report(lead, status="Rejected by Accountant")
        client = APIClient()
        client.force_authenticate(AccountPrincipal(lead))

        correction = client.patch(
            f"/api/technical-reports/{report.pk}/",
            {"utilizedAmount": "125.50"},
            format="json",
        )
        self.assertEqual(correction.status_code, 200, correction.data)
        submitted = client.post(f"/api/technical-reports/{report.pk}/submit/")
        self.assertEqual(submitted.status_code, 200, submitted.data)

        report.refresh_from_db()
        self.assertEqual(report.pk, submitted.data["id"])
        self.assertEqual(report.status, "Submitted to Accountant")
        self.assertEqual(report.indicator_reports.count(), 1)
        self.assertEqual(TechnicalReport.objects.filter(project=report.project).count(), 1)
        self.assertEqual(
            list(report.workflow_audit.values_list("action", flat=True)),
            ["Corrected", "Resubmitted"],
        )

    def test_submission_rejects_incomplete_report_without_changing_status(self):
        lead = self.create_account("Value Chain Lead", "value_chain_lead")
        report = TechnicalReport.objects.create(
            title="Incomplete report",
            created_by=lead,
        )
        client = APIClient()
        client.force_authenticate(AccountPrincipal(lead))

        response = client.post(f"/api/technical-reports/{report.pk}/submit/")

        self.assertEqual(response.status_code, 400)
        report.refresh_from_db()
        self.assertEqual(report.status, "Draft")
        self.assertFalse(ReportWorkflowAudit.objects.filter(report=report).exists())

    def test_incomplete_draft_is_persisted_updated_and_hidden_from_accountant(self):
        lead = self.create_account("Draft Owner", "value_chain_lead")
        other_lead = self.create_account("Other Lead", "value_chain_lead")
        accountant = self.create_account("Draft Accountant", "accountant")
        client = APIClient()
        client.force_authenticate(AccountPrincipal(lead))
        draft_url = "/api/technical-reports/save-draft/"
        group_id = "15b1be4a-ea98-4aeb-ae89-df67eec18496"
        payload = {
            "title": "Incomplete technical report",
            "reportGroupId": group_id,
            "achievement": "Field work started",
            "disbursedAmount": "125.00",
            "indicatorReports": [{
                "indicatorId": "indicator-1",
                "indicator": "Seed distribution",
                "target": "10",
                "reportedProgress": None,
                "achievement": "Initial preparations",
            }],
        }

        created = client.post(draft_url, payload, format="json")

        self.assertEqual(created.status_code, 200, created.data)
        report_id = created.data["id"]
        report = TechnicalReport.objects.get(pk=report_id)
        self.assertEqual(report.status, "Draft")
        self.assertEqual(report.created_by_id, lead.pk)
        self.assertEqual(report.project_id, None)
        indicator_report = report.indicator_reports.get()
        self.assertEqual(indicator_report.target, Decimal("10"))
        self.assertIsNone(indicator_report.reported_value)

        payload.update({
            "id": report_id,
            "remarks": "Budget and progress details will follow.",
            "indicatorReports": [{
                "indicatorId": "indicator-1",
                "indicator": "Seed distribution",
                "target": "12",
                "reportedProgress": None,
                "achievement": "Initial preparations updated",
            }],
        })
        updated = client.post(draft_url, payload, format="json")
        self.assertEqual(updated.status_code, 200, updated.data)
        self.assertEqual(updated.data["id"], report_id)
        self.assertEqual(TechnicalReport.objects.filter(created_by=lead).count(), 1)
        indicator_report.refresh_from_db()
        self.assertEqual(indicator_report.target, Decimal("12"))
        self.assertIsNone(indicator_report.reported_value)

        self.assertEqual(
            client.get("/api/technical-reports/").data[0]["id"],
            report_id,
        )
        client.force_authenticate(AccountPrincipal(other_lead))
        self.assertEqual(client.get(f"/api/technical-reports/{report_id}/").status_code, 404)

        client.force_authenticate(AccountPrincipal(accountant))
        self.assertNotIn(
            report_id,
            [item["id"] for item in client.get("/api/technical-reports/").data],
        )

        client.force_authenticate(AccountPrincipal(lead))
        incomplete_submission = client.post(
            f"/api/technical-reports/{report_id}/submit/"
        )
        self.assertEqual(incomplete_submission.status_code, 400)
        report.refresh_from_db()
        self.assertEqual(report.status, "Draft")

    def test_draft_evidence_can_be_uploaded_before_progress_is_entered(self):
        lead = self.create_account("Evidence Draft Owner", "value_chain_lead")
        client = APIClient()
        client.force_authenticate(AccountPrincipal(lead))
        with TemporaryDirectory() as media_root, override_settings(MEDIA_ROOT=media_root):
            draft = client.post(
                "/api/technical-reports/save-draft/",
                {
                    "title": "Evidence draft",
                    "indicatorReports": [{
                        "indicatorId": "indicator-1",
                        "indicator": "Seed distribution",
                        "target": "10",
                        "reportedProgress": None,
                    }],
                },
                format="json",
            )
            self.assertEqual(draft.status_code, 200, draft.data)
            row_id = draft.data["indicatorReports"][0]["id"]
            upload = client.post(
                f"/api/technical-reports/{draft.data['id']}/indicator-reports/{row_id}/evidence/",
                {"files": [SimpleUploadedFile("evidence.txt", b"draft evidence")]},
                format="multipart",
            )
            self.assertEqual(upload.status_code, 201, upload.data)

            reopened = client.get(f"/api/technical-reports/{draft.data['id']}/")
            self.assertEqual(reopened.status_code, 200, reopened.data)
            self.assertEqual(
                reopened.data["indicatorReports"][0]["evidenceFiles"][0]["name"],
                "evidence.txt",
            )

    def test_completed_draft_can_be_submitted_for_accountant_review(self):
        lead = self.create_account("Submit Draft Owner", "value_chain_lead")
        accountant = self.create_account("Submit Draft Accountant", "accountant")
        parent = MainProject.objects.create(name="Draft submission parent")
        project = Project.objects.create(
            project_name="Draft submission project",
            main_project_record=parent,
        )
        project.value_chain_leads.add(lead)
        activity = MainActivity.objects.create(name="Draft submission activity")
        sub_activity = SubActivity.objects.create(
            main_activity=activity,
            name="Draft submission sub-activity",
            category="ICT",
        )
        indicator = MainActivityIndicator.objects.create(
            main_activity=activity,
            category="ICT",
            indicator="Draft submission indicator",
        )
        client = APIClient()
        client.force_authenticate(AccountPrincipal(lead))

        draft = client.post(
            "/api/technical-reports/save-draft/",
            {
                "title": "Ready draft",
                "projectId": project.pk,
                "mainProjectId": parent.pk,
                "quarter": "Quarter 1",
                "financialYear": "2026-2027",
                "mainActivityId": activity.pk,
                "category": "ICT",
                "subActivityId": sub_activity.pk,
                "indicatorReports": [{
                    "indicatorId": str(indicator.pk),
                    "indicator": indicator.indicator,
                    "target": "10",
                    "reportedProgress": "2",
                }],
            },
            format="json",
        )
        self.assertEqual(draft.status_code, 200, draft.data)

        submitted = client.post(
            f"/api/technical-reports/{draft.data['id']}/submit/"
        )

        self.assertEqual(submitted.status_code, 200, submitted.data)
        self.assertEqual(submitted.data["status"], "Submitted to Accountant")
        report = TechnicalReport.objects.get(pk=draft.data["id"])
        self.assertEqual(report.status, "Submitted to Accountant")
        self.assertTrue(report.context_key)
        self.assertEqual(
            ReportWorkflowAudit.objects.get(report=report, action="Submitted").user_id,
            lead.pk,
        )
        accountant_client = APIClient()
        accountant_client.force_authenticate(AccountPrincipal(accountant))
        self.assertIn(
            report.pk,
            [item["id"] for item in accountant_client.get("/api/technical-reports/").data],
        )

    def test_indicator_status_is_scoped_to_project_period_and_activity(self):
        lead = self.create_account("Value Chain Lead", "value_chain_lead")
        report = self.create_complete_report(lead)
        indicator_id = report.indicator_reports.get().indicator_id
        client = APIClient()
        client.force_authenticate(AccountPrincipal(lead))
        base_query = (
            f"project={report.project_id}&financialYear={report.financial_year}"
            f"&mainActivity={report.main_activity_id}&subActivity={report.sub_activity_id}"
            "&category=ICT&general=1"
        )

        same_context = client.get(
            f"/api/technical-reports/indicator-status/?{base_query}"
            f"&quarter=Quarter%201&indicatorId={indicator_id}"
        )
        self.assertEqual(same_context.status_code, 200, same_context.data)
        self.assertEqual(same_context.data["reportedIndicatorIds"], [indicator_id])
        self.assertEqual(same_context.data["cumulative"][indicator_id], 1)

        other_quarter = client.get(
            f"/api/technical-reports/indicator-status/?{base_query}"
            f"&quarter=Quarter%202&indicatorId={indicator_id}"
        )
        self.assertEqual(other_quarter.status_code, 200, other_quarter.data)
        self.assertEqual(other_quarter.data["reportedIndicatorIds"], [])
        self.assertEqual(other_quarter.data["cumulative"], {})

    def test_reviewers_cannot_submit_or_change_report_status(self):
        lead = self.create_account("Value Chain Lead", "value_chain_lead")
        accountant = self.create_account("Accountant", "accountant")
        report = TechnicalReport.objects.create(
            title="Quarterly report",
            created_by=lead,
        )
        serializer = TechnicalReportSerializer(
            report,
            data={"status": "Approved/Finalized"},
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertNotIn("status", serializer.validated_data)
        serializer.save()
        report.refresh_from_db()
        self.assertEqual(report.status, "Draft")

        client = APIClient()
        client.force_authenticate(AccountPrincipal(accountant))
        response = client.post(f"/api/technical-reports/{report.pk}/submit/")
        self.assertEqual(response.status_code, 404)
        report.refresh_from_db()
        self.assertEqual(report.status, "Draft")

    def test_final_approval_creates_read_only_me_copy_and_hides_it_from_lead(self):
        lead = self.create_account("Value Chain Lead", "value_chain_lead")
        me_reviewer = self.create_account("M and E Reviewer", "me")
        admin = self.create_account("System Administrator", "system_admin")
        report = TechnicalReport.objects.create(
            title="Quarterly report",
            created_by=lead,
            status="Submitted to M&E",
            disbursed_amount=100,
            utilized_amount=65,
            supporting_information="Final supporting information",
            supporting_documents=["technical-report-evidence/attachment.pdf"],
        )
        indicator_report = IndicatorReport.objects.create(
            technical_report=report,
            indicator_id="indicator-1",
            indicator_name="Reported output",
            target=10,
            reported_value=7,
            achievement="Seven units delivered.",
            remarks="Verified against field records.",
        )
        ReportWorkflowAudit.objects.create(
            report=report,
            action="Approved",
            user=me_reviewer,
            user_role="accountant",
            previous_status="Submitted to Accountant",
            new_status="Submitted to Project Coordinator",
            comments="Financial records reviewed.",
        )
        ReportWorkflowAudit.objects.create(
            report=report,
            action="Approved",
            user=me_reviewer,
            user_role="project_coordinator",
            previous_status="Submitted to Project Coordinator",
            new_status="Submitted to M&E",
            comments="Project progress reviewed.",
        )

        with TemporaryDirectory() as media_root, override_settings(MEDIA_ROOT=media_root):
            IndicatorReportEvidence.objects.create(
                indicator_report=indicator_report,
                file=SimpleUploadedFile("field-evidence.txt", b"verified evidence"),
                name="field-evidence.txt",
                uploaded_by=lead,
            )
            client = APIClient()
            client.force_authenticate(AccountPrincipal(me_reviewer))

            response = client.post(f"/api/technical-reports/{report.pk}/approve/")

            self.assertEqual(response.status_code, 200, response.data)
            report.refresh_from_db()
            finalized_copy = TechnicalReport.objects.get(original_report=report)
            self.assertEqual(finalized_copy.status, "Approved/Finalized")
            self.assertEqual(finalized_copy.title, report.title)
            self.assertEqual(finalized_copy.disbursed_amount, report.disbursed_amount)
            self.assertEqual(finalized_copy.utilized_amount, report.utilized_amount)
            self.assertEqual(finalized_copy.supporting_information, report.supporting_information)
            self.assertEqual(finalized_copy.supporting_documents, report.supporting_documents)
            self.assertEqual(finalized_copy.indicator_reports.count(), 1)
            copied_indicator = finalized_copy.indicator_reports.get()
            self.assertEqual(copied_indicator.achievement, indicator_report.achievement)
            self.assertEqual(copied_indicator.remarks, indicator_report.remarks)
            self.assertEqual(copied_indicator.evidence_files.count(), 1)
            self.assertEqual(
                [event["comments"] for event in response.data["workflowHistory"]],
                ["Financial records reviewed.", "Project progress reviewed.", ""],
            )

            me_reports = client.get("/api/technical-reports/")
            self.assertEqual(me_reports.status_code, 200)
            self.assertEqual([item["id"] for item in me_reports.data], [finalized_copy.pk])
            self.assertTrue(me_reports.data[0]["isFinalizedCopy"])
            copy_details = client.get(f"/api/technical-reports/{finalized_copy.pk}/")
            self.assertEqual(copy_details.status_code, 200)
            self.assertEqual(copy_details.data["workflowHistory"], response.data["workflowHistory"])
            forbidden_update = client.patch(
                f"/api/technical-reports/{finalized_copy.pk}/",
                {"remarks": "Attempted change"},
                format="json",
            )
            self.assertEqual(forbidden_update.status_code, 403)

            copied_evidence = copied_indicator.evidence_files.get()
            downloaded_evidence = client.get(
                f"/api/technical-reports/{finalized_copy.pk}/indicator-reports/"
                f"{copied_indicator.pk}/evidence/{copied_evidence.pk}/download/"
            )
            self.assertEqual(downloaded_evidence.status_code, 200)
            self.assertEqual(b"".join(downloaded_evidence.streaming_content), b"verified evidence")

            client.force_authenticate(AccountPrincipal(lead))
            lead_reports = client.get("/api/technical-reports/")
            self.assertEqual(lead_reports.status_code, 200)
            self.assertEqual([item["id"] for item in lead_reports.data], [report.pk])
            self.assertEqual(
                client.get(f"/api/technical-reports/{finalized_copy.pk}/").status_code,
                404,
            )
            self.assertEqual(
                client.get(
                    f"/api/technical-reports/{finalized_copy.pk}/indicator-reports/"
                    f"{copied_indicator.pk}/evidence/{copied_evidence.pk}/download/"
                ).status_code,
                404,
            )

            client.force_authenticate(AccountPrincipal(me_reviewer))
            repeated_approval = client.post(f"/api/technical-reports/{report.pk}/approve/")
            self.assertEqual(repeated_approval.status_code, 404)
            self.assertEqual(TechnicalReport.objects.filter(original_report=report).count(), 1)
            self.assertEqual(TechnicalReport.objects.filter(pk=report.pk).count(), 1)

            client.force_authenticate(AccountPrincipal(admin))
            admin_reports = client.get("/api/technical-reports/")
            self.assertEqual(admin_reports.status_code, 200)
            self.assertEqual([item["id"] for item in admin_reports.data], [report.pk])
            self.assertEqual(
                client.get(f"/api/technical-reports/{finalized_copy.pk}/").status_code,
                200,
            )

        TechnicalReportViewSet._create_finalized_copy(report)
        self.assertEqual(TechnicalReport.objects.filter(original_report=report).count(), 1)

    def test_saved_report_pdf_endpoint_includes_evidence_and_checks_report_access(self):
        lead = self.create_account("PDF Report Lead", "value_chain_lead")
        other_lead = self.create_account("Other PDF Lead", "value_chain_lead")
        report = self.create_complete_report(lead)
        indicator_report = report.indicator_reports.get()
        image_buffer = BytesIO()
        Image.new("RGB", (40, 20), color=(20, 120, 60)).save(image_buffer, format="PNG")

        with TemporaryDirectory() as media_root, override_settings(MEDIA_ROOT=media_root):
            evidence = IndicatorReportEvidence.objects.create(
                indicator_report=indicator_report,
                file=SimpleUploadedFile("field-image.png", image_buffer.getvalue(), content_type="image/png"),
                name="field-image.png",
                uploaded_by=lead,
            )
            client = APIClient()
            client.force_authenticate(AccountPrincipal(lead))
            response = client.get(f"/api/technical-reports/{report.pk}/pdf/")

            self.assertEqual(response.status_code, 200)
            self.assertEqual(response["Content-Type"], "application/pdf")
            self.assertIn("inline; filename=", response["Content-Disposition"])
            self.assertTrue(response.content.startswith(b"%PDF-"))
            self.assertGreater(len(response.content), 1000)
            self.assertIn(b"/Subtype /Image", response.content)
            self.assertTrue(evidence.file.storage.exists(evidence.file.name))

            client.force_authenticate(AccountPrincipal(other_lead))
            unauthorized = client.get(f"/api/technical-reports/{report.pk}/pdf/")
            self.assertEqual(unauthorized.status_code, 404)


class TechnicalReportFlexibleLocationTests(TestCase):
    def setUp(self):
        self.county = County.objects.create(name="Configured County")
        self.parent = MainProject.objects.create(
            name="Main",
            implementation_complete=True,
            implementation_step=5,
        )
        MainProjectLocation.objects.create(main_project=self.parent, county=self.county)
        self.project = Project.objects.create(project_name="Title", main_project_record=self.parent)
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

    def test_report_persists_decimal_indicator_values_and_progress_after_reload(self):
        activity = MainActivity.objects.create(name="Decimal Reporting Activity")
        indicator = MainActivityIndicator.objects.create(
            main_activity=activity,
            category="ICT",
            indicator="Services delivered",
            target="10",
        )
        serializer = TechnicalReportSerializer(data={
            "title": "Decimal report",
            "projectId": self.project.pk,
            "mainActivityId": activity.pk,
            "category": "ICT",
            "quarter": "Quarter 1",
            "financialYear": "2026-2027",
            "selectedLocations": [{
                "projectLocationId": self.ward_location.pk,
                "countyId": self.county.pk,
                "subCountyId": self.sub_county.pk,
                "wardId": self.ward.pk,
            }],
            "indicatorReports": [{
                "projectLocationId": self.ward_location.pk,
                "wardId": self.ward.pk,
                "indicatorId": str(indicator.pk),
                "indicator": indicator.indicator,
                "target": "10",
                "reportedProgress": "2.5",
                "achievement": "2.5 delivered",
            }],
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        saved = serializer.save()

        reloaded = TechnicalReport.objects.get(pk=saved.pk)
        row = reloaded.indicator_reports.get()
        self.assertEqual(reloaded.main_project_id, self.parent.pk)
        self.assertEqual(row.project_location_id, self.ward_location.pk)
        self.assertEqual(row.ward_id, self.ward.pk)
        self.assertEqual(str(row.target), "10.00")
        self.assertEqual(str(row.reported_value), "2.50")
        self.assertEqual(row.achievement, "2.5 delivered")
        self.assertEqual(TechnicalReportSerializer(reloaded).data["indicatorReports"][0]["progress"], 25.0)

    def test_target_boundaries_keep_zero_reason_and_prevent_over_reporting(self):
        activity = MainActivity.objects.create(name="Boundary Reporting Activity")
        indicator = MainActivityIndicator.objects.create(
            main_activity=activity,
            category="ICT",
            indicator="Boundary indicator",
            target="10",
        )

        def serializer_for(value, target="10", quarter="Quarter 1", **extras):
            return TechnicalReportSerializer(data={
                "title": "Boundary report",
                "projectId": self.project.pk,
                "mainActivityId": activity.pk,
                "category": "ICT",
                "quarter": quarter,
                "financialYear": "2026-2027",
                "indicatorReports": [{
                    "indicatorId": str(indicator.pk),
                    "indicator": indicator.indicator,
                    "target": target,
                    "reportedProgress": str(value),
                    **extras,
                }],
            })

        equal_target = serializer_for("10")
        self.assertTrue(equal_target.is_valid(), equal_target.errors)
        over_target = serializer_for("10.01")
        self.assertFalse(over_target.is_valid())
        self.assertIn("indicatorReports", over_target.errors)

        indicator.target = "0"
        indicator.save(update_fields=["target"])
        zero_target_report = serializer_for("0", target="0", reasonForZero="No activity this quarter")
        self.assertTrue(zero_target_report.is_valid(), zero_target_report.errors)
        positive_against_zero = serializer_for("1", target="0")
        self.assertTrue(positive_against_zero.is_valid(), positive_against_zero.errors)
        positive_report = positive_against_zero.save()
        self.assertEqual(positive_report.indicator_reports.get().reported_value, 1)
        positive_with_report_target = serializer_for("2.5", target="10", quarter="Quarter 2")
        self.assertTrue(positive_with_report_target.is_valid(), positive_with_report_target.errors)
        report = positive_with_report_target.save()
        self.assertEqual(report.indicator_reports.get().target, 10)

    def test_target_defaults_to_zero_and_zero_target_accepts_decimal_achievement(self):
        activity = MainActivity.objects.create(name="Zero Default Activity")
        indicator = MainActivityIndicator.objects.create(
            main_activity=activity,
            category="ICT",
            indicator="Zero target indicator",
        )
        serializer = TechnicalReportSerializer(data={
            "title": "Zero target report",
            "projectId": self.project.pk,
            "mainActivityId": activity.pk,
            "category": "ICT",
            "quarter": "Quarter 1",
            "financialYear": "2026-2027",
            "indicatorReports": [{
                "indicatorId": str(indicator.pk),
                "indicator": indicator.indicator,
                "reportedProgress": "0.75",
                "achievement": "Delivered 0.75 units.",
            }],
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)
        report = serializer.save()
        row = report.indicator_reports.get()
        self.assertEqual(row.target, 0)
        self.assertEqual(row.reported_value, Decimal("0.75"))

    def test_duplicate_indicator_is_rejected_only_in_the_same_reporting_context(self):
        activity = MainActivity.objects.create(name="Duplicate Context Activity")
        indicator = MainActivityIndicator.objects.create(
            main_activity=activity,
            category="ICT",
            indicator="Context scoped indicator",
            target="10",
        )

        def serializer_for(quarter):
            return TechnicalReportSerializer(data={
                "title": "Context report",
                "projectId": self.project.pk,
                "mainActivityId": activity.pk,
                "category": "ICT",
                "quarter": quarter,
                "financialYear": "2026-2027",
                "indicatorReports": [{
                    "indicatorId": str(indicator.pk),
                    "indicator": indicator.indicator,
                    "target": "10",
                    "reportedProgress": "1",
                }],
            })

        first = serializer_for("Quarter 1")
        self.assertTrue(first.is_valid(), first.errors)
        first.save()
        duplicate = serializer_for("Quarter 1")
        self.assertFalse(duplicate.is_valid())
        self.assertIn("indicatorReports", duplicate.errors)
        different_period = serializer_for("Quarter 2")
        self.assertTrue(different_period.is_valid(), different_period.errors)

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
