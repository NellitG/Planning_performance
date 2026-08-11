from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from .models import Centre, County, Department, Institute, StrategicPlanDocument, SubCentre, UserAccount, ValueChain
from .permissions import UserManagementPermission
from .serializers import (
    StrategicPlanDocumentSerializer,
    UserAccountSerializer,
    ValueChainSerializer,
    CountyHierarchySerializer,
    DepartmentSerializer,
)


class ReferenceDataViewSet(viewsets.ReadOnlyModelViewSet):
    """County-first organisational hierarchy imported from KALRO Table 2."""
    serializer_class = CountyHierarchySerializer
    permission_classes = [UserManagementPermission]
    queryset = County.objects.prefetch_related(
        "institutes__centres__sub_centres__county",
        "institutes__sub_centres__county",
    ).all()

    def get_queryset(self):
        return self.queryset.filter(institutes__isnull=False).distinct()


class DepartmentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = DepartmentSerializer
    permission_classes = [UserManagementPermission]
    queryset = Department.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name"]
    ordering_fields = ["name"]


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
