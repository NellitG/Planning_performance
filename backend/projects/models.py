from django.db import models


class Project(models.Model):
    STATUS_CHOICES = [
        ("Not Started", "Not Started"),
        ("Ongoing", "Ongoing"),
        ("Completed", "Completed"),
        ("Suspended", "Suspended"),
        ("Delayed", "Delayed"),
        ("Pending", "Pending"),
        ("Terminated", "Terminated"),
    ]
    PROJECT_TYPE_CHOICES = [
        ("Research and Development", "Research and Development"),
        ("Infrastructure", "Infrastructure"),
        ("Corporate", "Corporate"),
    ]

    project_name = models.CharField(max_length=500)
    logo = models.CharField(max_length=20, blank=True)
    description = models.TextField(blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Not Started")

    project_coordinator = models.CharField(max_length=500, blank=True)
    # The display field above remains for backwards compatibility.  These
    # relationships are the authoritative source for new projects.
    main_project = models.CharField(max_length=500, blank=True)
    project_group_id = models.UUIDField(null=True, blank=True, db_index=True)
    coordinator_user = models.ForeignKey("user_management.UserAccount", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="coordinated_projects")
    principal_investigators = models.ManyToManyField("user_management.UserAccount", blank=True,
        related_name="principal_investigator_projects")
    co_principal_investigators = models.ManyToManyField("user_management.UserAccount", blank=True,
        related_name="co_principal_investigator_projects")
    investigator_institutes = models.ManyToManyField("user_management.Institute", blank=True,
        related_name="investigator_projects")
    project_type = models.CharField(max_length=50, blank=True)

    implementation_units = models.JSONField(default=dict, blank=True)
    value_chains = models.JSONField(default=list, blank=True)

    expected_budget = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)

    background = models.TextField(blank=True)
    project_objectives = models.TextField(blank=True)
    expected_outcomes = models.TextField(blank=True)
    collaborators = models.TextField(blank=True)

    total_beneficiaries = models.IntegerField(null=True, blank=True)
    women = models.IntegerField(null=True, blank=True)
    men = models.IntegerField(null=True, blank=True)
    youth = models.IntegerField(null=True, blank=True)
    pwds = models.IntegerField(null=True, blank=True)

    locations = models.JSONField(default=list, blank=True)
    funding_sources = models.JSONField(default=list, blank=True)

    is_draft = models.BooleanField(default=False)
    current_step = models.PositiveSmallIntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.project_name


class County(models.Model):
    name = models.CharField(max_length=120, unique=True)
    svg_id = models.CharField(max_length=120, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class SubCounty(models.Model):
    county = models.ForeignKey(County, on_delete=models.CASCADE, related_name="sub_counties")
    name = models.CharField(max_length=160)

    class Meta:
        ordering = ["name"]
        constraints = [models.UniqueConstraint(fields=["county", "name"], name="unique_subcounty_per_county")]

    def __str__(self):
        return f"{self.county.name} - {self.name}"


class Ward(models.Model):
    sub_county = models.ForeignKey(SubCounty, on_delete=models.CASCADE, related_name="wards")
    name = models.CharField(max_length=160)

    class Meta:
        ordering = ["name"]
        constraints = [models.UniqueConstraint(fields=["sub_county", "name"], name="unique_ward_per_subcounty")]

    def __str__(self):
        return f"{self.sub_county.name} - {self.name}"


class ProjectLocation(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="project_locations")
    county = models.ForeignKey(County, on_delete=models.CASCADE)
    sub_county = models.ForeignKey(SubCounty, on_delete=models.CASCADE, null=True, blank=True)
    ward = models.ForeignKey(Ward, on_delete=models.CASCADE, null=True, blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["project", "county", "sub_county", "ward"], name="unique_project_location")]


class KeyResultArea(models.Model):
    title = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name = "Key Result Area"

    def __str__(self):
        return self.title


class StrategicObjective(models.Model):
    key_result_area = models.ForeignKey(
        KeyResultArea, on_delete=models.CASCADE, related_name="objectives"
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return self.text[:80]


class Strategy(models.Model):
    strategic_objective = models.ForeignKey(
        StrategicObjective, on_delete=models.CASCADE, related_name="strategies"
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name_plural = "Strategies"

    def __str__(self):
        return self.text[:80]


class KeyActivity(models.Model):
    strategy = models.ForeignKey(
        Strategy, on_delete=models.CASCADE, related_name="key_activities"
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name_plural = "Key Activities"

    def __str__(self):
        return self.text[:80]


class ExpectedOutput(models.Model):
    strategy = models.ForeignKey(
        Strategy, on_delete=models.CASCADE, related_name="expected_outputs"
    )
    key_activity = models.ForeignKey(
        KeyActivity,
        on_delete=models.CASCADE,
        related_name="expected_outputs",
        null=True,
        blank=True,
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return self.text[:80]


class OutputIndicator(models.Model):
    expected_output = models.ForeignKey(
        ExpectedOutput, on_delete=models.CASCADE, related_name="output_indicators"
    )
    strategy = models.ForeignKey(
        Strategy,
        on_delete=models.CASCADE,
        related_name="output_indicators",
        null=True,
        blank=True,
    )
    key_activity = models.ForeignKey(
        KeyActivity,
        on_delete=models.CASCADE,
        related_name="output_indicators",
        null=True,
        blank=True,
    )
    text = models.TextField()
    cumulative_target = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    year_1_target = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    year_2_target = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    year_3_target = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    year_4_target = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    year_5_target = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_budget_millions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    budget_year_1 = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    budget_year_2 = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    budget_year_3 = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    budget_year_4 = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    budget_year_5 = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return self.text[:80]


class Outcome(models.Model):
    key_result_area = models.ForeignKey(
        KeyResultArea, on_delete=models.CASCADE, related_name="outcomes"
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return self.text[:80]


class OutcomeIndicator(models.Model):
    outcome = models.ForeignKey(
        Outcome, on_delete=models.CASCADE, related_name="indicators"
    )
    text = models.TextField()
    baseline_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    midterm_target = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    endterm_target = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return self.text[:80]


class ProjectDocument(models.Model):
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="documents"
    )
    name = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    document_type = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class ProjectDocumentFile(models.Model):
    document = models.ForeignKey(
        ProjectDocument, on_delete=models.CASCADE, related_name="files"
    )
    file = models.FileField(upload_to="project_documents/")
    name = models.CharField(max_length=500, blank=True)
    size = models.BigIntegerField(default=0)
    file_type = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class ProjectMapping(models.Model):
    project = models.OneToOneField(
        Project, on_delete=models.CASCADE, related_name="mapping"
    )
    kra_ids = models.JSONField(default=list, blank=True)
    objective_ids = models.JSONField(default=list, blank=True)
    strategy_ids = models.JSONField(default=list, blank=True)
    key_activity_ids = models.JSONField(default=list, blank=True)
    expected_output_ids = models.JSONField(default=list, blank=True)
    output_indicator_ids = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Mapping for {self.project_id}"


class ProjectComponent(models.Model):
    name = models.CharField(max_length=500, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Project Component"
        verbose_name_plural = "Project Components"

    def __str__(self):
        return self.name


class ProjectSubComponent(models.Model):
    component = models.ForeignKey(
        ProjectComponent, on_delete=models.CASCADE, related_name="sub_components"
    )
    name = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["component__name", "name"]
        unique_together = ["component", "name"]
        verbose_name = "Project Sub Component"
        verbose_name_plural = "Project Sub Components"

    def __str__(self):
        return self.name


class ProjectOutput(models.Model):
    sub_component = models.ForeignKey(
        ProjectSubComponent, on_delete=models.CASCADE, related_name="project_outputs"
    )
    name = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sub_component__name", "name"]
        unique_together = ["sub_component", "name"]
        verbose_name = "Project Output"
        verbose_name_plural = "Project Outputs"

    def __str__(self):
        return self.name


class MainActivity(models.Model):
    sub_component = models.ForeignKey(
        ProjectSubComponent,
        on_delete=models.SET_NULL,
        related_name="main_activities",
        null=True,
        blank=True,
    )
    project_output = models.ForeignKey(
        ProjectOutput,
        on_delete=models.SET_NULL,
        related_name="main_activities",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Main Activity"
        verbose_name_plural = "Main Activities"

    def __str__(self):
        return self.name


class MainActivityIndicator(models.Model):
    CATEGORY_CHOICES = [
        ("ICT", "ICT"),
        ("Value Chain", "Value Chain"),
        ("Thematic Area", "Thematic Area"),
        ("Project Coordination", "Project Coordination"),
    ]

    main_activity = models.ForeignKey(
        MainActivity, on_delete=models.CASCADE, related_name="indicators"
    )
    category = models.CharField(max_length=40, choices=CATEGORY_CHOICES, default="ICT")
    value_chain = models.CharField(max_length=120, blank=True)
    indicator = models.CharField(max_length=500)
    target = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name = "Main Activity Indicator"
        verbose_name_plural = "Main Activity Indicators"

    def __str__(self):
        return self.indicator[:80]


class SubActivity(models.Model):
    CATEGORY_CHOICES = [
        ("Value Chain", "Value Chain"),
        ("Project Coordination", "Project Coordination"),
        ("ICT", "ICT"),
        ("Thematic Area", "Thematic Area"),
    ]

    main_activity = models.ForeignKey(
        MainActivity, on_delete=models.CASCADE, related_name="sub_activities"
    )
    name = models.CharField(max_length=500)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, blank=True)
    value_chains = models.ManyToManyField(
        "user_management.ValueChain", blank=True, related_name="sub_activities"
    )
    value_chain = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Sub Activity"
        verbose_name_plural = "Sub Activities"

    def __str__(self):
        return self.name


class SubSubActivity(models.Model):
    sub_activity = models.ForeignKey(
        SubActivity, on_delete=models.CASCADE, related_name="sub_sub_activities"
    )
    # Nullable for records created before value chains becames a relation.
    value_chain_reference = models.ForeignKey(
        "user_management.ValueChain",
        on_delete=models.SET_NULL,
        related_name="sub_sub_activities",
        null=True,
        blank=True,
    )
    value_chain = models.CharField(max_length=120, blank=True)
    name = models.CharField(max_length=500, blank=True)
    approved_activity_budget = models.DecimalField(max_digits=20, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Sub-Sub Activity"
        verbose_name_plural = "Sub-Sub Activities"

    def __str__(self):
        return self.name or f"{self.sub_activity.name} budget"


class ActivityIndicator(models.Model):
    sub_component = models.ForeignKey(
        ProjectSubComponent,
        on_delete=models.SET_NULL,
        related_name="activity_indicators",
        null=True,
        blank=True,
    )
    project_output = models.ForeignKey(
        ProjectOutput,
        on_delete=models.SET_NULL,
        related_name="activity_indicators",
        null=True,
        blank=True,
    )
    main_activity = models.ForeignKey(
        MainActivity,
        on_delete=models.SET_NULL,
        related_name="activity_indicators",
        null=True,
        blank=True,
    )
    # main_activity as the authoritative parent relationship.
    sub_activity = models.ForeignKey(
        SubActivity,
        on_delete=models.CASCADE,
        related_name="activity_indicators",
        null=True,
        blank=True,
    )
    indicator = models.CharField(max_length=500)
    target = models.CharField(max_length=500, blank=True)
    unit_of_measure = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Indicator"
        verbose_name_plural = "Indicators"

    def __str__(self):
        return self.indicator[:80]


class TechnicalReport(models.Model):
    STATUS_CHOICES = [
        ("Draft", "Draft"),
        ("Submitted to Accountant", "Submitted to Accountant"),
        ("Rejected by Accountant", "Rejected by Accountant"),
        ("Approved by Accountant", "Approved by Accountant"),
        ("Submitted to Project Coordinator", "Submitted to Project Coordinator"),
        ("Rejected by Project Coordinator", "Rejected by Project Coordinator"),
        ("Approved by Project Coordinator", "Approved by Project Coordinator"),
        ("Submitted to M&E", "Submitted to M&E"),
        ("Rejected by M&E", "Rejected by M&E"),
        ("Approved/Finalized", "Approved/Finalized"),
    ]

    title = models.CharField(max_length=500)
    project = models.ForeignKey(
        Project, on_delete=models.SET_NULL, related_name="technical_reports", null=True, blank=True
    )
    main_activity = models.ForeignKey(
        MainActivity, on_delete=models.SET_NULL, related_name="technical_reports", null=True, blank=True
    )
    category = models.CharField(max_length=50, blank=True)
    value_chain = models.CharField(max_length=120, blank=True)
    sub_activity = models.ForeignKey(
        SubActivity, on_delete=models.SET_NULL, related_name="technical_reports", null=True, blank=True
    )
    ward = models.ForeignKey(
        "Ward", on_delete=models.SET_NULL, related_name="technical_reports", null=True, blank=True
    )
    
    report_group_id = models.UUIDField(null=True, blank=True, db_index=True)
    context_key = models.CharField(max_length=64, null=True, blank=True, unique=True)
    selected_locations = models.JSONField(default=list, blank=True)
    sub_sub_activities = models.JSONField(default=list, blank=True)
    indicators = models.JSONField(default=list, blank=True)
    quarter = models.CharField(max_length=20, blank=True)
    financial_year = models.CharField(max_length=20, blank=True)
    reporting_period = models.CharField(max_length=120, blank=True)
    disbursed_amount = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    utilized_amount = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    percentage_utilization = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    status = models.CharField(max_length=60, choices=STATUS_CHOICES, default="Draft")
    created_by = models.ForeignKey("user_management.UserAccount", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="created_reports")
    original_report = models.OneToOneField("self", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="value_chain_lead_copy")
    achievement = models.TextField(blank=True)
    remarks = models.TextField(blank=True)
    supporting_information = models.TextField(blank=True)
    supporting_documents = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Technical Report"
        verbose_name_plural = "Technical Reports"

    def __str__(self):
        return self.title


class ReportWorkflowAudit(models.Model):
    report = models.ForeignKey(TechnicalReport, on_delete=models.CASCADE, related_name="workflow_audit")
    action = models.CharField(max_length=30)
    user = models.ForeignKey("user_management.UserAccount", null=True, on_delete=models.SET_NULL)
    user_role = models.CharField(max_length=80)
    previous_status = models.CharField(max_length=80)
    new_status = models.CharField(max_length=80)
    rejection_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class WorkflowNotification(models.Model):
    recipient = models.ForeignKey("user_management.UserAccount", on_delete=models.CASCADE, related_name="workflow_notifications")
    report = models.ForeignKey(TechnicalReport, on_delete=models.CASCADE, related_name="notifications")
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class IndicatorReport(models.Model):
    """A ward-specific reporting entry for one indicator in a technical report."""
    technical_report = models.ForeignKey(
        TechnicalReport, on_delete=models.CASCADE, related_name="indicator_reports"
    )
    ward = models.ForeignKey(
        "Ward", on_delete=models.SET_NULL, related_name="indicator_reports", null=True, blank=True
    )
    indicator_id = models.CharField(max_length=64)
    indicator_name = models.CharField(max_length=500)
    target = models.DecimalField(max_digits=20, decimal_places=2)
    reported_value = models.DecimalField(max_digits=20, decimal_places=2)
    achievement = models.TextField(blank=True)
    remarks = models.TextField(blank=True)
    reason_for_zero = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["technical_report", "ward", "indicator_id"],
                name="unique_indicator_report_per_report_ward",
            )
        ]

    def __str__(self):
        return f"{self.technical_report_id}: {self.indicator_name[:60]}"


class IndicatorReportEvidence(models.Model):
    indicator_report = models.ForeignKey(
        IndicatorReport, on_delete=models.CASCADE, related_name="evidence_files"
    )
    file = models.FileField(upload_to="technical_report_evidence/")
    name = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class IndicatorTracking(models.Model):
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="tracking"
    )
    output_indicator = models.ForeignKey(
        OutputIndicator, on_delete=models.CASCADE, related_name="tracking"
    )
    year = models.PositiveSmallIntegerField()
    target = models.FloatField(null=True, blank=True)
    achievement = models.TextField(blank=True)
    remarks = models.TextField(blank=True)
    evidence = models.FileField(upload_to="evidence/", null=True, blank=True)
    evidence_name = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["year"]
        unique_together = ["project", "output_indicator", "year"]

    def __str__(self):
        return f"Tracking P{self.project_id} OI{self.output_indicator_id} Y{self.year}"
