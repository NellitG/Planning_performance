from django.db import models


class Project(models.Model):
    STATUS_CHOICES = [
        ("Active", "Active"),
        ("Completed", "Completed"),
        ("Delayed", "Delayed"),
        ("Pending", "Pending"),
    ]

    project_name = models.CharField(max_length=500)
    logo = models.CharField(max_length=20, blank=True)
    description = models.TextField(blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending")
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
