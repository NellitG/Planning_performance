from time import sleep
from urllib.error import URLError
from urllib.request import Request, urlopen

from django.db import transaction
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action, api_view
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
    IndicatorReportEvidenceSerializer,
    CountySerializer,
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
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        document = serializer.save()

        files = request.FILES.getlist("files") or request.FILES.getlist("file")
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
        "main_activity", "sub_activity", "project", "ward__sub_county__county"
    ).prefetch_related(
        "indicator_reports__ward__sub_county__county", "indicator_reports__evidence_files"
    ).all()
    serializer_class = TechnicalReportSerializer
    permission_classes = [ReportPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["main_activity", "sub_activity", "status"]
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
            return qs
        if has_role(user, "value_chain_lead"):
            return qs.filter(created_by=user.account)
        allowed = {"accountant": "Submitted to Accountant", "project_coordinator": "Submitted to Project Coordinator", "me": "Submitted to M&E"}
        for role, report_status in allowed.items():
            if has_role(user, role):
                return qs.filter(status=report_status)
        return qs.none()

    def perform_create(self, serializer):
        if not has_role(self.request.user, "value_chain_lead", "system_admin"):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only a Value Chain Lead can create reports.")
        serializer.save(created_by=self.request.user.account)

    def perform_update(self, serializer):
        report = self.get_object()
        if not has_role(self.request.user, "system_admin") and (not has_role(self.request.user, "value_chain_lead") or report.created_by_id != self.request.user.pk or report.status not in ("Draft", "Rejected by Accountant", "Rejected by Project Coordinator", "Rejected by M&E")):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Report contents cannot be edited at this workflow stage.")
        serializer.save()

    def _notify_roles(self, roles, report, message):
        recipients = UserAccount.objects.filter(is_active=True, roles__key__in=roles).distinct()
        WorkflowNotification.objects.bulk_create([WorkflowNotification(recipient=user, report=report, message=message) for user in recipients])

    def _transition(self, report, action, next_status, reason=""):
        previous = report.status
        report.status = next_status
        report.save(update_fields=["status", "updated_at"])
        ReportWorkflowAudit.objects.create(report=report, action=action, user=self.request.user.account,
            user_role=self.request.user.account.role, previous_status=previous, new_status=next_status, rejection_reason=reason)
        if report.created_by_id:
            text = f"Report '{report.title}' was {action.lower()} by {self.request.user.account.full_name}."
            if reason: text += f" Reason: {reason}"
            WorkflowNotification.objects.get_or_create(recipient=report.created_by, report=report, message=text)
        return report

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        report = self.get_object()
        if not has_role(request.user, "value_chain_lead", "system_admin") or report.created_by_id != request.user.pk or report.status not in ("Draft", "Rejected by Accountant", "Rejected by Project Coordinator", "Rejected by M&E"):
            return Response({"detail": "This report cannot be submitted by the current user."}, status=403)
        self._transition(report, "Submitted", "Submitted to Accountant")
        self._notify_roles(["accountant"], report, f"Report '{report.title}' is awaiting Accountant review.")
        return Response(self.get_serializer(report).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        report = self.get_object()
        transitions = {"accountant": ("Submitted to Accountant", "Approved by Accountant", "Approved"),
                       "project_coordinator": ("Submitted to Project Coordinator", "Approved by Project Coordinator", "Approved"),
                       "me": ("Submitted to M&E", "Approved/Finalized", "Approved")}
        match = next((v for key, v in transitions.items() if has_role(request.user, key)), None)
        if not match or report.status != match[0]: return Response({"detail": "Invalid approval transition."}, status=400)
        with transaction.atomic():
            self._transition(report, match[2], match[1])
            if report.status == "Approved by Accountant":
                report.status = "Submitted to Project Coordinator"; report.save(update_fields=["status"]); self._notify_roles(["project_coordinator"], report, f"Report '{report.title}' is awaiting Project Coordinator review.")
            elif report.status == "Approved by Project Coordinator":
                report.status = "Submitted to M&E"; report.save(update_fields=["status"]); self._notify_roles(["me"], report, f"Report '{report.title}' is awaiting M&E review.")
            elif report.status == "Approved/Finalized" and not hasattr(report, "value_chain_lead_copy"):
                copy = TechnicalReport.objects.get(pk=report.pk); copy.pk = None; copy.id = None; copy.original_report = report; copy.status = "Approved/Finalized"; copy.save()
                for row in report.indicator_reports.all():
                    old = row; old.pk = None; old.id = None; old.technical_report = copy; old.save()
        return Response(self.get_serializer(report).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        report, reason = self.get_object(), request.data.get("reason", "").strip()
        if not reason: return Response({"reason": "A rejection reason is required."}, status=400)
        transitions = {"accountant": ("Submitted to Accountant", "Rejected by Accountant"), "project_coordinator": ("Submitted to Project Coordinator", "Rejected by Project Coordinator"), "me": ("Submitted to M&E", "Rejected by M&E")}
        match = next((v for key, v in transitions.items() if has_role(request.user, key)), None)
        if not match or report.status != match[0]: return Response({"detail": "Invalid rejection transition."}, status=400)
        self._transition(report, "Rejected", match[1], reason)
        return Response(self.get_serializer(report).data)

    @action(detail=False, methods=["get"], url_path="indicator-status")
    def indicator_status(self, request):
        """Return cumulative values, scoped to a project and ward, for form locking."""
        project_id = request.query_params.get("project")
        ward_id = request.query_params.get("ward")
        indicator_ids = request.query_params.getlist("indicatorId")
        if not project_id or not ward_id:
            return Response({"detail": "project and ward are required."}, status=status.HTTP_400_BAD_REQUEST)
        # Ward is stored on each indicator row.  The report.ward field is a
        # legacy representative only and must not mix results between wards.
        rows = IndicatorReport.objects.filter(
            technical_report__project_id=project_id,
            ward_id=ward_id,
        )
        if indicator_ids:
            rows = rows.filter(indicator_id__in=indicator_ids)
        cumulative = {}
        for row in rows:
            cumulative[row.indicator_id] = cumulative.get(row.indicator_id, 0) + float(row.reported_value)
        return Response({"cumulative": cumulative})

    @action(detail=True, methods=["post"], url_path=r"indicator-reports/(?P<indicator_report_id>[^/.]+)/evidence", parser_classes=[MultiPartParser, FormParser])
    def upload_indicator_evidence(self, request, pk=None, indicator_report_id=None):
        report = self.get_object()
        try:
            indicator_report = report.indicator_reports.get(pk=indicator_report_id)
        except IndicatorReport.DoesNotExist:
            return Response({"detail": "Indicator report was not found for this technical report."}, status=status.HTTP_404_NOT_FOUND)
        if indicator_report.reported_value == 0:
            return Response(
                {"detail": "Evidence cannot be attached when Report Against Target is zero. Provide the required reason instead."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        files = request.FILES.getlist("files") or ([request.FILES["file"]] if request.FILES.get("file") else [])
        if not files:
            return Response({"detail": "Please upload evidence for this indicator."}, status=status.HTTP_400_BAD_REQUEST)
        evidence = [IndicatorReportEvidence.objects.create(indicator_report=indicator_report, file=file, name=file.name) for file in files]
        return Response(IndicatorReportEvidenceSerializer(evidence, many=True, context=self.get_serializer_context()).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"], url_path=r"indicator-reports/(?P<indicator_report_id>[^/.]+)/evidence/(?P<evidence_id>[^/.]+)")
    def delete_indicator_evidence(self, request, pk=None, indicator_report_id=None, evidence_id=None):
        report = self.get_object()
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
