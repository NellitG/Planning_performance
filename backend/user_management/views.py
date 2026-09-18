from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth.hashers import check_password
from django.utils import timezone
from rest_framework import filters, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from .models import Centre, County, Department, FundingAgency, Institute, Role, StrategicPlanDocument, SubCentre, UserAccount, UserSession, ValueChain
from .authentication import create_session
from .permissions import UserManagementPermission
from .serializers import (
    StrategicPlanDocumentSerializer,
    UserAccountSerializer,
    ValueChainSerializer,
    CountyHierarchySerializer,
    DepartmentSerializer,
    FundingAgencySerializer,
    RoleSerializer,
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
    queryset = UserAccount.objects.prefetch_related("roles", "value_chains").all()
    serializer_class = UserAccountSerializer
    permission_classes = [UserManagementPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["role", "roles", "institute", "is_active"]
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


class RoleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [UserManagementPermission]


class FundingAgencyViewSet(viewsets.ModelViewSet):
    queryset = FundingAgency.objects.all()
    serializer_class = FundingAgencySerializer
    permission_classes = [UserManagementPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["active"]
    search_fields = ["name"]
    ordering_fields = ["name", "active", "created_at", "updated_at"]


class StrategicPlanDocumentViewSet(viewsets.ModelViewSet):
    queryset = StrategicPlanDocument.objects.all()
    serializer_class = StrategicPlanDocumentSerializer
    permission_classes = [UserManagementPermission]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["document_title", "uploaded_by"]
    ordering_fields = ["document_title", "date_uploaded", "updated_at", "uploaded_by"]


def _account_payload(account):
    return {"id": account.id, "email": account.email, "name": account.full_name,
            "roles": list(account.roles.values_list("key", flat=True)) or [account.role]}


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    email, password = request.data.get("email", "").strip().lower(), request.data.get("password", "")
    account = UserAccount.objects.prefetch_related("roles").filter(email__iexact=email, is_active=True).first()
    if not account or not check_password(password, account.password):
        return Response({"detail": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)
    session = create_session(account)
    return Response({"token": session.token, "user": _account_payload(account)})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    UserSession.objects.filter(token=request.auth, revoked_at__isnull=True).update(revoked_at=timezone.now())
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response({"user": _account_payload(request.user.account)})
