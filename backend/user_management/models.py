from django.core.validators import FileExtensionValidator
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.conf import settings

class County(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Institute(models.Model):
    name = models.CharField(max_length=255, unique=True)
    county = models.ForeignKey(County, related_name="institutes", on_delete=models.PROTECT)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Centre(models.Model):
    name = models.CharField(max_length=255)
    county = models.ForeignKey(County, related_name="centres", on_delete=models.PROTECT)
    institute = models.ForeignKey(Institute, related_name="centres", on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        constraints = [models.UniqueConstraint(fields=["name", "institute"], name="unique_centre_per_institute")]

    def __str__(self):
        return self.name


class SubCentre(models.Model):
    name = models.CharField(max_length=255)
    county = models.ForeignKey(County, related_name="sub_centres", on_delete=models.PROTECT)
    institute = models.ForeignKey(Institute, related_name="sub_centres", on_delete=models.CASCADE)
    centre = models.ForeignKey(Centre, related_name="sub_centres", on_delete=models.CASCADE, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        constraints = [models.UniqueConstraint(fields=["name", "institute"], name="unique_sub_centre_per_institute")]

    def __str__(self):
        return self.name


class Department(models.Model):
    name = models.CharField(max_length=255, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Role(models.Model):
    key = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=120)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class FundingAgency(models.Model):
    name = models.CharField(max_length=255, unique=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class FundingType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class UserAccountManager(BaseUserManager):
   

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("An email address is required.")

        email = self.normalize_email(email)

        user = self.model(
            email=email,
            **extra_fields
        )

        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")

        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class UserAccount(AbstractBaseUser, PermissionsMixin):

    ROLE_CHOICES = [
        ("system_admin", "System Admin"),
        ("value_chain_lead", "Value Chain Lead"),
        ("accountant", "Accountant"),
        ("project_coordinator", "Project-Coordinator"),
        ("me", "M&E"),
        ("principal_investigator", "Principal Investigator"),
        ("co_principal_investigator", "Co-principal investigator"),
        ("staff_user", "Staff User"),
    ]

    # User identification
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)

    # Application roles
    role = models.CharField(
        max_length=50,
        choices=ROLE_CHOICES
    )

    roles = models.ManyToManyField(
        Role,
        blank=True,
        related_name="users"
    )

    # Organizational information
    personal_number = models.CharField(
        max_length=100,
        blank=True
    )

    institute = models.CharField(max_length=255)

    institute_reference = models.ForeignKey(
        Institute,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="users"
    )

    centre = models.ForeignKey(
        Centre,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="users"
    )

    sub_centre = models.ForeignKey(
        SubCentre,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="users"
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="users"
    )

    value_chains = models.ManyToManyField(
        "ValueChain",
        blank=True,
        related_name="value_chain_leads"
    )

    # Django authentication and access control
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Custom manager
    objects = UserAccountManager()

    # Authentication configuration
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    class Meta:
        ordering = ["full_name"]
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return f"{self.full_name} <{self.email}>"

    def get_full_name(self):
        return self.full_name

    def get_short_name(self):
        return self.full_name.split()[0] if self.full_name else self.email


class UserSession(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sessions"
    )

    token = models.CharField(
        max_length=128,
        unique=True,
        db_index=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    last_used_at = models.DateTimeField(auto_now=True)

    revoked_at = models.DateTimeField(
        null=True,
        blank=True
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Session for {self.user.email}"



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
