from rest_framework import serializers
from decimal import Decimal, InvalidOperation
from hashlib import sha256
from django.db import models, transaction

from user_management.models import ValueChain

from .models import (
    Project,
    KeyResultArea,
    StrategicObjective,
    Strategy,
    KeyActivity,
    ExpectedOutput,
    OutputIndicator,
    Outcome,
    OutcomeIndicator,
    ProjectDocument,
    ProjectDocumentFile,
    ProjectMapping,
    IndicatorTracking,
    MainActivity,
    MainActivityIndicator,
    SubActivity,
    SubSubActivity,
    ActivityIndicator,
    ProjectComponent,
    ProjectSubComponent,
    ProjectOutput,
    TechnicalReport,
    IndicatorReport,
    IndicatorReportEvidence,
    County,
    SubCounty,
    Ward,
    ProjectLocation,
)


class ProjectSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="project_name")
    coordinator = serializers.CharField(
        source="project_coordinator", required=False, allow_blank=True, default=""
    )
    projectType = serializers.CharField(
        source="project_type", required=False, allow_blank=True, default=""
    )
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

    budget = serializers.DecimalField(
        source="expected_budget",
        max_digits=20,
        decimal_places=2,
        required=False,
        allow_null=True,
    )

    background = serializers.CharField(required=False, allow_blank=True, default="")
    projectObjectives = serializers.CharField(
        source="project_objectives", required=False, allow_blank=True, default=""
    )
    expectedOutputs = serializers.CharField(
        source="expected_outcomes", required=False, allow_blank=True, default=""
    )
    collaborators = serializers.CharField(
        required=False, allow_blank=True, default=""
    )

    totalBeneficiaries = serializers.IntegerField(
        source="total_beneficiaries", required=False, allow_null=True
    )
    women = serializers.IntegerField(required=False, allow_null=True)
    men = serializers.IntegerField(required=False, allow_null=True)
    youth = serializers.IntegerField(required=False, allow_null=True)
    pwds = serializers.IntegerField(required=False, allow_null=True)

    locations = serializers.JSONField(required=False, default=list)
    fundingSources = serializers.JSONField(
        source="funding_sources", required=False, default=list
    )

    isDraft = serializers.BooleanField(source="is_draft", required=False, default=True)
    currentStep = serializers.IntegerField(source="current_step", required=False, default=1)

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
            "startDate",
            "endDate",
            "implementationUnits",
            "valueChains",
            "budget",
            "background",
            "projectObjectives",
            "expectedOutputs",
            "collaborators",
            "totalBeneficiaries",
            "women",
            "men",
            "youth",
            "pwds",
            "locations",
            "fundingSources",
            "isDraft",
            "currentStep",
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        saved_locations = instance.project_locations.select_related("county", "sub_county", "ward")
        if saved_locations.exists():
            representation["locations"] = [
                {
                    "county": location.county.name,
                    "countyId": str(location.county_id),
                    "svgId": location.county.svg_id,
                    "subCounty": location.sub_county.name if location.sub_county else "",
                    "subCountyId": str(location.sub_county_id) if location.sub_county_id else "",
                    "ward": location.ward.name if location.ward else "",
                    "wardId": str(location.ward_id) if location.ward_id else "",
                }
                for location in saved_locations
            ]
        return representation

    def _sync_project_locations(self, project, locations):
        ProjectLocation.objects.filter(project=project).delete()
        for location in locations or []:
            county_id = location.get("countyId") or None
            if not county_id:
                continue
            county = County.objects.get(pk=county_id)
            sub_county_id = location.get("subCountyId") or None
            ward_id = location.get("wardId") or None
            sub_county = SubCounty.objects.filter(pk=sub_county_id, county=county).first() if sub_county_id else None
            ward = Ward.objects.filter(pk=ward_id, sub_county=sub_county).first() if sub_county and ward_id else None
            ProjectLocation.objects.create(project=project, county=county, sub_county=sub_county, ward=ward)

    def create(self, validated_data):
        locations = validated_data.get("locations", [])
        with transaction.atomic():
            project = super().create(validated_data)
            self._sync_project_locations(project, locations)
        return project

    def update(self, instance, validated_data):
        locations = validated_data.get("locations", instance.locations)
        with transaction.atomic():
            project = super().update(instance, validated_data)
            self._sync_project_locations(project, locations)
        return project


class WardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ward
        fields = ["id", "name"]


class SubCountySerializer(serializers.ModelSerializer):
    wards = WardSerializer(many=True, read_only=True)

    class Meta:
        model = SubCounty
        fields = ["id", "name", "wards"]


class CountySerializer(serializers.ModelSerializer):
    subCounties = SubCountySerializer(source="sub_counties", many=True, read_only=True)

    class Meta:
        model = County
        fields = ["id", "name", "svgId", "subCounties"]

    svgId = serializers.CharField(source="svg_id", allow_blank=True)


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

    def validate(self, attrs):
        if self.instance and "key_result_area" in attrs and attrs["key_result_area"] != self.instance.key_result_area:
            raise serializers.ValidationError({"componentId": "The Key Result Area cannot be changed after creation."})
        return attrs


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

    def validate(self, attrs):
        if self.instance and "strategic_objective" in attrs and attrs["strategic_objective"] != self.instance.strategic_objective:
            raise serializers.ValidationError({"objectiveId": "The Strategic Objective cannot be changed after creation."})
        return attrs


class KeyActivitySerializer(serializers.ModelSerializer):
    strategyId = serializers.PrimaryKeyRelatedField(
        source="strategy", queryset=Strategy.objects.all()
    )
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = KeyActivity
        fields = ["id", "strategyId", "text", "createdAt"]

    def validate(self, attrs):
        if self.instance and "strategy" in attrs and attrs["strategy"] != self.instance.strategy:
            raise serializers.ValidationError({"strategyId": "The Strategy cannot be changed after creation."})
        return attrs


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

    def validate(self, attrs):
        errors = {}
        if self.instance and "strategy" in attrs and attrs["strategy"] != self.instance.strategy:
            errors["strategyId"] = "The Strategy cannot be changed after creation."
        if self.instance and "key_activity" in attrs and attrs["key_activity"] != self.instance.key_activity:
            errors["keyActivityId"] = "The Key Activity cannot be changed after creation."
        if errors:
            raise serializers.ValidationError(errors)
        return attrs


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
    cumulativeTarget = serializers.DecimalField(
        source="cumulative_target", max_digits=12, decimal_places=2, required=False, default=0
    )
    year1Target = serializers.DecimalField(
        source="year_1_target", max_digits=12, decimal_places=2, required=False, default=0
    )
    year2Target = serializers.DecimalField(
        source="year_2_target", max_digits=12, decimal_places=2, required=False, default=0
    )
    year3Target = serializers.DecimalField(
        source="year_3_target", max_digits=12, decimal_places=2, required=False, default=0
    )
    year4Target = serializers.DecimalField(
        source="year_4_target", max_digits=12, decimal_places=2, required=False, default=0
    )
    year5Target = serializers.DecimalField(
        source="year_5_target", max_digits=12, decimal_places=2, required=False, default=0
    )
    totalBudgetMillions = serializers.DecimalField(
        source="total_budget_millions", max_digits=12, decimal_places=2, required=False, default=0
    )
    budgetYear1 = serializers.DecimalField(
        source="budget_year_1", max_digits=12, decimal_places=2, required=False, default=0
    )
    budgetYear2 = serializers.DecimalField(
        source="budget_year_2", max_digits=12, decimal_places=2, required=False, default=0
    )
    budgetYear3 = serializers.DecimalField(
        source="budget_year_3", max_digits=12, decimal_places=2, required=False, default=0
    )
    budgetYear4 = serializers.DecimalField(
        source="budget_year_4", max_digits=12, decimal_places=2, required=False, default=0
    )
    budgetYear5 = serializers.DecimalField(
        source="budget_year_5", max_digits=12, decimal_places=2, required=False, default=0
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
            "cumulativeTarget",
            "year1Target",
            "year2Target",
            "year3Target",
            "year4Target",
            "year5Target",
            "totalBudgetMillions",
            "budgetYear1",
            "budgetYear2",
            "budgetYear3",
            "budgetYear4",
            "budgetYear5",
            "createdAt",
        ]


class OutcomeIndicatorSerializer(serializers.ModelSerializer):
    outcomeId = serializers.PrimaryKeyRelatedField(
        source="outcome", queryset=Outcome.objects.all(), required=False, allow_null=True
    )
    baselineValue = serializers.DecimalField(
        source="baseline_value", max_digits=12, decimal_places=2, required=False, default=0
    )
    midtermTarget = serializers.DecimalField(
        source="midterm_target", max_digits=12, decimal_places=2, required=False, default=0
    )
    endtermTarget = serializers.DecimalField(
        source="endterm_target", max_digits=12, decimal_places=2, required=False, default=0
    )
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = OutcomeIndicator
        fields = [
            "id",
            "outcomeId",
            "text",
            "baselineValue",
            "midtermTarget",
            "endtermTarget",
            "createdAt",
        ]


class OutcomeSerializer(serializers.ModelSerializer):
    kraId = serializers.PrimaryKeyRelatedField(
        source="key_result_area", queryset=KeyResultArea.objects.all()
    )
    indicators = OutcomeIndicatorSerializer(many=True, required=False)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Outcome
        fields = ["id", "kraId", "text", "indicators", "createdAt"]

    def create(self, validated_data):
        indicators_data = validated_data.pop("indicators", [])
        outcome = Outcome.objects.create(**validated_data)
        for indicator_data in indicators_data:
            OutcomeIndicator.objects.create(outcome=outcome, **indicator_data)
        return outcome

    def update(self, instance, validated_data):
        indicators_data = validated_data.pop("indicators", None)
        instance.key_result_area = validated_data.get("key_result_area", instance.key_result_area)
        instance.text = validated_data.get("text", instance.text)
        instance.save()
        if indicators_data is not None:
            instance.indicators.all().delete()
            for indicator_data in indicators_data:
                OutcomeIndicator.objects.create(outcome=instance, **indicator_data)
        return instance


class ProjectDocumentFileSerializer(serializers.ModelSerializer):
    type = serializers.CharField(
        source="file_type", required=False, allow_blank=True, default=""
    )
    fileUrl = serializers.SerializerMethodField()
    uploadedAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = ProjectDocumentFile
        fields = ["id", "document", "name", "fileUrl", "size", "type", "uploadedAt"]
        extra_kwargs = {
            "document": {"required": False},
            "file": {"required": False, "write_only": True},
        }

    def get_fileUrl(self, obj):
        if not obj.file:
            return None
        request = self.context.get("request")
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url


class ProjectDocumentSerializer(serializers.ModelSerializer):
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())
    documentType = serializers.CharField(
        source="document_type", required=False, allow_blank=True, default=""
    )
    description = serializers.CharField(required=False, allow_blank=True, default="")
    files = ProjectDocumentFileSerializer(many=True, required=False, read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = ProjectDocument
        fields = [
            "id",
            "project",
            "name",
            "documentType",
            "description",
            "files",
            "createdAt",
        ]


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


class ProjectComponentSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    subComponents = serializers.SerializerMethodField()

    class Meta:
        model = ProjectComponent
        fields = ["id", "name", "createdAt", "updatedAt", "subComponents"]

    def get_subComponents(self, obj):
        return obj.sub_components.count()

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Component is required.")
        qs = ProjectComponent.objects.filter(name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A component with this name already exists.")
        return value


class ProjectSubComponentSerializer(serializers.ModelSerializer):
    componentId = serializers.PrimaryKeyRelatedField(
        source="component", queryset=ProjectComponent.objects.all()
    )
    componentName = serializers.CharField(source="component.name", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = ProjectSubComponent
        fields = ["id", "componentId", "componentName", "name", "createdAt", "updatedAt"]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        name = attrs.get("name", getattr(self.instance, "name", "")).strip()
        component = attrs.get("component", getattr(self.instance, "component", None))
        if not component:
            raise serializers.ValidationError({"componentId": "Please select a Component."})
        if not name:
            raise serializers.ValidationError({"name": "Sub Component is required."})
        qs = ProjectSubComponent.objects.filter(component=component, name__iexact=name)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                {"name": "A Sub Component with this name already exists under this Component."}
            )
        attrs["name"] = name
        return attrs


class ProjectOutputSerializer(serializers.ModelSerializer):
    subComponentId = serializers.PrimaryKeyRelatedField(
        source="sub_component", queryset=ProjectSubComponent.objects.all()
    )
    subComponentName = serializers.CharField(source="sub_component.name", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = ProjectOutput
        fields = [
            "id", "subComponentId", "subComponentName", "name", "createdAt", "updatedAt"
        ]

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Project Output is required.")
        return value


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
    remarks = serializers.CharField(required=False, allow_blank=True)
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
            "remarks",
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


class IndicatorReportEvidenceSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = IndicatorReportEvidence
        fields = ["id", "name", "url", "created_at"]

    def get_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.file.url) if request else obj.file.url


class IndicatorReportSerializer(serializers.ModelSerializer):
    indicatorId = serializers.CharField(source="indicator_id")
    indicator = serializers.CharField(source="indicator_name")
    target = serializers.DecimalField(max_digits=20, decimal_places=2, required=False)
    reportedProgress = serializers.DecimalField(source="reported_value", max_digits=20, decimal_places=2)
    wardId = serializers.PrimaryKeyRelatedField(source="ward", queryset=Ward.objects.all(), required=False, allow_null=True)
    wardName = serializers.CharField(source="ward.name", read_only=True)
    reasonForZero = serializers.CharField(source="reason_for_zero", required=False, allow_blank=True)
    evidenceFiles = IndicatorReportEvidenceSerializer(source="evidence_files", many=True, read_only=True)
    progress = serializers.SerializerMethodField()
    cumulativeReported = serializers.SerializerMethodField()
    fullyAchieved = serializers.SerializerMethodField()

    class Meta:
        model = IndicatorReport
        fields = [
            "id", "wardId", "wardName", "indicatorId", "indicator", "target", "reportedProgress", "progress",
            "cumulativeReported", "fullyAchieved", "achievement", "remarks", "reasonForZero",
            "evidenceFiles",
        ]
        read_only_fields = ["id"]

    def get_progress(self, obj):
        if obj.target <= 0:
            return 0
        return float(min(Decimal("100"), (obj.reported_value / obj.target) * 100).quantize(Decimal("0.01")))

    def get_cumulativeReported(self, obj):
        total = sum((row.reported_value for row in IndicatorReport.objects.filter(
            technical_report__project=obj.technical_report.project,
            ward=obj.ward or obj.technical_report.ward,
            indicator_id=obj.indicator_id,
        )), Decimal("0"))
        return str(total)

    def get_fullyAchieved(self, obj):
        if obj.target <= 0:
            return False
        return Decimal(self.get_cumulativeReported(obj)) >= obj.target

    def validate(self, attrs):
        attrs = super().validate(attrs)
        target = attrs.get("target", getattr(self.instance, "target", None))
        reported = attrs.get("reported_value", getattr(self.instance, "reported_value", None))
        reason = attrs.get("reason_for_zero", getattr(self.instance, "reason_for_zero", "")).strip()
        if target is not None and target < 0:
            raise serializers.ValidationError({"target": "Indicator target must be a non-negative number."})
        if reported is None or reported < 0:
            raise serializers.ValidationError({"reportedProgress": "Report Against Target must be a non-negative number."})
        if reported == 0 and not reason:
            raise serializers.ValidationError({"reasonForZero": "Please provide a reason when Report Against Target is 0."})
        if reported == 0:
            # Zero reports use the required explanation only.  Do not retain
            # narrative fields that are deliberately hidden in the UI.
            attrs["achievement"] = ""
            attrs["remarks"] = ""
        if target == 0 and reported > 0:
            raise serializers.ValidationError({"reportedProgress": "A positive report cannot be recorded against a target of 0."})
        return attrs


class TechnicalReportSerializer(serializers.ModelSerializer):
    QUARTER_MONTHS = {
        "Quarter 1": (7, 9),
        "Quarter 2": (10, 12),
        "Quarter 3": (1, 3),
        "Quarter 4": (4, 6),
    }
    projectId = serializers.PrimaryKeyRelatedField(
        source="project",
        queryset=Project.objects.all(),
        required=False,
        allow_null=True,
    )
    projectName = serializers.CharField(source="project.project_name", read_only=True)
    quarter = serializers.CharField(required=False, allow_blank=True, default="")
    financialYear = serializers.CharField(
        source="financial_year", required=False, allow_blank=True, default=""
    )
    mainActivityId = serializers.PrimaryKeyRelatedField(
        source="main_activity",
        queryset=MainActivity.objects.all(),
        required=False,
        allow_null=True,
    )
    subActivityId = serializers.PrimaryKeyRelatedField(
        source="sub_activity",
        queryset=SubActivity.objects.all(),
        required=False,
        allow_null=True,
    )
    wardId = serializers.PrimaryKeyRelatedField(
        source="ward", queryset=Ward.objects.all(), required=False, allow_null=True
    )
    wardName = serializers.CharField(source="ward.name", read_only=True)
    subCountyName = serializers.CharField(source="ward.sub_county.name", read_only=True)
    countyName = serializers.CharField(source="ward.sub_county.county.name", read_only=True)
    mainActivityName = serializers.CharField(source="main_activity.name", read_only=True)
    subActivityName = serializers.CharField(source="sub_activity.name", read_only=True)
    valueChain = serializers.CharField(source="value_chain", required=False, allow_blank=True, default="")
    subSubActivities = serializers.JSONField(source="sub_sub_activities", required=False, default=list)
    reportGroupId = serializers.UUIDField(source="report_group_id", required=False, allow_null=True)
    selectedLocations = serializers.JSONField(source="selected_locations", required=False, default=list)
    supportingDocuments = serializers.JSONField(source="supporting_documents", required=False, default=list)
    reportingPeriod = serializers.CharField(source="reporting_period", required=False, allow_blank=True, default="")
    disbursedAmount = serializers.DecimalField(
        source="disbursed_amount",
        max_digits=20,
        decimal_places=2,
        required=False,
        allow_null=True,
        default=0,
    )
    utilizedAmount = serializers.DecimalField(
        source="utilized_amount",
        max_digits=20,
        decimal_places=2,
        required=False,
        allow_null=True,
        default=0,
    )
    percentageUtilization = serializers.DecimalField(
        source="percentage_utilization",
        max_digits=5,
        decimal_places=2,
        required=False,
        allow_null=True,
        default=0,
    )
    amountRemaining = serializers.SerializerMethodField()
    supportingInformation = serializers.CharField(
        source="supporting_information", required=False, allow_blank=True, default=""
    )
    indicatorReports = IndicatorReportSerializer(source="indicator_reports", many=True, required=False)
    relatedWardReports = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = TechnicalReport
        fields = [
            "id",
            "title",
            "projectId",
            "projectName",
            "mainActivityId",
            "category",
            "valueChain",
            "subActivityId",
            "wardId",
            "wardName",
            "subCountyName",
            "countyName",
            "mainActivityName",
            "subActivityName",
            "subSubActivities",
            "reportGroupId",
            "selectedLocations",
            "indicators",
            "indicatorReports",
            "relatedWardReports",
            "quarter",
            "financialYear",
            "reportingPeriod",
            "disbursedAmount",
            "utilizedAmount",
            "percentageUtilization",
            "amountRemaining",
            "achievement",
            "remarks",
            "supportingInformation",
            "supportingDocuments",
            "createdAt",
            "updatedAt",
        ]

    def get_amountRemaining(self, obj):
        """Balance for this reporting path within its financial year."""
        if not obj.project_id or not obj.financial_year:
            return str(max(Decimal("0"), obj.disbursed_amount - obj.utilized_amount))
        prior_utilized = TechnicalReport.objects.filter(
            project_id=obj.project_id,
            financial_year=obj.financial_year,
            main_activity_id=obj.main_activity_id,
            sub_activity_id=obj.sub_activity_id,
            category=obj.category,
            value_chain=obj.value_chain,
        ).exclude(pk=obj.pk).exclude(quarter=obj.quarter).aggregate(
            total=models.Sum("utilized_amount")
        )["total"] or Decimal("0")
        return str(max(Decimal("0"), obj.disbursed_amount - prior_utilized - obj.utilized_amount))

    def get_relatedWardReports(self, obj):
        # A current report contains all wards in its indicator rows.  Group
        # those rows for the ward-oriented details UI.
        grouped = {}
        selected_ward_ids = {
            str(location.get("wardId")) for location in (obj.selected_locations or [])
            if location.get("wardId")
        }
        # Seed from the saved location snapshot so every selected ward has a
        # distinct section even before it has indicator rows.
        for location in obj.selected_locations or []:
            ward_id = location.get("wardId")
            if not ward_id:
                continue
            grouped[str(ward_id)] = {
                "id": f"{obj.pk}-{ward_id}", "wardId": str(ward_id),
                "wardName": location.get("wardName", ""),
                "subCountyName": location.get("subCountyName", ""),
                "countyName": location.get("countyName", ""), "rows": [],
            }
        for row in obj.indicator_reports.select_related("ward__sub_county__county").prefetch_related("evidence_files"):
            ward = row.ward or obj.ward
            if selected_ward_ids and ward and str(ward.pk) not in selected_ward_ids:
                continue
            key = str(ward.pk) if ward else "unassigned"
            if key not in grouped:
                grouped[key] = {
                    "id": f"{obj.pk}-{key}", "wardId": key if ward else None,
                    "wardName": ward.name if ward else "",
                    "subCountyName": ward.sub_county.name if ward else "",
                    "countyName": ward.sub_county.county.name if ward else "",
                    "rows": [],
                }
            grouped[key]["rows"].append(row)
        return [
            {
                "id": item["id"],
                "wardId": item["wardId"],
                "wardName": item["wardName"],
                "subCountyName": item["subCountyName"],
                "countyName": item["countyName"],
                "indicatorReports": IndicatorReportSerializer(item["rows"], many=True, context=self.context).data,
                "disbursedAmount": str(obj.disbursed_amount),
                "utilizedAmount": str(obj.utilized_amount),
            }
            for item in grouped.values()
        ]

    @staticmethod
    def _configured_indicator(main_activity, category, value_chain, indicator_id):
        """Return the configuration record used by the reporting UI.

        Main-activity indicators take precedence, matching the existing React
        selection logic. Activity indicators are the legacy fallback.
        """
        main_indicator = MainActivityIndicator.objects.filter(
            pk=indicator_id,
            main_activity=main_activity,
            category=category,
        )
        if category == "Value Chain":
            main_indicator = main_indicator.filter(value_chain=value_chain)
        configured = main_indicator.first()
        if configured:
            return configured
        return ActivityIndicator.objects.filter(
            pk=indicator_id, main_activity=main_activity
        ).first()

    def _apply_configured_targets(self, indicator_reports, main_activity, category, value_chain):
        for item in indicator_reports:
            configured = self._configured_indicator(
                main_activity, category, value_chain, item["indicator_id"]
            )
            if not configured:
                raise serializers.ValidationError({
                    "indicatorReports": f"The selected indicator is no longer available for this reporting path: {item['indicator_id']}."
                })
            try:
                target = Decimal(str(configured.target or "0").strip())
            except (InvalidOperation, ValueError):
                raise serializers.ValidationError({
                    "indicatorReports": f"The configured target for '{configured.indicator}' must be numeric before it can be reported against."
                })
            if target < 0:
                raise serializers.ValidationError({
                    "indicatorReports": f"The configured target for '{configured.indicator}' cannot be negative."
                })
            # Never trust the browser for the fixed target or display name.
            item["target"] = target
            item["indicator_name"] = configured.indicator

    def validate(self, attrs):
        attrs = super().validate(attrs)
        title = attrs.get("title", getattr(self.instance, "title", "")).strip()
        if not title:
            raise serializers.ValidationError({"title": "Report title is required."})

        project = attrs.get("project", getattr(self.instance, "project", None))
        ward = attrs.get("ward", getattr(self.instance, "ward", None))
        main_activity = attrs.get("main_activity", getattr(self.instance, "main_activity", None))
        sub_activity = attrs.get("sub_activity", getattr(self.instance, "sub_activity", None))
        category = attrs.get("category", getattr(self.instance, "category", "")).strip()
        value_chain = attrs.get("value_chain", getattr(self.instance, "value_chain", "")).strip()
        quarter = attrs.get("quarter", getattr(self.instance, "quarter", "")).strip()
        financial_year = attrs.get(
            "financial_year", getattr(self.instance, "financial_year", "")
        ).strip()
        reporting_period = attrs.get(
            "reporting_period", getattr(self.instance, "reporting_period", "")
        ).strip()

        selected_locations = attrs.get("selected_locations", getattr(self.instance, "selected_locations", []))
        # Locations are stored as a denormalized snapshot for the report, but
        # their IDs must still describe the County -> Sub-county -> Ward chain.
        for location in selected_locations:
            county_id = location.get("countyId")
            sub_county_id = location.get("subCountyId")
            ward_id = location.get("wardId")
            if not county_id or not sub_county_id or not ward_id:
                raise serializers.ValidationError({"selectedLocations": "Each location must include a county, sub-county, and ward."})
            if not Ward.objects.filter(pk=ward_id, sub_county_id=sub_county_id, sub_county__county_id=county_id).exists():
                raise serializers.ValidationError({"selectedLocations": "Each selected location must follow the County → Sub-county → Ward hierarchy."})
        if not getattr(self, "partial", False):
            if not project:
                raise serializers.ValidationError(
                    {"projectId": "Please select a project."}
                )
            if not quarter:
                raise serializers.ValidationError(
                    {"quarter": "Quarter is required."}
                )
            if not financial_year:
                raise serializers.ValidationError(
                    {"financialYear": "Financial year is required."}
                )
            if not category:
                raise serializers.ValidationError({"category": "Category is required."})
            if not selected_locations and not ward:
                raise serializers.ValidationError({"selectedLocations": "Select at least one project ward for this report."})

        if ward and project:
            if not ProjectLocation.objects.filter(project=project, ward=ward).exists():
                raise serializers.ValidationError({"wardId": "The selected ward is not associated with the selected project."})
        if project and selected_locations:
            selected_ward_ids = [location.get("wardId") for location in selected_locations if location.get("wardId")]
            if not selected_ward_ids or not ProjectLocation.objects.filter(project=project, ward_id__in=selected_ward_ids).count() == len(set(selected_ward_ids)):
                raise serializers.ValidationError({"selectedLocations": "Each selected ward must belong to the selected project."})

        if quarter and quarter not in self.QUARTER_MONTHS:
            raise serializers.ValidationError({"quarter": "Select Quarter 1, Quarter 2, Quarter 3, or Quarter 4."})

        if quarter and financial_year:
            reporting_period = f"{quarter} {financial_year}"

        if main_activity and sub_activity and sub_activity.main_activity_id != main_activity.id:
            raise serializers.ValidationError(
                {"subActivityId": "Select a Sub Activity under the selected Main Activity."}
            )
        if category and sub_activity and sub_activity.category != category:
            raise serializers.ValidationError(
                {"subActivityId": "Select a Sub Activity under the selected Category."}
            )
        if category == "Value Chain":
            if not value_chain:
                raise serializers.ValidationError({"valueChain": "Value Chain is required."})
            if sub_activity:
                allowed = [
                    item.strip()
                    for item in sub_activity.value_chain.split(",")
                    if item.strip()
                ]
                has_matching_sub_activity_budget = sub_activity.sub_sub_activities.filter(
                    value_chain=value_chain
                ).exists()
                if value_chain not in allowed and not has_matching_sub_activity_budget:
                    raise serializers.ValidationError(
                        {"valueChain": "Select a Value Chain assigned to this Sub Activity."}
                    )
        else:
            attrs["value_chain"] = ""

        disbursed = attrs.get("disbursed_amount", getattr(self.instance, "disbursed_amount", 0)) or 0
        utilized = attrs.get("utilized_amount", getattr(self.instance, "utilized_amount", 0)) or 0
        if utilized < 0 or disbursed < 0:
            raise serializers.ValidationError(
                {"utilizedAmount": "Amounts cannot be negative."}
            )

        indicator_reports = attrs.get("indicator_reports")
        if indicator_reports is not None:
            if not project:
                raise serializers.ValidationError({"indicatorReports": "Project is required for indicator reporting."})
            self._apply_configured_targets(
                indicator_reports, main_activity, category, value_chain
            )
            for item in indicator_reports:
                item_ward = item.get("ward") or ward
                if not item_ward:
                    raise serializers.ValidationError({"indicatorReports": "Each indicator report must identify its ward."})
                indicator_id = item["indicator_id"]
                target = item["target"]
                reported = item["reported_value"]
                cumulative = IndicatorReport.objects.filter(
                    technical_report__project=project,
                    ward=item_ward,
                    indicator_id=indicator_id,
                )
                context_report = self.instance or self._find_context_report({
                    "project": project,
                    "financial_year": financial_year,
                    "quarter": quarter,
                    "main_activity": main_activity,
                    "sub_activity": sub_activity,
                    "category": category,
                    "value_chain": value_chain,
                })
                if context_report:
                    cumulative = cumulative.exclude(technical_report=context_report)
                cumulative_value = sum((entry.reported_value for entry in cumulative), Decimal("0"))
                if target <= 0 and cumulative_value > 0:
                    raise serializers.ValidationError({"indicatorReports": "This indicator has an invalid target of 0 with previous reporting."})
                if target > 0 and cumulative_value >= target:
                    raise serializers.ValidationError({"indicatorReports": f"This indicator has already reached 100% and cannot be reported against again: {item['indicator_name']}."})
                if target > 0 and cumulative_value + reported > target:
                    raise serializers.ValidationError({"indicatorReports": f"Report Against Target cannot be greater than the remaining target for: {item['indicator_name']}."})

        attrs["title"] = title
        attrs["category"] = category
        attrs["reporting_period"] = reporting_period
        return attrs

    def create(self, validated_data):
        indicator_reports = validated_data.pop("indicator_reports", [])
        context_key = self._context_key(validated_data)
        with transaction.atomic():
            # A report is one reporting context, not one record per ward.  This
            # also picks up reports created before context_key was introduced.
            report = self._find_context_report(validated_data)
            if report:
                validated_data.pop("report_group_id", None)
                # The original report ward is only a legacy representative.
                # Ward-specific rows and selected_locations hold the coverage.
                validated_data.pop("ward", None)
                existing_locations = report.selected_locations or []
                incoming_locations = validated_data.pop("selected_locations", [])
                location_by_ward = {str(item.get("wardId")): item for item in existing_locations if item.get("wardId")}
                location_by_ward.update({str(item.get("wardId")): item for item in incoming_locations if item.get("wardId")})
                validated_data["selected_locations"] = list(location_by_ward.values())
                for attr, value in validated_data.items():
                    # A duplicate submission often has blank optional fields;
                    # it must never erase narrative, configured indicators, or
                    # document references already stored on the context.
                    if attr in {"achievement", "remarks", "supporting_information"} and not value:
                        continue
                    if attr in {"supporting_documents", "indicators", "sub_sub_activities"} and not value:
                        continue
                    setattr(report, attr, value)
                if not report.context_key:
                    report.context_key = context_key
                report.save()
            else:
                try:
                    report = TechnicalReport.objects.create(context_key=context_key, **validated_data)
                except Exception as error:
                    # The database unique constraint is the final protection
                    # against concurrent identical submissions.
                    report = TechnicalReport.objects.filter(context_key=context_key).first()
                    if not report:
                        raise error
            existing = {(item.ward_id, item.indicator_id): item for item in report.indicator_reports.all()}
            for item in indicator_reports:
                ward = item.get("ward") or report.ward
                row = existing.get((ward.id if ward else None, item["indicator_id"]))
                if row:
                    for attr, value in item.items():
                        setattr(row, attr, value)
                    row.save()
                else:
                    IndicatorReport.objects.create(technical_report=report, **item)
        return report

    @staticmethod
    def _context_key(data):
        """Hash every field that identifies a technical reporting context."""
        values = (
            data.get("project").pk if data.get("project") else "",
            (data.get("financial_year") or "").strip().casefold(),
            (data.get("quarter") or "").strip().casefold(),
            data.get("main_activity").pk if data.get("main_activity") else "",
            data.get("sub_activity").pk if data.get("sub_activity") else "",
            (data.get("category") or "").strip().casefold(),
            (data.get("value_chain") or "").strip().casefold(),
        )
        return sha256("|".join(map(str, values)).encode()).hexdigest()

    @staticmethod
    def _find_context_report(data):
        return TechnicalReport.objects.filter(
            project=data.get("project"),
            financial_year=data.get("financial_year", ""),
            quarter=data.get("quarter", ""),
            main_activity=data.get("main_activity"),
            sub_activity=data.get("sub_activity"),
            category=data.get("category", ""),
            value_chain=data.get("value_chain", ""),
        ).order_by("created_at").first()

    def update(self, instance, validated_data):
        indicator_reports = validated_data.pop("indicator_reports", None)
        with transaction.atomic():
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            context_key = self._context_key({
                "project": instance.project,
                "financial_year": instance.financial_year,
                "quarter": instance.quarter,
                "main_activity": instance.main_activity,
                "sub_activity": instance.sub_activity,
                "category": instance.category,
                "value_chain": instance.value_chain,
            })
            if TechnicalReport.objects.exclude(pk=instance.pk).filter(context_key=context_key).exists():
                raise serializers.ValidationError({"nonFieldErrors": "A report already exists for this financial year, quarter, and reporting context."})
            instance.context_key = context_key
            instance.save()
            if indicator_reports is not None:
                existing = {(item.ward_id, item.indicator_id): item for item in instance.indicator_reports.all()}
                for item in indicator_reports:
                    row = existing.get((item.get("ward").id if item.get("ward") else instance.ward_id, item["indicator_id"]))
                    if row:
                        for attr, value in item.items():
                            setattr(row, attr, value)
                        row.save()
                    else:
                        IndicatorReport.objects.create(technical_report=instance, **item)
        return instance


class MainActivityIndicatorSerializer(serializers.ModelSerializer):
    mainActivityId = serializers.PrimaryKeyRelatedField(
        source="main_activity", queryset=MainActivity.objects.all(), required=False, allow_null=True
    )
    valueChain = serializers.CharField(source="value_chain", required=False, allow_blank=True, default="")
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = MainActivityIndicator
        fields = ["id", "mainActivityId", "category", "valueChain", "indicator", "target", "createdAt"]


class MainActivitySerializer(serializers.ModelSerializer):
    subComponentId = serializers.PrimaryKeyRelatedField(
        source="sub_component", queryset=ProjectSubComponent.objects.all()
    )
    subComponentName = serializers.CharField(source="sub_component.name", read_only=True)
    projectOutputId = serializers.PrimaryKeyRelatedField(
        source="project_output", queryset=ProjectOutput.objects.all(), required=False, allow_null=True
    )
    projectOutputName = serializers.CharField(source="project_output.name", read_only=True)
    componentId = serializers.SerializerMethodField()
    componentName = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = MainActivity
        fields = [
            "id",
            "subComponentId",
            "subComponentName",
            "projectOutputId",
            "projectOutputName",
            "componentId",
            "componentName",
            "name",
            "createdAt",
        ]

    def validate(self, attrs):
        errors = {}
        if self.instance and "strategy" in attrs and attrs["strategy"] != self.instance.strategy:
            errors["strategyId"] = "The Strategy cannot be changed after creation."
        if self.instance and "key_activity" in attrs and attrs["key_activity"] != self.instance.key_activity:
            errors["keyActivityId"] = "The Key Activity cannot be changed after creation."
        if self.instance and "expected_output" in attrs and attrs["expected_output"] != self.instance.expected_output:
            errors["expectedOutputId"] = "The Expected Output cannot be changed after creation."
        if errors:
            raise serializers.ValidationError(errors)
        return attrs

    def get_componentId(self, obj):
        return obj.sub_component.component_id if obj.sub_component_id else None

    def get_componentName(self, obj):
        return obj.sub_component.component.name if obj.sub_component_id else ""

    def validate(self, attrs):
        attrs = super().validate(attrs)
        name = attrs.get("name", getattr(self.instance, "name", "")).strip()
        if not attrs.get("sub_component", getattr(self.instance, "sub_component", None)):
            raise serializers.ValidationError({"subComponentId": "Please select a Sub Component."})
        project_output = attrs.get("project_output", getattr(self.instance, "project_output", None))
        sub_component = attrs.get("sub_component", getattr(self.instance, "sub_component", None))
        if not project_output:
            raise serializers.ValidationError({"projectOutputId": "Please select a Project Output."})
        if project_output and project_output.sub_component_id != sub_component.id:
            raise serializers.ValidationError({"projectOutputId": "Select a Project Output under the selected Sub Component."})
        if not name:
            raise serializers.ValidationError({"name": "Main Activity is required."})
        attrs["name"] = name
        return attrs


class ActivityIndicatorSerializer(serializers.ModelSerializer):
    subComponentId = serializers.PrimaryKeyRelatedField(
        source="sub_component", queryset=ProjectSubComponent.objects.all()
    )
    subComponentName = serializers.CharField(source="sub_component.name", read_only=True)
    projectOutputId = serializers.PrimaryKeyRelatedField(
        source="project_output", queryset=ProjectOutput.objects.all(), required=False, allow_null=True
    )
    projectOutputName = serializers.CharField(source="project_output.name", read_only=True, allow_null=True)
    mainActivityId = serializers.PrimaryKeyRelatedField(
        source="main_activity", queryset=MainActivity.objects.all(), required=False, allow_null=True
    )
    mainActivityName = serializers.CharField(source="main_activity.name", read_only=True, allow_null=True)
    unitOfMeasure = serializers.CharField(source="unit_of_measure")
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = ActivityIndicator
        fields = [
            "id",
            "subComponentId",
            "subComponentName",
            "projectOutputId",
            "projectOutputName",
            "mainActivityId",
            "mainActivityName",
            "indicator",
            "target",
            "unitOfMeasure",
            "createdAt",
            "updatedAt",
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        indicator = attrs.get("indicator", getattr(self.instance, "indicator", "")).strip()
        target = attrs.get("target", getattr(self.instance, "target", "")).strip()
        unit = attrs.get("unit_of_measure", getattr(self.instance, "unit_of_measure", "")).strip()
        sub_component = attrs.get("sub_component", getattr(self.instance, "sub_component", None))
        project_output = attrs.get("project_output", getattr(self.instance, "project_output", None))
        main_activity = attrs.get("main_activity", getattr(self.instance, "main_activity", None))
        if not sub_component:
            raise serializers.ValidationError({"subComponentId": "Please select a Sub Component."})
        if main_activity and main_activity.sub_component_id != sub_component.id:
            raise serializers.ValidationError({"mainActivityId": "Select a Main Activity under the selected Sub Component."})
        if project_output and project_output.sub_component_id != sub_component.id:
            raise serializers.ValidationError({"projectOutputId": "Select a Project Output under the selected Sub Component."})
        if main_activity and project_output and main_activity.project_output_id and main_activity.project_output_id != project_output.id:
            raise serializers.ValidationError({"mainActivityId": "Select a Main Activity under the selected Project Output."})
        if not indicator:
            raise serializers.ValidationError({"indicator": "Indicator is required."})
        attrs["indicator"] = indicator
        attrs["target"] = target
        attrs["unit_of_measure"] = unit
        return attrs


class SubActivitySerializer(serializers.ModelSerializer):
    mainActivityId = serializers.PrimaryKeyRelatedField(
        source="main_activity", queryset=MainActivity.objects.all()
    )
    mainActivityName = serializers.CharField(source="main_activity.name", read_only=True)
    valueChain = serializers.CharField(
        source="value_chain", required=False, allow_blank=True, default=""
    )
    valueChainIds = serializers.PrimaryKeyRelatedField(
        source="value_chains", queryset=ValueChain.objects.all(), many=True, required=False
    )
    valueChains = serializers.SerializerMethodField()
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
            "valueChainIds",
            "valueChains",
            "createdAt",
        ]

    def get_valueChains(self, obj):
        return [{"id": str(chain.id), "name": chain.name} for chain in obj.value_chains.all()]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        category = attrs.get("category", getattr(self.instance, "category", ""))
        selected_chains = attrs.get("value_chains")
        if selected_chains is None and self.instance:
            selected_chains = list(self.instance.value_chains.all())

        # Accept the former comma-separated payload during the transition.
        if selected_chains is None and attrs.get("value_chain"):
            names = [name.strip() for name in attrs["value_chain"].split(",") if name.strip()]
            selected_chains = list(ValueChain.objects.filter(name__in=names))

        if category != "Value Chain":
            attrs["value_chain"] = ""
            attrs["value_chains"] = []
        elif not selected_chains:
            raise serializers.ValidationError(
                {"valueChainIds": "Please select at least one value chain."}
            )
        else:
            attrs["value_chains"] = selected_chains
            attrs["value_chain"] = ", ".join(chain.name for chain in selected_chains)

        return attrs


class SubSubActivitySerializer(serializers.ModelSerializer):
    subActivityId = serializers.PrimaryKeyRelatedField(
        source="sub_activity", queryset=SubActivity.objects.all()
    )
    subActivityName = serializers.CharField(source="sub_activity.name", read_only=True)
    category = serializers.CharField(source="sub_activity.category", read_only=True)
    valueChain = serializers.CharField(
        source="value_chain", required=False, allow_blank=True, default=""
    )
    valueChainId = serializers.PrimaryKeyRelatedField(
        source="value_chain_reference", queryset=ValueChain.objects.all(), required=False, allow_null=True
    )
    approvedActivityBudget = serializers.DecimalField(
        source="approved_activity_budget",
        max_digits=20,
        decimal_places=2,
        min_value=0,
    )
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = SubSubActivity
        fields = [
            "id",
            "subActivityId",
            "subActivityName",
            "category",
            "valueChain",
            "valueChainId",
            "name",
            "approvedActivityBudget",
            "createdAt",
        ]
        extra_kwargs = {"name": {"required": False, "allow_blank": True, "default": ""}}

    def validate(self, attrs):
        attrs = super().validate(attrs)
        sub_activity = attrs.get(
            "sub_activity", getattr(self.instance, "sub_activity", None)
        )
        name = attrs.get("name", getattr(self.instance, "name", "")).strip()
        value_chain = attrs.get("value_chain", getattr(self.instance, "value_chain", "")).strip()
        selected_chain = attrs.get(
            "value_chain_reference", getattr(self.instance, "value_chain_reference", None)
        )

        # Support older clients that post a value-chain name instead of its id.
        if not selected_chain and value_chain:
            selected_chain = ValueChain.objects.filter(name__iexact=value_chain).first()

        if sub_activity and sub_activity.category == "Value Chain":
            if not name:
                raise serializers.ValidationError(
                    {"name": "Sub-Sub Activity name is required for Value Chain activities."}
                )
            if not selected_chain:
                raise serializers.ValidationError(
                    {"valueChainId": "Please select a value chain."}
                )
            if not sub_activity.value_chains.filter(pk=selected_chain.pk).exists():
                raise serializers.ValidationError(
                    {"valueChainId": "Select a value chain assigned to this Sub Activity."}
                )
            attrs["value_chain_reference"] = selected_chain
            attrs["value_chain"] = selected_chain.name
        else:
            attrs["value_chain"] = ""
            attrs["value_chain_reference"] = None

        attrs["name"] = name
        return attrs
