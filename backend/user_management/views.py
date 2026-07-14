from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from .models import StrategicPlanDocument, UserAccount, ValueChain
from .permissions import UserManagementPermission
from .serializers import (
    StrategicPlanDocumentSerializer,
    UserAccountSerializer,
    ValueChainSerializer,
)


class UserAccountViewSet(viewsets.ModelViewSet):
    queryset = UserAccount.objects.all()
    serializer_class = UserAccountSerializer
    permission_classes = [UserManagementPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["role", "institute", "is_active"]
    search_fields = ["full_name", "email", "role", "institute"]
    ordering_fields = ["full_name", "email", "role", "institute", "is_active", "created_at", "updated_at"]


class ValueChainViewSet(viewsets.ModelViewSet):
    queryset = ValueChain.objects.all()
    serializer_class = ValueChainSerializer
    permission_classes = [UserManagementPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["category", "priority", "is_active"]
    search_fields = ["name", "category", "priority"]
    ordering_fields = ["name", "category", "priority", "is_active", "created_at", "updated_at"]


class StrategicPlanDocumentViewSet(viewsets.ModelViewSet):
    queryset = StrategicPlanDocument.objects.all()
    serializer_class = StrategicPlanDocumentSerializer
    permission_classes = [UserManagementPermission]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["document_title", "uploaded_by"]
    ordering_fields = ["document_title", "date_uploaded", "updated_at", "uploaded_by"]
