from rest_framework import serializers

from .models import Course, Subject


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ("id", "name", "slug")


class CourseSerializer(serializers.ModelSerializer):
    subject = SubjectSerializer(read_only=True)
    mode_display = serializers.CharField(source="get_mode_display", read_only=True)
    seats_left = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = (
            "id", "title", "slug", "subject", "mode", "mode_display", "description",
            "instructor", "fee", "duration_weeks", "start_date", "location",
            "seats", "seats_left",
        )

    def get_seats_left(self, obj):
        if obj.seats is None:
            return None
        taken = obj.enrollments.filter(status="paid").count()
        return max(obj.seats - taken, 0)
