from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ExpectedOutputViewSet,
    IndicatorTrackingViewSet,
    KeyActivityViewSet,
    KeyResultAreaViewSet,
    MainActivityIndicatorViewSet,
    MainActivityViewSet,
    OutputIndicatorViewSet,
    OutcomeIndicatorViewSet,
    OutcomeViewSet,
    ProjectDocumentViewSet,
    ProjectMappingViewSet,
    ProjectViewSet,
    StrategicObjectiveViewSet,
    StrategyViewSet,
    SubActivityViewSet,
    SubSubActivityViewSet,
    TechnicalReportViewSet,
)

router = DefaultRouter()
router.register(r"projects", ProjectViewSet)
router.register(r"kras", KeyResultAreaViewSet)
router.register(r"strategic-objectives", StrategicObjectiveViewSet)
router.register(r"strategies", StrategyViewSet)
router.register(r"key-activities", KeyActivityViewSet)
router.register(r"expected-outputs", ExpectedOutputViewSet)
router.register(r"output-indicators", OutputIndicatorViewSet)
router.register(r"outcomes", OutcomeViewSet)
router.register(r"outcome-indicators", OutcomeIndicatorViewSet)
router.register(r"project-documents", ProjectDocumentViewSet)
router.register(r"project-mappings", ProjectMappingViewSet)
router.register(r"indicator-tracking", IndicatorTrackingViewSet)
router.register(r"main-activities", MainActivityViewSet)
router.register(r"main-activity-indicators", MainActivityIndicatorViewSet)
router.register(r"sub-activities", SubActivityViewSet)
router.register(r"sub-sub-activities", SubSubActivityViewSet)
router.register(r"technical-reports", TechnicalReportViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
