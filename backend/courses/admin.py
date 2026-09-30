from django.contrib import admin

from .models import Batch, Course, Instructor, Lesson, Subject


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name",)


@admin.register(Instructor)
class InstructorAdmin(admin.ModelAdmin):
    list_display = ("name", "headline", "email", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "email")


class BatchInline(admin.TabularInline):
    model = Batch
    extra = 1
    fields = ("label", "days", "start_time", "end_time", "start_date", "format", "seats", "is_active")


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 1
    fields = ("order", "title", "kind", "url", "session_at", "duration_minutes", "is_published")


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("title", "subject", "mode", "instructor", "fee", "start_date", "seats", "is_published")
    list_filter = ("mode", "subject", "is_published")
    search_fields = ("title", "instructor__name")
    inlines = [BatchInline, LessonInline]


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "kind", "order", "session_at", "is_published")
    list_filter = ("kind", "course", "is_published")
    search_fields = ("title", "course__title")


@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = ("label", "course", "days", "start_time", "end_time", "seats", "is_active")
    list_filter = ("is_active", "course")
    search_fields = ("label", "course__title")
