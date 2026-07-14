from django.core.validators import FileExtensionValidator
from django.db import models


class UserAccount(models.Model):
    ROLE_CHOICES = [
        ("system_admin", "System Admin"),
        ("national_me", "National M&E"),
        ("high_level", "High Level"),
        ("business_logic", "Business Logic"),
        ("project_manager", "Project Manager"),
        ("department_head", "Department Head"),
        ("staff_user", "Staff User"),
    ]

    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    institute = models.CharField(max_length=255)
    password = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["full_name"]
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return f"{self.full_name} <{self.email}>"


class ValueChain(models.Model):
    CATEGORY_CHOICES = [
        ("Crops", "Crops"),
        ("Fisheries", "Fisheries"),
        ("Livestock", "Livestock"),
    ]
    PRIORITY_CHOICES = [
        ("High", "High"),
        ("Medium", "Medium"),
        ("Low", "Low"),
    ]

    name = models.CharField(max_length=255, unique=True)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="Medium")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Value Chain"
        verbose_name_plural = "Value Chains"

    def __str__(self):
        return self.name


class StrategicPlanDocument(models.Model):
    document_title = models.CharField(max_length=255)
    uploaded_file = models.FileField(
        upload_to="strategic_plan/",
        validators=[
            FileExtensionValidator(
                allowed_extensions=["pdf", "doc", "docx", "xls", "xlsx"]
            )
        ],
    )
    uploaded_by = models.CharField(max_length=255, blank=True)
    date_uploaded = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date_uploaded"]
        verbose_name = "Strategic Plan Document"
        verbose_name_plural = "Strategic Plan Documents"

    def __str__(self):
        return self.document_title
