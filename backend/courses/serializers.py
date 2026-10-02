from rest_framework import serializers

from .models import Batch, Course, Instructor, Lesson, Subject


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ("id", "name", "slug")


class CourseBriefSerializer(serializers.ModelSerializer):
    """Compact course shape used inside instructor profiles."""

    class Meta:
        model = Course
        fields = ("id", "title", "slug", "mode", "fee")


class InstructorSerializer(serializers.ModelSerializer):
    subjects = serializers.SerializerMethodField()
    courses = serializers.SerializerMethodField()

    class Meta:
        model = Instructor
        fields = ("id", "name", "slug", "headline", "bio", "subjects", "courses")

    def _published(self, obj):
        return [c for c in obj.courses.all() if c.is_published]

    def get_subjects(self, obj):
        return sorted({c.subject.name for c in self._published(obj)})

    def get_courses(self, obj):
        return CourseBriefSerializer(self._published(obj), many=True).data


class CourseSerializer(serializers.ModelSerializer):
    subject = SubjectSerializer(read_only=True)
    mode_display = serializers.CharField(source="get_mode_display", read_only=True)
    instructor = serializers.SerializerMethodField()
    instructor_slug = serializers.SerializerMethodField()
    seats_left = serializers.SerializerMethodField()
    lesson_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = (
            "id", "title", "slug", "subject", "mode", "mode_display", "description",
            "instructor", "instructor_slug", "fee", "duration_weeks", "start_date",
            "location", "seats", "seats_left", "lesson_count",
        )

    def get_instructor(self, obj):
        return obj.instructor.name if obj.instructor else ""

    def get_instructor_slug(self, obj):
        return obj.instructor.slug if obj.instructor else ""

    def get_seats_left(self, obj):
        if obj.seats is None:
            return None
        taken = obj.enrollments.filter(status="paid").count()
        return max(obj.seats - taken, 0)

    def get_lesson_count(self, obj):
        # Annotated on the list/detail querysets to avoid a query per row; falls back
        # to a direct count for the few places that build a Course queryset themselves
        # (e.g. the per-student enrollments list, which is already a handful of rows).
        if hasattr(obj, "lesson_count"):
            return obj.lesson_count
        return obj.lessons.filter(is_published=True).count()


class LessonSerializer(serializers.ModelSerializer):
    kind_display = serializers.CharField(source="get_kind_display", read_only=True)
    video_url = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ("id", "title", "kind", "kind_display", "order", "description", "url", "video_url", "session_at", "duration_minutes")

    def get_video_url(self, obj):
        if not obj.video:
            return ""
        request = self.context.get("request")
        return request.build_absolute_uri(obj.video.url) if request else obj.video.url


class SyllabusLessonSerializer(serializers.ModelSerializer):
    """Public preview of a lesson: what it covers, not the content itself. No url/video_url
    here on purpose — those stay behind a paid enrollment (see CourseLessonsView)."""

    kind_display = serializers.CharField(source="get_kind_display", read_only=True)

    class Meta:
        model = Lesson
        fields = ("id", "title", "kind", "kind_display", "order", "description", "duration_minutes")


class BatchSerializer(serializers.ModelSerializer):
    days = serializers.SerializerMethodField()
    start_time = serializers.TimeField(format="%H:%M")
    end_time = serializers.TimeField(format="%H:%M")
    start_date = serializers.SerializerMethodField()
    format = serializers.SerializerMethodField()
    seats_left = serializers.SerializerMethodField()

    class Meta:
        model = Batch
        fields = ("id", "label", "days", "start_time", "end_time", "start_date", "format", "seats_left")

    def get_days(self, obj):
        return obj.days_list

    def get_start_date(self, obj):
        d = obj.start_date or obj.course.start_date
        return d.isoformat() if d else None

    def get_format(self, obj):
        return obj.format or obj.course.get_mode_display()

    def get_seats_left(self, obj):
        if obj.seats is None:
            return None
        return max(obj.seats - obj.enrollments.filter(status="paid").count(), 0)
