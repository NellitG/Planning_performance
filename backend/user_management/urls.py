from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ReferenceDataViewSet, StrategicPlanDocumentViewSet, UserAccountViewSet, ValueChainViewSet

router = DefaultRouter()
router.register(r"users", UserAccountViewSet, basename="user-management-users")
router.register(r"value-chains", ValueChainViewSet, basename="user-management-value-chains")
router.register(r"reference-data", ReferenceDataViewSet, basename="user-management-reference-data")
router.register(
    r"strategic-plan-documents",
    StrategicPlanDocumentViewSet,
    basename="user-management-strategic-plan-documents",
)

urlpatterns = [
    path("user-management/", include(router.urls)),
]
