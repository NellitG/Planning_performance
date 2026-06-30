from django.db import models


class Project(models.Model):
    STATUS_CHOICES = [
        ("Not Started", "Not Started"),
        ("Ongoing", "Ongoing"),
        ("Active", "Active"),
        ("Completed", "Completed"),
        ("Suspended", "Suspended"),
        ("Delayed", "Delayed"),
        ("Pending", "Pending"),
    ]
    PROJECT_TYPE_CHOICES = [
        ("Research", "Research"),
        ("Development", "Development"),
        ("Collaborative", "Collaborative"),
        ("Multidisciplinary", "Multidisciplinary"),
        ("Corporate", "Corporate"),
        ("Other", "Other"),
    ]
    SCALE_CHOICES = [
        ("Small", "Small (< 5M)"),
        ("Medium", "Medium (5M – 10M)"),
        ("Large", "Large (> 10M)"),
    ]

    project_name = models.CharField(max_length=500)
    logo = models.CharField(max_length=20, blank=True)
    description = models.TextField(blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Not Started")

    project_coordinator = models.CharField(max_length=500, blank=True)
    project_type = models.CharField(max_length=50, blank=True)
    scale = models.CharField(max_length=20, blank=True)

    implementation_units = models.JSONField(default=dict, blank=True)
    value_chains = models.JSONField(default=list, blank=True)

    completion_rate = models.FloatField(null=True, blank=True)
    expected_budget = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    disbursed_amount = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    utilized_amount = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)

    background = models.TextField(blank=True)
    project_objectives = models.TextField(blank=True)
    expected_outcomes = models.TextField(blank=True)
    sustainability = models.TextField(blank=True)
    collaborators = models.TextField(blank=True)

    total_beneficiaries = models.IntegerField(null=True, blank=True)
    women = models.IntegerField(null=True, blank=True)
    youth = models.IntegerField(null=True, blank=True)
    vmgs = models.IntegerField(null=True, blank=True)
    pwds = models.IntegerField(null=True, blank=True)

    locations = models.JSONField(default=list, blank=True)
    funding_sources = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.project_name


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
    file = models.FileField(upload_to="project_documents/", null=True, blank=True)
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


class MainActivity(models.Model):
    name = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Main Activity"
        verbose_name_plural = "Main Activities"

    def __str__(self):
        return self.name


class SubActivity(models.Model):
    main_activity = models.ForeignKey(
        MainActivity, on_delete=models.CASCADE, related_name="sub_activities"
    )
    name = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Sub Activity"
        verbose_name_plural = "Sub Activities"

    def __str__(self):
        return self.name


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
    evidence = models.FileField(upload_to="evidence/", null=True, blank=True)
    evidence_name = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["year"]
        unique_together = ["project", "output_indicator", "year"]

    def __str__(self):
        return f"Tracking P{self.project_id} OI{self.output_indicator_id} Y{self.year}"
