from django.contrib.auth.hashers import make_password
from rest_framework import serializers

from .models import StrategicPlanDocument, UserAccount, ValueChain


class UserAccountSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(source="full_name")
    active = serializers.BooleanField(source="is_active", required=False, default=True)
    status = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=8)

    class Meta:
        model = UserAccount
        fields = [
            "id",
            "fullName",
            "email",
            "role",
            "institute",
            "password",
            "active",
            "status",
            "createdAt",
            "updatedAt",
        ]

    def get_status(self, obj):
        return "Active" if obj.is_active else "Inactive"

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
        institute = attrs.get("institute", getattr(self.instance, "institute", "")).strip()
        password = attrs.get("password")

        if not full_name:
            raise serializers.ValidationError({"fullName": "Full name is required."})
        if not institute:
            raise serializers.ValidationError({"institute": "Institute is required."})
        if not self.instance and not password:
            raise serializers.ValidationError({"password": "Password is required."})

        attrs["full_name"] = full_name
        attrs["institute"] = institute
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data["password"] = make_password(password)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        if password:
            instance.password = make_password(password)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
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
