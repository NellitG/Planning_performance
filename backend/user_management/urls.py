from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DepartmentViewSet, FundingAgencyViewSet, ReferenceDataViewSet, RoleViewSet, StrategicPlanDocumentViewSet, UserAccountViewSet, ValueChainViewSet, login, logout, me

router = DefaultRouter()
router.register(r"users", UserAccountViewSet, basename="user-management-users")
router.register(r"value-chains", ValueChainViewSet, basename="user-management-value-chains")
router.register(r"roles", RoleViewSet, basename="user-management-roles")
router.register(r"funding-agencies", FundingAgencyViewSet, basename="user-management-funding-agencies")
router.register(r"reference-data", ReferenceDataViewSet, basename="user-management-reference-data")
router.register(r"departments", DepartmentViewSet, basename="user-management-departments")
router.register(
    r"strategic-plan-documents",
    StrategicPlanDocumentViewSet,
    basename="user-management-strategic-plan-documents",
)

urlpatterns = [
    path("auth/login/", login),
    path("auth/logout/", logout),
    path("auth/me/", me),
    path("user-management/", include(router.urls)),
]
