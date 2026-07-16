from rest_framework import serializers

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
    TechnicalReport,
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


class TechnicalReportSerializer(serializers.ModelSerializer):
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
    mainActivityName = serializers.CharField(source="main_activity.name", read_only=True)
    subActivityName = serializers.CharField(source="sub_activity.name", read_only=True)
    valueChain = serializers.CharField(source="value_chain", required=False, allow_blank=True, default="")
    subSubActivities = serializers.JSONField(source="sub_sub_activities", required=False, default=list)
    supportingDocuments = serializers.JSONField(source="supporting_documents", required=False, default=list)
    reportingPeriod = serializers.CharField(source="reporting_period", required=False, allow_blank=True, default="")
    startDate = serializers.DateField(source="start_date", required=False, allow_null=True)
    endDate = serializers.DateField(source="end_date", required=False, allow_null=True)
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
    supportingInformation = serializers.CharField(
        source="supporting_information", required=False, allow_blank=True, default=""
    )
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
            "mainActivityName",
            "subActivityName",
            "subSubActivities",
            "indicators",
            "quarter",
            "financialYear",
            "reportingPeriod",
            "startDate",
            "endDate",
            "disbursedAmount",
            "utilizedAmount",
            "percentageUtilization",
            "status",
            "achievement",
            "remarks",
            "supportingInformation",
            "supportingDocuments",
            "createdAt",
            "updatedAt",
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        title = attrs.get("title", getattr(self.instance, "title", "")).strip()
        if not title:
            raise serializers.ValidationError({"title": "Report title is required."})

        project = attrs.get("project", getattr(self.instance, "project", None))
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

        start_date = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end_date = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({"endDate": "End date cannot be before start date."})

        disbursed = attrs.get("disbursed_amount", getattr(self.instance, "disbursed_amount", 0)) or 0
        utilized = attrs.get("utilized_amount", getattr(self.instance, "utilized_amount", 0)) or 0
        if utilized < 0 or disbursed < 0:
            raise serializers.ValidationError(
                {"utilizedAmount": "Amounts cannot be negative."}
            )

        attrs["title"] = title
        attrs["category"] = category
        attrs["reporting_period"] = reporting_period
        return attrs


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
    componentId = serializers.SerializerMethodField()
    componentName = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = MainActivity
        fields = [
            "id",
            "subComponentId",
            "subComponentName",
            "componentId",
            "componentName",
            "name",
            "createdAt",
        ]

    def get_componentId(self, obj):
        return obj.sub_component.component_id if obj.sub_component_id else None

    def get_componentName(self, obj):
        return obj.sub_component.component.name if obj.sub_component_id else ""

    def validate(self, attrs):
        attrs = super().validate(attrs)
        name = attrs.get("name", getattr(self.instance, "name", "")).strip()
        if not attrs.get("sub_component", getattr(self.instance, "sub_component", None)):
            raise serializers.ValidationError({"subComponentId": "Please select a Sub Component."})
        if not name:
            raise serializers.ValidationError({"name": "Main Activity is required."})
        attrs["name"] = name
        return attrs


class ActivityIndicatorSerializer(serializers.ModelSerializer):
    subActivityId = serializers.PrimaryKeyRelatedField(
        source="sub_activity", queryset=SubActivity.objects.all()
    )
    subActivityName = serializers.CharField(source="sub_activity.name", read_only=True)
    mainActivityName = serializers.CharField(source="sub_activity.main_activity.name", read_only=True)
    unitOfMeasure = serializers.CharField(source="unit_of_measure")
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = ActivityIndicator
        fields = [
            "id",
            "subActivityId",
            "subActivityName",
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
        if not attrs.get("sub_activity", getattr(self.instance, "sub_activity", None)):
            raise serializers.ValidationError({"subActivityId": "Please select a Sub Activity."})
        if not indicator:
            raise serializers.ValidationError({"indicator": "Indicator is required."})
        if not target:
            raise serializers.ValidationError({"target": "Target is required."})
        if not unit:
            raise serializers.ValidationError({"unitOfMeasure": "Unit of Measure is required."})
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
