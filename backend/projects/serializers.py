from rest_framework import serializers

from .models import (
    Project,
    KeyResultArea,
    StrategicObjective,
    Strategy,
    KeyActivity,
    ExpectedOutput,
    OutputIndicator,
    ProjectDocument,
    ProjectMapping,
    IndicatorTracking,
    MainActivity,
    SubActivity,
)


class ProjectSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="project_name")
    coordinator = serializers.CharField(
        source="project_coordinator", required=False, allow_blank=True, default=""
    )
    projectType = serializers.CharField(
        source="project_type", required=False, allow_blank=True, default=""
    )
    scale = serializers.CharField(required=False, allow_blank=True, default="")
    startDate = serializers.DateField(
        source="start_date", required=False, allow_null=True
    )
    endDate = serializers.DateField(source="end_date", required=False, allow_null=True)

    implementationUnits = serializers.JSONField(
        source="implementation_units", required=False, default=dict
    )
    valueChains = serializers.JSONField(
        source="value_chains", required=False, default=list
    )

    completionRate = serializers.FloatField(
        source="completion_rate", required=False, allow_null=True
    )
    expectedBudget = serializers.DecimalField(
        source="expected_budget",
        max_digits=20,
        decimal_places=2,
        required=False,
        allow_null=True,
    )
    disbursedAmount = serializers.DecimalField(
        source="disbursed_amount",
        max_digits=20,
        decimal_places=2,
        required=False,
        allow_null=True,
    )
    utilizedAmount = serializers.DecimalField(
        source="utilized_amount",
        max_digits=20,
        decimal_places=2,
        required=False,
        allow_null=True,
    )

    background = serializers.CharField(required=False, allow_blank=True, default="")
    projectObjectives = serializers.CharField(
        source="project_objectives", required=False, allow_blank=True, default=""
    )
    expectedOutcomes = serializers.CharField(
        source="expected_outcomes", required=False, allow_blank=True, default=""
    )
    sustainability = serializers.CharField(
        required=False, allow_blank=True, default=""
    )
    collaborators = serializers.CharField(
        required=False, allow_blank=True, default=""
    )

    totalBeneficiaries = serializers.IntegerField(
        source="total_beneficiaries", required=False, allow_null=True
    )
    women = serializers.IntegerField(required=False, allow_null=True)
    youth = serializers.IntegerField(required=False, allow_null=True)
    vmgs = serializers.IntegerField(required=False, allow_null=True)
    pwds = serializers.IntegerField(required=False, allow_null=True)

    locations = serializers.JSONField(required=False, default=list)
    fundingSources = serializers.JSONField(
        source="funding_sources", required=False, default=list
    )

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "logo",
            "description",
            "status",
            "coordinator",
            "projectType",
            "scale",
            "startDate",
            "endDate",
            "implementationUnits",
            "valueChains",
            "completionRate",
            "expectedBudget",
            "disbursedAmount",
            "utilizedAmount",
            "background",
            "projectObjectives",
            "expectedOutcomes",
            "sustainability",
            "collaborators",
            "totalBeneficiaries",
            "women",
            "youth",
            "vmgs",
            "pwds",
            "locations",
            "fundingSources",
        ]


class KeyResultAreaSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = KeyResultArea
        fields = ["id", "title", "createdAt"]


class StrategicObjectiveSerializer(serializers.ModelSerializer):
    componentId = serializers.PrimaryKeyRelatedField(
        source="key_result_area", queryset=KeyResultArea.objects.all()
    )
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = StrategicObjective
        fields = ["id", "componentId", "text", "createdAt"]


class StrategySerializer(serializers.ModelSerializer):
    objectiveId = serializers.PrimaryKeyRelatedField(
        source="strategic_objective", queryset=StrategicObjective.objects.all()
    )
    componentId = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Strategy
        fields = ["id", "componentId", "objectiveId", "text", "createdAt"]

    def get_componentId(self, obj):
        return obj.strategic_objective.key_result_area_id


class KeyActivitySerializer(serializers.ModelSerializer):
    strategyId = serializers.PrimaryKeyRelatedField(
        source="strategy", queryset=Strategy.objects.all()
    )
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = KeyActivity
        fields = ["id", "strategyId", "text", "createdAt"]


class ExpectedOutputSerializer(serializers.ModelSerializer):
    strategyId = serializers.PrimaryKeyRelatedField(
        source="strategy", queryset=Strategy.objects.all()
    )
    keyActivityId = serializers.PrimaryKeyRelatedField(
        source="key_activity",
        queryset=KeyActivity.objects.all(),
        required=False,
        allow_null=True,
    )
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = ExpectedOutput
        fields = ["id", "strategyId", "keyActivityId", "text", "createdAt"]


class OutputIndicatorSerializer(serializers.ModelSerializer):
    expectedOutputId = serializers.PrimaryKeyRelatedField(
        source="expected_output", queryset=ExpectedOutput.objects.all()
    )
    strategyId = serializers.PrimaryKeyRelatedField(
        source="strategy",
        queryset=Strategy.objects.all(),
        required=False,
        allow_null=True,
    )
    keyActivityId = serializers.PrimaryKeyRelatedField(
        source="key_activity",
        queryset=KeyActivity.objects.all(),
        required=False,
        allow_null=True,
    )
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = OutputIndicator
        fields = [
            "id",
            "strategyId",
            "keyActivityId",
            "expectedOutputId",
            "text",
            "createdAt",
        ]


class ProjectDocumentSerializer(serializers.ModelSerializer):
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())
    type = serializers.CharField(
        source="file_type", required=False, allow_blank=True, default=""
    )
    documentType = serializers.CharField(
        source="document_type", required=False, allow_blank=True, default=""
    )
    description = serializers.CharField(required=False, allow_blank=True, default="")
    fileUrl = serializers.SerializerMethodField()
    uploadedAt = serializers.DateTimeField(source="created_at", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = ProjectDocument
        fields = [
            "id",
            "project",
            "name",
            "file",
            "fileUrl",
            "size",
            "type",
            "documentType",
            "description",
            "uploadedAt",
            "createdAt",
        ]
        extra_kwargs = {
            "file": {"required": False, "allow_null": True, "write_only": True},
        }

    def get_fileUrl(self, obj):
        if not obj.file:
            return None
        request = self.context.get("request")
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url


class ProjectMappingSerializer(serializers.ModelSerializer):
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())
    kraIds = serializers.JSONField(source="kra_ids", required=False)
    objectiveIds = serializers.JSONField(source="objective_ids", required=False)
    strategyIds = serializers.JSONField(source="strategy_ids", required=False)
    keyActivityIds = serializers.JSONField(source="key_activity_ids", required=False)
    expectedOutputIds = serializers.JSONField(
        source="expected_output_ids", required=False
    )
    outputIndicatorIds = serializers.JSONField(
        source="output_indicator_ids", required=False
    )
    savedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = ProjectMapping
        fields = [
            "id",
            "project",
            "kraIds",
            "objectiveIds",
            "strategyIds",
            "keyActivityIds",
            "expectedOutputIds",
            "outputIndicatorIds",
            "savedAt",
        ]


class IndicatorTrackingSerializer(serializers.ModelSerializer):
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())
    outputIndicatorId = serializers.PrimaryKeyRelatedField(
        source="output_indicator", queryset=OutputIndicator.objects.all()
    )
    evidenceName = serializers.CharField(
        source="evidence_name", required=False, allow_blank=True
    )
    evidenceUrl = serializers.SerializerMethodField()
    target = serializers.FloatField(required=False, allow_null=True)
    achievement = serializers.CharField(required=False, allow_blank=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = IndicatorTracking
        fields = [
            "id",
            "project",
            "outputIndicatorId",
            "year",
            "target",
            "achievement",
            "evidence",
            "evidenceName",
            "evidenceUrl",
            "createdAt",
            "updatedAt",
        ]
        extra_kwargs = {
            "evidence": {"required": False, "allow_null": True, "write_only": True},
        }

    def get_evidenceUrl(self, obj):
        if not obj.evidence:
            return None
        request = self.context.get("request")
        url = obj.evidence.url
        return request.build_absolute_uri(url) if request else url


class MainActivitySerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = MainActivity
        fields = ["id", "name", "createdAt"]


class SubActivitySerializer(serializers.ModelSerializer):
    mainActivityId = serializers.PrimaryKeyRelatedField(
        source="main_activity", queryset=MainActivity.objects.all()
    )
    mainActivityName = serializers.CharField(source="main_activity.name", read_only=True)
    valueChain = serializers.CharField(
        source="value_chain", required=False, allow_blank=True, default=""
    )
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = SubActivity
        fields = [
            "id",
            "mainActivityId",
            "mainActivityName",
            "name",
            "category",
            "valueChain",
            "createdAt",
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        category = attrs.get("category", getattr(self.instance, "category", ""))
        value_chain = attrs.get("value_chain", getattr(self.instance, "value_chain", ""))

        if category != "Value Chain":
            attrs["value_chain"] = ""
        elif not value_chain:
            raise serializers.ValidationError(
                {"valueChain": "Please select a value chain."}
            )

        return attrs
