from django.contrib import admin

from .models import (
    ExpectedOutput,
    IndicatorTracking,
    KeyActivity,
    KeyResultArea,
    OutputIndicator,
    Project,
    ProjectDocument,
    ProjectMapping,
    Strategy,
    StrategicObjective,
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
admin.site.register(IndicatorTracking)
