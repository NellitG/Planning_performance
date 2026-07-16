from django.contrib import admin

from .models import (
    ExpectedOutput,
    ActivityIndicator,
    IndicatorTracking,
    KeyActivity,
    KeyResultArea,
    MainActivity,
    OutputIndicator,
    Project,
    ProjectComponent,
    ProjectDocument,
    ProjectMapping,
    ProjectSubComponent,
    Strategy,
    StrategicObjective,
    SubActivity,
    SubSubActivity,
    TechnicalReport,
)

admin.site.register(Project)
admin.site.register(KeyResultArea)
admin.site.register(StrategicObjective)
admin.site.register(Strategy)
admin.site.register(KeyActivity)
admin.site.register(ExpectedOutput)
admin.site.register(OutputIndicator)
admin.site.register(ProjectDocument)
admin.site.register(ProjectMapping)
admin.site.register(ProjectComponent)
admin.site.register(ProjectSubComponent)
admin.site.register(IndicatorTracking)
admin.site.register(MainActivity)
admin.site.register(SubActivity)
admin.site.register(SubSubActivity)
admin.site.register(ActivityIndicator)
admin.site.register(TechnicalReport)
