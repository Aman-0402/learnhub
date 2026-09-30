from django.contrib import admin

from .models import Enrollment


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ("student", "course", "status", "amount", "paid_at", "created_at")
    list_filter = ("status", "course__subject", "course__mode")
    search_fields = ("student__email", "student__full_name", "course__title", "payment_ref")
    readonly_fields = ("reference", "created_at", "paid_at")
