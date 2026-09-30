from rest_framework import serializers

from .models import Course, Instructor, Lesson, Subject


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

    class Meta:
        model = Course
        fields = (
            "id", "title", "slug", "subject", "mode", "mode_display", "description",
            "instructor", "instructor_slug", "fee", "duration_weeks", "start_date",
            "location", "seats", "seats_left",
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


class LessonSerializer(serializers.ModelSerializer):
    kind_display = serializers.CharField(source="get_kind_display", read_only=True)

    class Meta:
        model = Lesson
        fields = ("id", "title", "kind", "kind_display", "order", "description", "url", "session_at", "duration_minutes")
