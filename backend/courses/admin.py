from django.contrib import admin

from .models import Course, Instructor, Lesson, Subject


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name",)


@admin.register(Instructor)
class InstructorAdmin(admin.ModelAdmin):
    list_display = ("name", "headline", "email", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "email")


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 1
    fields = ("order", "title", "kind", "url", "session_at", "duration_minutes", "is_published")


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("title", "subject", "mode", "instructor", "fee", "start_date", "seats", "is_published")
    list_filter = ("mode", "subject", "is_published")
    search_fields = ("title", "instructor__name")
    inlines = [LessonInline]


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "kind", "order", "session_at", "is_published")
    list_filter = ("kind", "course", "is_published")
    search_fields = ("title", "course__title")
