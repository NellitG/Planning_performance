from django.contrib import admin

from .models import Centre, County, Institute, StrategicPlanDocument, SubCentre, UserAccount, ValueChain

admin.site.register(County)
admin.site.register(Institute)
admin.site.register(Centre)
admin.site.register(SubCentre)


@admin.register(UserAccount)
class UserAccountAdmin(admin.ModelAdmin):
    list_display = ("full_name", "email", "role", "institute", "is_active", "created_at")
    list_filter = ("role", "institute", "is_active")
    search_fields = ("full_name", "email", "institute")


@admin.register(ValueChain)
class ValueChainAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "priority", "is_active", "created_at")
    list_filter = ("category", "priority", "is_active")
    search_fields = ("name",)


@admin.register(StrategicPlanDocument)
class StrategicPlanDocumentAdmin(admin.ModelAdmin):
    list_display = ("document_title", "uploaded_by", "date_uploaded")
    search_fields = ("document_title", "uploaded_by")
