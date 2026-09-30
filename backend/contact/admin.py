from django.contrib import admin

from .models import ContactMessage


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "is_handled", "created_at")
    list_filter = ("is_handled",)
    search_fields = ("name", "email", "message")
    readonly_fields = ("name", "email", "message", "created_at")
