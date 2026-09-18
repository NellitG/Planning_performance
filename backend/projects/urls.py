from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ActivityIndicatorViewSet,
    ExpectedOutputViewSet,
    IndicatorTrackingViewSet,
    KeyActivityViewSet,
    KeyResultAreaViewSet,
    MainActivityIndicatorViewSet,
    MainActivityViewSet,
    OutputIndicatorViewSet,
    OutcomeIndicatorViewSet,
    OutcomeViewSet,
    ProjectDocumentFileViewSet,
    ProjectDocumentViewSet,
    ProjectComponentViewSet,
    ProjectMappingViewSet,
    ProjectSubComponentViewSet,
    ProjectOutputViewSet,
    ProjectViewSet,
    MainProjectViewSet,
    StrategicObjectiveViewSet,
    StrategyViewSet,
    SubActivityViewSet,
    SubSubActivityViewSet,
    TechnicalReportViewSet,
    kenya_counties_map,
    geography,
)

router = DefaultRouter()
router.register(r"projects", ProjectViewSet)
router.register(r"main-projects", MainProjectViewSet)
router.register(r"kras", KeyResultAreaViewSet)
router.register(r"strategic-objectives", StrategicObjectiveViewSet)
router.register(r"strategies", StrategyViewSet)
router.register(r"key-activities", KeyActivityViewSet)
router.register(r"expected-outputs", ExpectedOutputViewSet)
router.register(r"output-indicators", OutputIndicatorViewSet)
router.register(r"outcomes", OutcomeViewSet)
router.register(r"outcome-indicators", OutcomeIndicatorViewSet)
router.register(r"project-documents", ProjectDocumentViewSet)
router.register(r"project-document-files", ProjectDocumentFileViewSet)
router.register(r"project-mappings", ProjectMappingViewSet)
router.register(r"project-components", ProjectComponentViewSet)
router.register(r"project-sub-components", ProjectSubComponentViewSet)
router.register(r"project-outputs", ProjectOutputViewSet)
router.register(r"indicator-tracking", IndicatorTrackingViewSet)
router.register(r"main-activities", MainActivityViewSet)
router.register(r"main-activity-indicators", MainActivityIndicatorViewSet)
router.register(r"sub-activities", SubActivityViewSet)
router.register(r"sub-sub-activities", SubSubActivityViewSet)
router.register(r"activity-indicators", ActivityIndicatorViewSet)
router.register(r"technical-reports", TechnicalReportViewSet)

urlpatterns = [
    path("kenya-counties/", kenya_counties_map, name="kenya-counties-map"),
    path("geography/", geography, name="geography"),
    path("", include(router.urls)),
]
