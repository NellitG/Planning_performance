import mimetypes
from time import sleep
from urllib.error import URLError
from urllib.request import Request, urlopen

from django.db import IntegrityError, transaction
from django.db.models import Q
from django.http import HttpResponse
from django.http import FileResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from .models import (
    ExpectedOutput,
    ActivityIndicator,
    IndicatorTracking,
    KeyActivity,
    KeyResultArea,
    MainActivity,
    MainActivityIndicator,
    OutputIndicator,
    Outcome,
    OutcomeIndicator,
    Project,
    ProjectComponent,
    ProjectDocument,
    ProjectDocumentFile,
    ProjectMapping,
    ProjectSubComponent,
    ProjectOutput,
    Strategy,
    StrategicObjective,
    SubActivity,
    SubSubActivity,
    TechnicalReport,
    IndicatorReport,
    IndicatorReportEvidence,
    MainProject,
    MainProjectDocument,
    MainProjectDocumentFile,
    ProjectLocation,
    County,
    ReportWorkflowAudit,
    WorkflowNotification,
)
from .permissions import ProjectPermission, ReportPermission, has_role
from user_management.models import UserAccount
from .serializers import (
    ExpectedOutputSerializer,
    ActivityIndicatorSerializer,
    IndicatorTrackingSerializer,
    KeyActivitySerializer,
    KeyResultAreaSerializer,
    MainActivityIndicatorSerializer,
    MainActivitySerializer,
    OutputIndicatorSerializer,
    OutcomeIndicatorSerializer,
    OutcomeSerializer,
    ProjectDocumentFileSerializer,
    ProjectDocumentSerializer,
    ProjectMappingSerializer,
    ProjectComponentSerializer,
    ProjectSubComponentSerializer,
    ProjectOutputSerializer,
    ProjectSerializer,
    StrategicObjectiveSerializer,
    StrategySerializer,
    SubActivitySerializer,
    SubSubActivitySerializer,
    TechnicalReportSerializer,
    IndicatorReportSerializer,
    IndicatorReportEvidenceSerializer,
    CountySerializer,
    MainProjectSerializer,
    MainProjectDocumentFileSerializer,
    MainProjectDocumentSerializer,
    WorkflowNotificationSerializer,
)


def kenya_counties_map(request):
    source_url = "https://simplemaps.com/static/svg/country/ke/admin1/ke.svg"
    source_request = Request(
        source_url,
        headers={
            "Accept": "image/svg+xml,text/xml;q=0.9,*/*;q=0.8",
            "User-Agent": "Mozilla/5.0 KALRO-PPM/1.0",
        },
    )
    last_error = "upstream request failed"
    for attempt in range(3):
        try:
            with urlopen(source_request, timeout=20) as response:
                svg = response.read()
            return HttpResponse(svg, content_type="image/svg+xml")
        except (OSError, URLError) as error:
            last_error = str(error)
            if attempt < 2:
                sleep(0.5)
    return HttpResponse(
        f"Unable to load the Kenya county map from the upstream SVG: {last_error}",
        status=502,
        content_type="text/plain",
    )


@api_view(["GET"])
def geography(request):
    queryset = County.objects.prefetch_related("sub_counties__wards")
    return Response(CountySerializer(queryset, many=True).data)


class BulkCreateMixin:
    """Allow POST with a JSON list to create many objects at once."""

    def create(self, request, *args, **kwargs):
        many = isinstance(request.data, list)
        serializer = self.get_serializer(data=request.data, many=many)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            serializer.save()
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    filterset_fields = ["status"]
    permission_classes = [ProjectPermission]

    def get_queryset(self):
        queryset = super().get_queryset()
        if has_role(self.request.user, "value_chain_lead") and not has_role(
            self.request.user, "system_admin"
        ):
            return queryset.filter(value_chain_leads=self.request.user.pk).distinct()
        return queryset


class MainProjectViewSet(viewsets.ModelViewSet):
    queryset = MainProject.objects.prefetch_related(
        "project_titles__project_locations__county",
        "county_locations__county",
        "funding_sources__funding_agency",
        "funding_sources__funding_type",
    ).all()
    serializer_class = MainProjectSerializer
    filterset_fields = ["status"]
    permission_classes = [ProjectPermission]

    def get_queryset(self):
        queryset = super().get_queryset()
        if has_role(self.request.user, "value_chain_lead") and not has_role(
            self.request.user, "system_admin"
        ):
            return queryset.filter(
                project_titles__value_chain_leads=self.request.user.pk
            ).distinct()
        return queryset


class MainProjectDocumentViewSet(viewsets.ModelViewSet):
    queryset = MainProjectDocument.objects.prefetch_related("files").all()
    serializer_class = MainProjectDocumentSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ["main_project"]
    permission_classes = [ProjectPermission]

    def create(self, request, *args, **kwargs):
        files = request.FILES.getlist("files") or request.FILES.getlist("file")
        if not files:
            raise ValidationError({"files": "Upload at least one Main Project document file."})
        if any(file.size <= 0 for file in files):
            raise ValidationError({"files": "Main Project document files cannot be empty."})
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            document = serializer.save()
            for file in files:
                MainProjectDocumentFile.objects.create(
                    document=document,
                    file=file,
                    name=file.name,
                    size=file.size,
                    file_type=file.content_type or "",
                )
        response_serializer = self.get_serializer(document)
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=self.get_success_headers(response_serializer.data),
        )

    @action(detail=True, methods=["post"], url_path="add-files")
    def add_files(self, request, pk=None):
        document = self.get_object()
        files = request.FILES.getlist("files") or request.FILES.getlist("file")
        if not files:
            raise ValidationError({"files": "Upload at least one file."})
        if any(file.size <= 0 for file in files):
            raise ValidationError({"files": "Main Project document files cannot be empty."})
        with transaction.atomic():
            for file in files:
                MainProjectDocumentFile.objects.create(
                    document=document,
                    file=file,
                    name=file.name,
                    size=file.size,
                    file_type=file.content_type or "",
                )
        return Response(self.get_serializer(document).data)

    def perform_destroy(self, instance):
        for document_file in instance.files.all():
            document_file.file.delete(save=False)
        super().perform_destroy(instance)


class MainProjectDocumentFileViewSet(viewsets.ModelViewSet):
    queryset = MainProjectDocumentFile.objects.select_related(
        "document", "document__main_project"
    ).all()
    serializer_class = MainProjectDocumentFileSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ["document"]
    permission_classes = [ProjectPermission]

    def perform_destroy(self, instance):
        instance.file.delete(save=False)
        super().perform_destroy(instance)


class WorkflowNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = WorkflowNotificationSerializer
    permission_classes = [ReportPermission]

    def get_queryset(self):
        return WorkflowNotification.objects.filter(
            recipient_id=self.request.user.pk
        ).select_related("report", "workflow_audit")

    @action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=["is_read"])
        return Response(self.get_serializer(notification).data)

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"markedRead": True})


class KeyResultAreaViewSet(viewsets.ModelViewSet):
    queryset = KeyResultArea.objects.all()
    serializer_class = KeyResultAreaSerializer

    @action(detail=True, methods=["get"], url_path="strategic-objectives")
    def strategic_objectives(self, request, pk=None):
        kra = self.get_object()
        qs = kra.objectives.all()
        serializer = StrategicObjectiveSerializer(
            qs, many=True, context=self.get_serializer_context()
        )
        return Response(serializer.data)


class StrategicObjectiveViewSet(viewsets.ModelViewSet):
    queryset = StrategicObjective.objects.all()
    serializer_class = StrategicObjectiveSerializer
    filterset_fields = ["key_result_area"]

    @action(detail=True, methods=["get"])
    def strategies(self, request, pk=None):
        obj = self.get_object()
        qs = obj.strategies.all()
        serializer = StrategySerializer(
            qs, many=True, context=self.get_serializer_context()
        )
        return Response(serializer.data)


class StrategyViewSet(viewsets.ModelViewSet):
    queryset = Strategy.objects.all()
    serializer_class = StrategySerializer
    filterset_fields = ["strategic_objective"]

    @action(detail=True, methods=["get"])
    def activities(self, request, pk=None):
        strategy = self.get_object()
        qs = strategy.key_activities.all()
        serializer = KeyActivitySerializer(
            qs, many=True, context=self.get_serializer_context()
        )
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="expected-outputs")
    def expected_outputs(self, request, pk=None):
        strategy = self.get_object()
        qs = strategy.expected_outputs.all()
        serializer = ExpectedOutputSerializer(
            qs, many=True, context=self.get_serializer_context()
        )
        return Response(serializer.data)


class KeyActivityViewSet(BulkCreateMixin, viewsets.ModelViewSet):
    queryset = KeyActivity.objects.all()
    serializer_class = KeyActivitySerializer
    filterset_fields = ["strategy"]


class ExpectedOutputViewSet(BulkCreateMixin, viewsets.ModelViewSet):
    queryset = ExpectedOutput.objects.select_related("strategy", "key_activity").all()
    serializer_class = ExpectedOutputSerializer
    filterset_fields = ["strategy", "key_activity"]


class OutputIndicatorViewSet(BulkCreateMixin, viewsets.ModelViewSet):
    queryset = OutputIndicator.objects.select_related(
        "strategy", "key_activity", "expected_output"
    ).all()
    serializer_class = OutputIndicatorSerializer
    filterset_fields = ["expected_output", "strategy", "key_activity"]

    @action(detail=False, methods=["get"], url_path="by-expected-output/(?P<eo_id>[^/.]+)")
    def by_expected_output(self, request, eo_id=None):
        qs = self.queryset.filter(expected_output_id=eo_id)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class OutcomeViewSet(BulkCreateMixin, viewsets.ModelViewSet):
    queryset = Outcome.objects.select_related("key_result_area").prefetch_related("indicators").all()
    serializer_class = OutcomeSerializer
    filterset_fields = ["key_result_area"]


class OutcomeIndicatorViewSet(BulkCreateMixin, viewsets.ModelViewSet):
    queryset = OutcomeIndicator.objects.select_related("outcome").all()
    serializer_class = OutcomeIndicatorSerializer
    filterset_fields = ["outcome"]


class ProjectDocumentViewSet(viewsets.ModelViewSet):
    queryset = ProjectDocument.objects.prefetch_related("files").all()
    serializer_class = ProjectDocumentSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ["project"]

    def create(self, request, *args, **kwargs):
        data = request.data
        files = request.FILES.getlist("files") or request.FILES.getlist("file")
        if not files:
            raise ValidationError({"files": "Upload at least one project document file."})
        if any(file.size <= 0 for file in files):
            raise ValidationError({"files": "Project document files cannot be empty."})
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            document = serializer.save()
            for f in files:
                ProjectDocumentFile.objects.create(
                    document=document,
                    file=f,
                    name=f.name,
                    size=f.size,
                    file_type=f.content_type or "",
                )

        out = self.get_serializer(document)
        headers = self.get_success_headers(out.data)
        return Response(out.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=["post"], url_path="add-files")
    def add_files(self, request, pk=None):
        document = self.get_object()
        files = request.FILES.getlist("files") or request.FILES.getlist("file")
        if not files:
            return Response(
                {"detail": "No files provided."}, status=status.HTTP_400_BAD_REQUEST
            )
        if any(file.size <= 0 for file in files):
            raise ValidationError({"files": "Project document files cannot be empty."})
        with transaction.atomic():
            for f in files:
                ProjectDocumentFile.objects.create(
                    document=document,
                    file=f,
                    name=f.name,
                    size=f.size,
                    file_type=f.content_type or "",
                )
        return Response(self.get_serializer(document).data, status=status.HTTP_200_OK)


class ProjectDocumentFileViewSet(viewsets.ModelViewSet):
    queryset = ProjectDocumentFile.objects.all()
    serializer_class = ProjectDocumentFileSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ["document"]


class ProjectMappingViewSet(viewsets.ModelViewSet):
    queryset = ProjectMapping.objects.all()
    serializer_class = ProjectMappingSerializer
    filterset_fields = ["project"]

    def create(self, request, *args, **kwargs):
        """Upsert mapping by project (one mapping per project)."""
        project_id = request.data.get("project")
        existing = ProjectMapping.objects.filter(project_id=project_id).first()
        if existing:
            serializer = self.get_serializer(existing, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)


class ProjectComponentViewSet(viewsets.ModelViewSet):
    queryset = ProjectComponent.objects.all()
    serializer_class = ProjectComponentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name"]
    ordering_fields = ["name", "created_at", "updated_at"]


class ProjectSubComponentViewSet(viewsets.ModelViewSet):
    queryset = ProjectSubComponent.objects.select_related("component").all()
    serializer_class = ProjectSubComponentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["component"]
    search_fields = ["name", "component__name"]
    ordering_fields = ["name", "component__name", "created_at", "updated_at"]


class ProjectOutputViewSet(BulkCreateMixin, viewsets.ModelViewSet):
    queryset = ProjectOutput.objects.select_related("sub_component", "sub_component__component").all()
    serializer_class = ProjectOutputSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["sub_component"]
    search_fields = ["name", "sub_component__name"]
    ordering_fields = ["name", "sub_component__name", "created_at", "updated_at"]


class IndicatorTrackingViewSet(viewsets.ModelViewSet):
    queryset = IndicatorTracking.objects.all()
    serializer_class = IndicatorTrackingSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ["project", "output_indicator", "year"]

    @action(detail=False, methods=["post"], url_path="bulk-save")
    def bulk_save(self, request):
        """Upsert a set of year entries for a (project, output_indicator)."""
        project_id = request.data.get("project")
        oi_id = request.data.get("outputIndicatorId")
        entries = request.data.get("entries", [])
        if not project_id or not oi_id:
            return Response(
                {"detail": "project and outputIndicatorId are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        results = []
        for entry in entries:
            year = entry.get("year")
            if year is None:
                continue
            payload = {
                "project": project_id,
                "outputIndicatorId": oi_id,
                "year": year,
                "target": entry.get("target"),
                "achievement": entry.get("achievement", ""),
                "evidenceName": entry.get("evidenceName", "") or "",
            }
            instance = IndicatorTracking.objects.filter(
                project_id=project_id, output_indicator_id=oi_id, year=year
            ).first()
            serializer = self.get_serializer(
                instance, data=payload, partial=bool(instance)
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            results.append(serializer.data)
        return Response(results, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="upload-evidence")
    def upload_evidence(self, request, pk=None):
        instance = self.get_object()
        file = request.FILES.get("evidence") or request.FILES.get("file")
        if not file:
            return Response(
                {"detail": "No evidence file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        instance.evidence = file
        instance.evidence_name = file.name
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TechnicalReportViewSet(viewsets.ModelViewSet):
    queryset = TechnicalReport.objects.select_related(
        "main_activity", "sub_activity", "project", "main_project", "ward__sub_county__county"
    ).prefetch_related(
        "indicator_reports__ward__sub_county__county", "indicator_reports__evidence_files"
    ).all()
    serializer_class = TechnicalReportSerializer
    permission_classes = [ReportPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["main_activity", "sub_activity", "status", "project", "main_project"]
    search_fields = [
        "title",
        "reporting_period",
        # "main_activity__name",
        # "sub_activity__name",
    ]
    ordering_fields = [
        "title",
        "reporting_period",
        "created_at",
        "status",
        # "main_activity__name",
        # "sub_activity__name",
    ]

    def get_queryset(self):
        qs = super().get_queryset().prefetch_related("workflow_audit__user")
        user = self.request.user
        if has_role(user, "system_admin"):
            return qs.filter(original_report__isnull=True) if self.action == "list" else qs
        visible = Q(pk__in=[])
        if has_role(user, "value_chain_lead"):
            visible |= Q(original_report__isnull=True) & (
                Q(created_by_id=user.pk) | Q(project__value_chain_leads=user.pk)
            )
        role_statuses = {
            "accountant": "Submitted to Accountant",
            "project_coordinator": "Submitted to Project Coordinator",
            "me": "Submitted to M&E",
        }
        for role, report_status in role_statuses.items():
            if has_role(user, role):
                visible |= Q(status=report_status)
                if role == "me":
                    visible |= Q(
                        status="Approved/Finalized",
                        original_report__isnull=False,
                    )
                if role == "accountant":
                    visible |= Q(workflow_audit__user_id=user.pk, workflow_audit__user_role=role)
        return qs.filter(visible).distinct()

    @staticmethod
    def _can_manage_report(user, report):
        return has_role(user, "system_admin") or (
            has_role(user, "value_chain_lead")
            and (
                report.created_by_id == user.pk
                or (
                    report.project_id
                    and report.project.value_chain_leads.filter(pk=user.pk).exists()
                )
            )
        )

    def perform_create(self, serializer):
        user = self.request.user
        if not has_role(user, "value_chain_lead", "system_admin"):
            raise PermissionDenied("Only a Value Chain Lead can create reports.")
        project = serializer.validated_data.get("project")
        if (
            project
            and has_role(user, "value_chain_lead")
            and not has_role(user, "system_admin")
            and not project.value_chain_leads.filter(pk=user.pk).exists()
        ):
            raise PermissionDenied("You can only create reports for projects assigned to you.")

        existing = serializer._find_context_report(serializer.validated_data)
        if existing and not self._can_manage_report(user, existing):
            raise PermissionDenied("You cannot change another user's report.")
        if existing and existing.status not in (
            "Draft",
            "Rejected by Accountant",
            "Rejected by Project Coordinator",
            "Rejected by M&E",
        ):
            raise PermissionDenied("Report contents cannot be changed while it is under review.")

        if existing:
            with transaction.atomic():
                previous_status = existing.status
                report = serializer.save()
                ReportWorkflowAudit.objects.create(
                    report=report,
                    action="Corrected",
                    user=user.account,
                    user_role=self._role_key(user),
                    previous_status=previous_status,
                    new_status=report.status,
                    comments="Technical report content updated.",
                )
            return
        with transaction.atomic():
            report = serializer.save(created_by=user.account)
            ReportWorkflowAudit.objects.create(
                report=report,
                action="Created",
                user=user.account,
                user_role=self._role_key(user),
                previous_status="",
                new_status=report.status,
            )

    def perform_update(self, serializer):
        report = serializer.instance
        with transaction.atomic():
            report = TechnicalReport.objects.select_for_update().select_related(
                "project"
            ).get(pk=report.pk)
            if not self._can_manage_report(self.request.user, report) or report.status not in (
                "Draft",
                "Rejected by Accountant",
                "Rejected by Project Coordinator",
                "Rejected by M&E",
            ):
                raise PermissionDenied("Report contents cannot be edited at this workflow stage.")
            serializer.instance = report
            previous_status = report.status
            report = serializer.save()
            ReportWorkflowAudit.objects.create(
                report=report,
                action="Corrected",
                user=self.request.user.account,
                user_role=self._role_key(self.request.user),
                previous_status=previous_status,
                new_status=report.status,
                comments="Technical report content updated.",
            )

    def perform_destroy(self, instance):
        if not self._can_manage_report(self.request.user, instance):
            raise PermissionDenied("Only the report's Value Chain Lead can delete it.")
        if instance.status not in (
            "Draft",
            "Rejected by Accountant",
            "Rejected by Project Coordinator",
            "Rejected by M&E",
        ):
            raise PermissionDenied("Reports cannot be deleted while under review or after finalization.")
        instance.delete()

    @action(detail=False, methods=["post"], url_path="save-draft")
    def save_draft(self, request):
        user = request.user
        if not has_role(user, "value_chain_lead", "system_admin"):
            raise PermissionDenied("Only an authorized Value Chain Lead can save report drafts.")

        payload = request.data.copy()
        indicator_reports = payload.pop("indicatorReports", [])
        report_id = payload.pop("id", None)
        if report_id in ("", None):
            report = None
        else:
            report = self.get_queryset().filter(pk=report_id).first()
            if not report:
                raise NotFound("Technical report was not found.")

        with transaction.atomic():
            UserAccount.objects.select_for_update().get(pk=user.account.pk)
            if report:
                report = TechnicalReport.objects.select_for_update().get(pk=report.pk)
                if not self._can_manage_report(user, report):
                    raise PermissionDenied("You cannot change another user's report.")
                if report.status not in (
                    "Draft",
                    "Rejected by Accountant",
                    "Rejected by Project Coordinator",
                    "Rejected by M&E",
                ):
                    raise PermissionDenied("This report cannot be saved as a draft at its current workflow stage.")

            serializer = self.get_serializer(
                report,
                data=payload,
                partial=True,
                context={**self.get_serializer_context(), "saving_draft": True},
            )
            serializer.is_valid(raise_exception=True)
            project = serializer.validated_data.get(
                "project", report.project if report else None
            )
            if (
                project
                and has_role(user, "value_chain_lead")
                and not has_role(user, "system_admin")
                and not project.value_chain_leads.filter(pk=user.pk).exists()
            ):
                raise PermissionDenied("You can only save drafts for projects assigned to you.")

            if not report:
                report_group_id = serializer.validated_data.get("report_group_id")
                if report_group_id:
                    report = TechnicalReport.objects.select_for_update().filter(
                        report_group_id=report_group_id,
                        created_by=user.account,
                        status="Draft",
                        original_report__isnull=True,
                    ).first()
                    if report:
                        serializer = self.get_serializer(
                            report,
                            data=payload,
                            partial=True,
                            context={**self.get_serializer_context(), "saving_draft": True},
                        )
                        serializer.is_valid(raise_exception=True)
            if not report:
                context_data = serializer.validated_data
                complete_context = all(
                    context_data.get(field)
                    for field in (
                        "project",
                        "financial_year",
                        "quarter",
                        "main_activity",
                        "sub_activity",
                        "category",
                    )
                ) and (
                    context_data.get("category") != "Value Chain"
                    or context_data.get("value_chain")
                )
                if complete_context:
                    report = serializer._find_context_report(context_data)
                    if report:
                        report = TechnicalReport.objects.select_for_update().get(
                            pk=report.pk
                        )
                        if not self._can_manage_report(user, report):
                            raise PermissionDenied("You cannot change another user's report.")
                        if report.status not in (
                            "Draft",
                            "Rejected by Accountant",
                            "Rejected by Project Coordinator",
                            "Rejected by M&E",
                        ):
                            raise ValidationError({
                                "status": "A report already exists for this reporting context."
                            })
                        serializer = self.get_serializer(
                            report,
                            data=payload,
                            partial=True,
                            context={**self.get_serializer_context(), "saving_draft": True},
                        )
                        serializer.is_valid(raise_exception=True)

            previous_status = report.status if report else ""
            report = serializer.save(
                status="Draft",
                context_key=None,
                created_by=report.created_by if report else user.account,
            )
            self._save_draft_indicator_reports(report, indicator_reports)
            ReportWorkflowAudit.objects.create(
                report=report,
                action="Draft saved" if previous_status else "Created",
                user=user.account,
                user_role=self._role_key(user),
                previous_status=previous_status,
                new_status="Draft",
                comments="Technical report draft saved.",
            )

        return Response(self.get_serializer(report).data, status=status.HTTP_200_OK)

    def _save_draft_indicator_reports(self, report, incoming_rows):
        if not isinstance(incoming_rows, list):
            raise ValidationError({"indicatorReports": "Indicator reports must be a list."})

        seen = set()
        selected_location_ids = {
            str(location.get("projectLocationId"))
            for location in report.selected_locations or []
            if location.get("projectLocationId")
        }
        for index, raw_item in enumerate(incoming_rows):
            if not isinstance(raw_item, dict):
                raise ValidationError({
                    "indicatorReports": f"Indicator report {index + 1} must be an object."
                })
            item = dict(raw_item)
            indicator_id = str(item.get("indicatorId", "")).strip()
            if not indicator_id or not item.get("indicator"):
                raise ValidationError({
                    "indicatorReports": f"Indicator report {index + 1} needs an indicator ID and name."
                })

            location_id = item.get("projectLocationId") or None
            ward_id = item.get("wardId") or None
            row_key = (str(location_id or ""), str(ward_id or ""), indicator_id)
            if row_key in seen:
                raise ValidationError({
                    "indicatorReports": "An indicator can only appear once per reporting location."
                })
            seen.add(row_key)

            existing_rows = report.indicator_reports.filter(indicator_id=indicator_id)
            if location_id:
                existing_rows = existing_rows.filter(project_location_id=location_id)
            else:
                existing_rows = existing_rows.filter(
                    project_location__isnull=True,
                    ward_id=ward_id,
                )
            existing = existing_rows.first()
            if item.get("target") in (None, ""):
                item["target"] = existing.target if existing else "0"
            if "reportedProgress" not in item:
                item["reportedProgress"] = (
                    existing.reported_value if existing else None
                )
            elif item["reportedProgress"] == "":
                item["reportedProgress"] = None

            row_serializer = IndicatorReportSerializer(
                existing,
                data=item,
                partial=True,
                context={"request": self.request, "saving_draft": True},
            )
            row_serializer.is_valid(raise_exception=True)
            row_data = row_serializer.validated_data
            location = row_data.get(
                "project_location", existing.project_location if existing else None
            )
            ward = row_data.get("ward", existing.ward if existing else None)
            if location and (
                not report.project_id or location.project_id != report.project_id
            ):
                raise ValidationError({
                    "indicatorReports": "Each reporting location must belong to the selected Project Title."
                })
            if location and selected_location_ids and str(location.pk) not in selected_location_ids:
                raise ValidationError({
                    "indicatorReports": "Each indicator must use a location selected for this report."
                })
            if location and location.ward_id and ward and location.ward_id != ward.pk:
                raise ValidationError({
                    "indicatorReports": "The indicator ward does not match its selected reporting location."
                })
            if existing:
                row_serializer.save()
            else:
                row_serializer.save(
                    technical_report=report,
                    project_location=location,
                    ward=ward,
                )

    def _notify_users(self, audit, roles, report, message, additional_users=()):
        recipients = list(
            UserAccount.objects.filter(is_active=True)
            .filter(Q(role__in=roles) | Q(roles__key__in=roles))
            .distinct()
        )
        recipients.extend(user for user in additional_users if user)
        for recipient in {user.pk: user for user in recipients}.values():
            WorkflowNotification.objects.get_or_create(
                recipient=recipient,
                workflow_audit=audit,
                defaults={"report": report, "message": message},
            )

    def _role_key(self, user):
        role_keys = set(user.account.roles.values_list("key", flat=True))
        role_keys.add(user.account.role)
        return next(
            (
                key
                for key in (
                    "value_chain_lead",
                    "accountant",
                    "project_coordinator",
                    "me",
                    "system_admin",
                )
                if key in role_keys
            ),
            user.account.role,
        )

    def _transition(self, report, action, next_status, reason="", role_key=None, comments=""):
        previous = report.status
        report.status = next_status
        report.save(update_fields=["status", "updated_at"])
        return ReportWorkflowAudit.objects.create(
            report=report,
            action=action,
            user=self.request.user.account,
            user_role=role_key or self._role_key(self.request.user),
            previous_status=previous,
            new_status=next_status,
            rejection_reason=reason,
            comments=comments,
        )

    @staticmethod
    def _validate_report_for_submission(report):
        required_fields = {
            "project": report.project_id,
            "Main Project": report.main_project_id,
            "financial year": report.financial_year,
            "quarter": report.quarter,
            "main activity": report.main_activity_id,
            "sub activity": report.sub_activity_id,
            "category": report.category,
        }
        missing = [label for label, value in required_fields.items() if not value]
        if missing:
            raise ValidationError({
                "report": f"Complete the report before submission. Missing: {', '.join(missing)}."
            })
        if report.category == "Value Chain" and not report.value_chain:
            raise ValidationError({"valueChain": "Select a value chain before submission."})
        indicator_reports = list(report.indicator_reports.all())
        if not indicator_reports:
            raise ValidationError({"indicatorReports": "Add at least one indicator report before submission."})
        for item in indicator_reports:
            if (
                item.target < 0
                or item.reported_value is None
                or item.reported_value < 0
            ):
                raise ValidationError({"indicatorReports": "Targets and reported values must be non-negative."})
            if item.reported_value == 0 and not item.reason_for_zero.strip():
                raise ValidationError({
                    "indicatorReports": f"Provide a reason for zero progress on '{item.indicator_name}'."
                })

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        report = self.get_object()
        if not has_role(request.user, "value_chain_lead") or not self._can_manage_report(
            request.user, report
        ):
            raise PermissionDenied("Only an assigned Value Chain Lead can submit this report.")
        with transaction.atomic():
            report = TechnicalReport.objects.select_for_update().get(pk=report.pk)
            if report.status not in (
                "Draft",
                "Rejected by Accountant",
                "Rejected by Project Coordinator",
                "Rejected by M&E",
            ):
                raise ValidationError({"status": "This report is not ready to be submitted."})
            self._validate_report_for_submission(report)
            submission_serializer = self.get_serializer(
                report,
                data=self.get_serializer(report).data,
                partial=True,
            )
            submission_serializer.is_valid(raise_exception=True)
            context_key = TechnicalReportSerializer._context_key({
                "project": report.project,
                "financial_year": report.financial_year,
                "quarter": report.quarter,
                "main_activity": report.main_activity,
                "sub_activity": report.sub_activity,
                "category": report.category,
                "value_chain": report.value_chain,
            })
            if TechnicalReport.objects.exclude(pk=report.pk).filter(
                context_key=context_key
            ).exists():
                raise ValidationError({
                    "report": "A report already exists for this project and reporting context."
                })
            report.context_key = context_key
            try:
                with transaction.atomic():
                    report.save(update_fields=["context_key"])
            except IntegrityError as error:
                raise ValidationError({
                    "report": "A report already exists for this project and reporting context."
                }) from error
            previous = report.status
            audit = self._transition(
                report,
                "Resubmitted" if previous.startswith("Rejected by ") else "Submitted",
                "Submitted to Accountant",
                role_key="value_chain_lead",
            )
            message = (
                f"A technical report, '{report.title}', has been submitted and is "
                f"awaiting your review. Submitted by {request.user.account.full_name} "
                f"on {audit.created_at.isoformat()}."
            )
            self._notify_users(
                audit,
                ["accountant"],
                report,
                message,
                additional_users=[request.user.account],
            )
        return Response(self.get_serializer(report).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        report = self.get_object()
        comments = request.data.get("comments", "")
        if not isinstance(comments, str):
            raise ValidationError({"comments": "Comments must be text."})
        transitions = {
            "Submitted to Accountant": (
                "accountant",
                "Submitted to Project Coordinator",
            ),
            "Submitted to Project Coordinator": (
                "project_coordinator",
                "Submitted to M&E",
            ),
            "Submitted to M&E": ("me", "Approved/Finalized"),
        }
        with transaction.atomic():
            report = TechnicalReport.objects.select_for_update().get(pk=report.pk)
            transition = transitions.get(report.status)
            if not transition:
                raise ValidationError({"status": "This report cannot be approved again."})
            role_key, next_status = transition
            if not has_role(request.user, role_key):
                raise PermissionDenied("You are not authorized to approve this report at its current stage.")
            audit = self._transition(
                report,
                "Approved",
                next_status,
                role_key=role_key,
                comments=comments.strip(),
            )
            if next_status == "Submitted to Project Coordinator":
                roles = ["project_coordinator", "value_chain_lead"]
                message = (
                    f"Report '{report.title}' passed Accountant review and is awaiting "
                    f"Project Coordinator review. Reviewed by {request.user.account.full_name} "
                    f"on {audit.created_at.isoformat()}."
                )
            elif next_status == "Submitted to M&E":
                roles = ["me", "value_chain_lead"]
                message = (
                    f"Report '{report.title}' passed Project Coordinator review and is "
                    f"awaiting M&E review. Reviewed by {request.user.account.full_name} "
                    f"on {audit.created_at.isoformat()}."
                )
            else:
                roles = ["value_chain_lead"]
                message = (
                    f"Report '{report.title}' completed the approval workflow and was "
                    f"finalized by {request.user.account.full_name} on "
                    f"{audit.created_at.isoformat()}."
                )
                self._create_finalized_copy(report)
            self._notify_users(
                audit,
                roles,
                report,
                message,
                additional_users=[report.created_by],
            )
        return Response(self.get_serializer(report).data)

    @staticmethod
    @transaction.atomic
    def _create_finalized_copy(report):
        report = TechnicalReport.objects.select_for_update().get(pk=report.pk)
        if report.status != "Approved/Finalized":
            return None
        existing_copy = TechnicalReport.objects.filter(original_report=report).first()
        if existing_copy:
            return existing_copy
        values = {
            field.attname: getattr(report, field.attname)
            for field in TechnicalReport._meta.concrete_fields
            if field.name not in {
                "id",
                "original_report",
                "context_key",
                "created_at",
                "updated_at",
            }
        }
        copy = TechnicalReport.objects.create(
            **values,
            original_report=report,
            context_key=None,
        )
        for row in report.indicator_reports.prefetch_related("evidence_files"):
            evidence_files = list(row.evidence_files.all())
            row.pk = None
            row.id = None
            row.technical_report = copy
            row.save()
            for evidence in evidence_files:
                evidence.pk = None
                evidence.id = None
                evidence.indicator_report = row
                evidence.save()
        return copy

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        report = self.get_object()
        reason = request.data.get("reason", "")
        if not isinstance(reason, str) or not reason.strip():
            raise ValidationError({"reason": "A rejection reason is required."})
        transitions = {
            "Submitted to Accountant": ("accountant", "Rejected by Accountant"),
            "Submitted to Project Coordinator": (
                "project_coordinator",
                "Rejected by Project Coordinator",
            ),
            "Submitted to M&E": ("me", "Rejected by M&E"),
        }
        with transaction.atomic():
            report = TechnicalReport.objects.select_for_update().get(pk=report.pk)
            transition = transitions.get(report.status)
            if not transition:
                raise ValidationError({"status": "This report cannot be rejected at its current stage."})
            role_key, next_status = transition
            if not has_role(request.user, role_key):
                raise PermissionDenied("You are not authorized to reject this report at its current stage.")
            reason = reason.strip()
            audit = self._transition(
                report,
                "Rejected",
                next_status,
                reason,
                role_key=role_key,
            )
            message = (
                f"Report '{report.title}' was rejected by {request.user.account.full_name} "
                f"on {audit.created_at.isoformat()}. Reason: {reason}"
            )
            self._notify_users(
                audit,
                [],
                report,
                message,
                additional_users=[
                    report.created_by,
                    *(report.project.value_chain_leads.all() if report.project_id else []),
                ],
            )
        return Response(self.get_serializer(report).data)

    @action(detail=False, methods=["get"], url_path="indicator-status")
    def indicator_status(self, request):
        """Return saved indicators and cumulative values for one report context."""
        project_id = request.query_params.get("project")
        ward_id = request.query_params.get("ward")
        project_location_id = request.query_params.get("location")
        general_location = request.query_params.get("general") == "1"
        indicator_ids = request.query_params.getlist("indicatorId")
        context_values = {
            "financial_year": request.query_params.get("financialYear"),
            "quarter": request.query_params.get("quarter"),
            "main_activity_id": request.query_params.get("mainActivity"),
            "sub_activity_id": request.query_params.get("subActivity"),
            "category": request.query_params.get("category"),
            "value_chain": request.query_params.get("valueChain", ""),
        }
        if not project_id or not (ward_id or project_location_id or general_location):
            return Response({"detail": "project and reporting location are required."}, status=status.HTTP_400_BAD_REQUEST)
        if any(value is None or value == "" for key, value in context_values.items() if key != "value_chain"):
            return Response({"detail": "Financial year, quarter, activity, sub activity, and category are required."}, status=status.HTTP_400_BAD_REQUEST)
        if not has_role(request.user, "system_admin", "value_chain_lead"):
            raise PermissionDenied("Only an assigned Value Chain Lead can check indicator availability.")
        if has_role(request.user, "value_chain_lead") and not has_role(request.user, "system_admin"):
            if not Project.objects.filter(pk=project_id, value_chain_leads=request.user.account).exists():
                raise PermissionDenied("You can only check indicators for projects assigned to you.")

        report_context = TechnicalReport.objects.filter(
            project_id=project_id,
            original_report__isnull=True,
            **context_values,
        )
        exclude_report_id = request.query_params.get("excludeReportId")
        if exclude_report_id:
            report_to_exclude = report_context.filter(pk=exclude_report_id).first()
            if not report_to_exclude or not self._can_manage_report(request.user, report_to_exclude):
                raise PermissionDenied("You cannot exclude this report from indicator availability.")
            report_context = report_context.exclude(pk=report_to_exclude.pk)

        rows = IndicatorReport.objects.filter(technical_report__in=report_context)
        if project_location_id:
            location = ProjectLocation.objects.filter(pk=project_location_id, project_id=project_id).select_related("ward").first()
            if not location:
                return Response({"detail": "The reporting location is not configured for this Project Title."}, status=status.HTTP_400_BAD_REQUEST)
            rows = rows.filter(
                Q(project_location_id=project_location_id)
                | Q(project_location__isnull=True, ward_id=location.ward_id)
            ) if location.ward_id else rows.filter(project_location_id=project_location_id)
            if location.ward_id:
                rows = rows.filter(ward_id=location.ward_id)
        elif ward_id:
            rows = rows.filter(project_location__isnull=True, ward_id=ward_id)
        else:
            rows = rows.filter(project_location__isnull=True, ward__isnull=True)
        rows = rows.exclude(
            Q(technical_report__status="Draft", reported_value__isnull=True)
        )
        if indicator_ids:
            rows = rows.filter(indicator_id__in=indicator_ids)
        cumulative = {}
        for row in rows:
            cumulative[row.indicator_id] = cumulative.get(row.indicator_id, 0) + float(row.reported_value)
        return Response({
            "cumulative": cumulative,
            "reportedIndicatorIds": list(rows.values_list("indicator_id", flat=True).distinct()),
        })

    @action(detail=True, methods=["post"], url_path=r"indicator-reports/(?P<indicator_report_id>[^/.]+)/evidence", parser_classes=[MultiPartParser, FormParser])
    def upload_indicator_evidence(self, request, pk=None, indicator_report_id=None):
        report = self.get_object()
        if not self._can_manage_report(request.user, report) or report.status not in (
            "Draft",
            "Rejected by Accountant",
            "Rejected by Project Coordinator",
            "Rejected by M&E",
        ):
            raise PermissionDenied("Evidence can only be changed by the owning Value Chain Lead while the report is editable.")
        try:
            indicator_report = report.indicator_reports.get(pk=indicator_report_id)
        except IndicatorReport.DoesNotExist:
            return Response({"detail": "Indicator report was not found for this technical report."}, status=status.HTTP_404_NOT_FOUND)
        if (
            report.status != "Draft"
            and indicator_report.reported_value == 0
        ):
            return Response(
                {"detail": "Evidence cannot be attached when Report Against Target is zero. Provide the required reason instead."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        files = request.FILES.getlist("files") or ([request.FILES["file"]] if request.FILES.get("file") else [])
        if not files:
            return Response({"detail": "Please upload evidence for this indicator."}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            evidence = [
                IndicatorReportEvidence.objects.create(
                    indicator_report=indicator_report,
                    file=file,
                    name=file.name,
                    uploaded_by=request.user.account,
                )
                for file in files
            ]
        return Response(IndicatorReportEvidenceSerializer(evidence, many=True, context=self.get_serializer_context()).data, status=status.HTTP_201_CREATED)

    @action(
        detail=True,
        methods=["get"],
        url_path=r"indicator-reports/(?P<indicator_report_id>[^/.]+)/evidence/(?P<evidence_id>[^/.]+)/download",
    )
    def download_indicator_evidence(
        self, request, pk=None, indicator_report_id=None, evidence_id=None
    ):
        report = self.get_object()
        evidence = IndicatorReportEvidence.objects.filter(
            pk=evidence_id,
            indicator_report_id=indicator_report_id,
            indicator_report__technical_report=report,
        ).first()
        if not evidence or not evidence.file or not evidence.file.storage.exists(
            evidence.file.name
        ):
            return Response(
                {"detail": "Evidence file was not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        content_type = mimetypes.guess_type(evidence.name)[0] or "application/octet-stream"
        return FileResponse(
            evidence.file.open("rb"),
            as_attachment=request.query_params.get("download") == "1",
            filename=evidence.name,
            content_type=content_type,
        )

    @action(detail=True, methods=["get"], url_path="pdf")
    def pdf(self, request, pk=None):
        report = self.get_object()
        from .technical_report_pdf import build_technical_report_pdf

        pdf_content = build_technical_report_pdf(report)
        response = HttpResponse(pdf_content, content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="technical-report-{report.pk}.pdf"'
        return response

    @action(detail=True, methods=["delete"], url_path=r"indicator-reports/(?P<indicator_report_id>[^/.]+)/evidence/(?P<evidence_id>[^/.]+)")
    def delete_indicator_evidence(self, request, pk=None, indicator_report_id=None, evidence_id=None):
        report = self.get_object()
        if not self._can_manage_report(request.user, report) or report.status not in (
            "Draft",
            "Rejected by Accountant",
            "Rejected by Project Coordinator",
            "Rejected by M&E",
        ):
            raise PermissionDenied("Evidence can only be changed by the owning Value Chain Lead while the report is editable.")
        try:
            evidence = IndicatorReportEvidence.objects.get(pk=evidence_id, indicator_report_id=indicator_report_id, indicator_report__technical_report=report)
        except IndicatorReportEvidence.DoesNotExist:
            return Response({"detail": "Evidence file was not found."}, status=status.HTTP_404_NOT_FOUND)
        evidence.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MainActivityViewSet(viewsets.ModelViewSet):
    queryset = MainActivity.objects.select_related("sub_component", "sub_component__component", "project_output").all()
    serializer_class = MainActivitySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["sub_component", "project_output"]
    search_fields = ["name"]
    ordering_fields = ["name", "created_at", "updated_at"]


class MainActivityIndicatorViewSet(viewsets.ModelViewSet):
    queryset = MainActivityIndicator.objects.select_related("main_activity").all()
    serializer_class = MainActivityIndicatorSerializer
    filterset_fields = ["main_activity", "category", "value_chain"]


class SubActivityViewSet(viewsets.ModelViewSet):
    queryset = SubActivity.objects.prefetch_related("value_chains").all()
    serializer_class = SubActivitySerializer


class SubSubActivityViewSet(BulkCreateMixin, viewsets.ModelViewSet):
    queryset = SubSubActivity.objects.select_related("sub_activity", "value_chain_reference").all()
    serializer_class = SubSubActivitySerializer
    filterset_fields = ["sub_activity", "value_chain", "value_chain_reference"]


class ActivityIndicatorViewSet(BulkCreateMixin, viewsets.ModelViewSet):
    queryset = ActivityIndicator.objects.select_related(
        "sub_component", "project_output", "main_activity"
    ).all()
    serializer_class = ActivityIndicatorSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["main_activity", "project_output", "sub_component"]
    search_fields = ["indicator", "target", "unit_of_measure", "main_activity__name", "project_output__name"]
    ordering_fields = ["indicator", "target", "unit_of_measure", "created_at"]
