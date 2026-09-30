from django.contrib import admin

from .models import Course, Subject


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name",)


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("title", "subject", "mode", "fee", "start_date", "seats", "is_published")
    list_filter = ("mode", "subject", "is_published")
    search_fields = ("title", "instructor")
