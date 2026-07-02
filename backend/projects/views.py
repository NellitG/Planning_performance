from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from .models import (
    ExpectedOutput,
    IndicatorTracking,
    KeyActivity,
    KeyResultArea,
    MainActivity,
    OutputIndicator,
    Project,
    ProjectDocument,
    ProjectMapping,
    Strategy,
    StrategicObjective,
    SubActivity,
    SubSubActivity,
)
from .serializers import (
    ExpectedOutputSerializer,
    IndicatorTrackingSerializer,
    KeyActivitySerializer,
    KeyResultAreaSerializer,
    MainActivitySerializer,
    OutputIndicatorSerializer,
    ProjectDocumentSerializer,
    ProjectMappingSerializer,
    ProjectSerializer,
    StrategicObjectiveSerializer,
    StrategySerializer,
    SubActivitySerializer,
    SubSubActivitySerializer,
)


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
    queryset = ExpectedOutput.objects.all()
    serializer_class = ExpectedOutputSerializer
    filterset_fields = ["strategy", "key_activity"]


class OutputIndicatorViewSet(BulkCreateMixin, viewsets.ModelViewSet):
    queryset = OutputIndicator.objects.all()
    serializer_class = OutputIndicatorSerializer
    filterset_fields = ["expected_output", "strategy", "key_activity"]

    @action(detail=False, methods=["get"], url_path="by-expected-output/(?P<eo_id>[^/.]+)")
    def by_expected_output(self, request, eo_id=None):
        qs = self.queryset.filter(expected_output_id=eo_id)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class ProjectDocumentViewSet(viewsets.ModelViewSet):
    queryset = ProjectDocument.objects.all()
    serializer_class = ProjectDocumentSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ["project"]


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


class MainActivityViewSet(viewsets.ModelViewSet):
    queryset = MainActivity.objects.all()
    serializer_class = MainActivitySerializer


class SubActivityViewSet(viewsets.ModelViewSet):
    queryset = SubActivity.objects.all()
    serializer_class = SubActivitySerializer


class SubSubActivityViewSet(BulkCreateMixin, viewsets.ModelViewSet):
    queryset = SubSubActivity.objects.select_related("sub_activity").all()
    serializer_class = SubSubActivitySerializer
    filterset_fields = ["sub_activity", "value_chain"]
