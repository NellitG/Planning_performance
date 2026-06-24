from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BaselineViewSet,
    ExpectedOutputViewSet,
    IndicatorTrackingViewSet,
    KeyActivityViewSet,
    KeyResultAreaViewSet,
    OutputIndicatorViewSet,
    ProjectDocumentViewSet,
    ProjectMappingViewSet,
    ProjectViewSet,
    StrategicObjectiveViewSet,
    StrategyViewSet,
)

router = DefaultRouter()
router.register(r"projects", ProjectViewSet)
router.register(r"kras", KeyResultAreaViewSet)
router.register(r"strategic-objectives", StrategicObjectiveViewSet)
router.register(r"strategies", StrategyViewSet)
router.register(r"key-activities", KeyActivityViewSet)
router.register(r"expected-outputs", ExpectedOutputViewSet)
router.register(r"output-indicators", OutputIndicatorViewSet)
router.register(r"baselines", BaselineViewSet)
router.register(r"project-documents", ProjectDocumentViewSet)
router.register(r"project-mappings", ProjectMappingViewSet)
router.register(r"indicator-tracking", IndicatorTrackingViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
