from django.contrib.auth.hashers import make_password
from rest_framework import serializers

from .models import Centre, County, Department, Institute, StrategicPlanDocument, SubCentre, UserAccount, ValueChain


class SubCentreSerializer(serializers.ModelSerializer):
    county = serializers.CharField(source="county.name")

    class Meta:
        model = SubCentre
        fields = ["id", "name", "county"]


class CentreSerializer(serializers.ModelSerializer):
    county = serializers.CharField(source="county.name")
    subCentres = SubCentreSerializer(source="sub_centres", many=True, read_only=True)

    class Meta:
        model = Centre
        fields = ["id", "name", "county", "subCentres"]


class InstituteSerializer(serializers.ModelSerializer):
    county = serializers.CharField(source="county.name")
    centres = CentreSerializer(many=True, read_only=True)
    directSubCentres = serializers.SerializerMethodField()

    class Meta:
        model = Institute
        fields = ["id", "name", "county", "centres", "directSubCentres"]

    def get_directSubCentres(self, obj):
        return SubCentreSerializer(obj.sub_centres.filter(centre__isnull=True), many=True).data


class CountyHierarchySerializer(serializers.ModelSerializer):
    institutes = InstituteSerializer(many=True, read_only=True)

    class Meta:
        model = County
        fields = ["id", "name", "institutes"]


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "name"]


class UserAccountSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(source="full_name")
    active = serializers.BooleanField(source="is_active", required=False, default=True)
    status = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=8)
    confirmPassword = serializers.CharField(write_only=True, required=False, allow_blank=True)
    instituteId = serializers.PrimaryKeyRelatedField(source="institute_reference", queryset=Institute.objects.all(), write_only=True, required=False, allow_null=True)
    centreId = serializers.PrimaryKeyRelatedField(source="centre", queryset=Centre.objects.all(), write_only=True, required=False, allow_null=True)
    subCentreId = serializers.PrimaryKeyRelatedField(source="sub_centre", queryset=SubCentre.objects.all(), write_only=True, required=False, allow_null=True)
    departmentId = serializers.PrimaryKeyRelatedField(source="department", queryset=Department.objects.all(), write_only=True, required=False, allow_null=True)
    selectedInstituteId = serializers.IntegerField(source="institute_reference_id", read_only=True)
    selectedCentreId = serializers.IntegerField(source="centre_id", read_only=True)
    selectedSubCentreId = serializers.IntegerField(source="sub_centre_id", read_only=True)
    departmentName = serializers.CharField(source="department.name", read_only=True, allow_null=True)
    selectedDepartmentId = serializers.IntegerField(source="department_id", read_only=True)
    valueChainIds = serializers.PrimaryKeyRelatedField(
        source="value_chains", queryset=ValueChain.objects.filter(is_active=True), many=True, required=False
    )
    valueChains = serializers.SerializerMethodField()

    class Meta:
        model = UserAccount
        fields = [
            "id",
            "fullName",
            "email",
            "role",
            "institute",
            "instituteId",
            "centreId",
            "subCentreId",
            "departmentId",
            "selectedInstituteId",
            "selectedCentreId",
            "selectedSubCentreId",
            "departmentName",
            "selectedDepartmentId",
            "valueChainIds",
            "valueChains",
            "password",
            "confirmPassword",
            "active",
            "status",
            "createdAt",
            "updatedAt",
        ]

    def get_status(self, obj):
        return "Active" if obj.is_active else "Inactive"

    def get_valueChains(self, obj):
        return [{"id": str(chain.id), "name": chain.name} for chain in obj.value_chains.all()]

    def validate_email(self, value):
        qs = UserAccount.objects.filter(email__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate(self, attrs):
        attrs = super().validate(attrs)
        full_name = attrs.get("full_name", getattr(self.instance, "full_name", "")).strip()
        institute = attrs.get("institute_reference", getattr(self.instance, "institute_reference", None))
        centre = attrs.get("centre", getattr(self.instance, "centre", None))
        sub_centre = attrs.get("sub_centre", getattr(self.instance, "sub_centre", None))
        password = attrs.get("password")
        confirm_password = attrs.pop("confirmPassword", None)
        role = attrs.get("role", getattr(self.instance, "role", ""))
        value_chains = attrs.get("value_chains")
        if value_chains is None and self.instance:
            value_chains = self.instance.value_chains.all()

        if not full_name:
            raise serializers.ValidationError({"fullName": "Full name is required."})
        if not institute:
            raise serializers.ValidationError({"instituteId": "Institute is required."})
        if centre and centre.institute_id != institute.id:
            raise serializers.ValidationError({"centreId": "Select a Centre belonging to the selected Institute."})
        if sub_centre:
            if not centre or sub_centre.centre_id != centre.id:
                raise serializers.ValidationError({"subCentreId": "Select a Sub-Centre belonging to the selected Centre."})
            if sub_centre.institute_id != institute.id:
                raise serializers.ValidationError({"subCentreId": "Select a Sub-Centre belonging to the selected Institute."})
        if not self.instance and not password:
            raise serializers.ValidationError({"password": "Password is required."})
        if password and password != confirm_password:
            raise serializers.ValidationError({"confirmPassword": "Passwords do not match."})
        if role == "value_chain_leads":
            if not value_chains:
                raise serializers.ValidationError({"valueChainIds": "Please select at least one Value Chain for the Value Chain Leads role."})
        else:
            attrs["value_chains"] = []

        attrs["full_name"] = full_name
        attrs["institute"] = institute.name
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data["password"] = make_password(password)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        value_chains = validated_data.pop("value_chains", None)
        if password:
            instance.password = make_password(password)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        if value_chains is not None:
            instance.value_chains.set(value_chains)
        return instance


class ValueChainSerializer(serializers.ModelSerializer):
    active = serializers.BooleanField(source="is_active", required=False, default=True)
    status = serializers.SerializerMethodField()
    projects = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = ValueChain
        fields = [
            "id",
            "name",
            "category",
            "priority",
            "projects",
            "active",
            "status",
            "createdAt",
            "updatedAt",
        ]

    def get_status(self, obj):
        return "Active" if obj.is_active else "Inactive"

    def get_projects(self, obj):
        return 0

    def validate_name(self, value):
        name = value.strip()
        qs = ValueChain.objects.filter(name__iexact=name)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A value chain with this name already exists.")
        return name


class StrategicPlanDocumentSerializer(serializers.ModelSerializer):
    documentTitle = serializers.CharField(source="document_title")
    uploadedFile = serializers.FileField(source="uploaded_file", write_only=True, required=False)
    fileName = serializers.SerializerMethodField()
    fileUrl = serializers.SerializerMethodField()
    fileSize = serializers.SerializerMethodField()
    uploadedBy = serializers.CharField(source="uploaded_by", required=False, allow_blank=True, default="")
    dateUploaded = serializers.DateTimeField(source="date_uploaded", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = StrategicPlanDocument
        fields = [
            "id",
            "documentTitle",
            "uploadedFile",
            "fileName",
            "fileUrl",
            "fileSize",
            "uploadedBy",
            "dateUploaded",
            "updatedAt",
        ]

    def get_fileName(self, obj):
        return obj.uploaded_file.name.split("/")[-1] if obj.uploaded_file else ""

    def get_fileUrl(self, obj):
        if not obj.uploaded_file:
            return None
        request = self.context.get("request")
        url = obj.uploaded_file.url
        return request.build_absolute_uri(url) if request else url

    def get_fileSize(self, obj):
        try:
            return obj.uploaded_file.size
        except (OSError, ValueError):
            return 0

    def validate(self, attrs):
        attrs = super().validate(attrs)
        title = attrs.get("document_title", getattr(self.instance, "document_title", "")).strip()
        uploaded_file = attrs.get("uploaded_file")
        if not title:
            raise serializers.ValidationError({"documentTitle": "Document title is required."})
        if not self.instance and not uploaded_file:
            raise serializers.ValidationError({"uploadedFile": "Document file is required."})
        attrs["document_title"] = title
        return attrs
