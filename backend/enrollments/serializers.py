from rest_framework import serializers

from courses.serializers import BatchSerializer, CourseSerializer

from .models import Enrollment


class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    batch = BatchSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = ("id", "reference", "course", "batch", "status", "amount", "payment_ref", "created_at", "paid_at")
        read_only_fields = fields


class EnrollCreateSerializer(serializers.Serializer):
    course = serializers.IntegerField()
    batch = serializers.IntegerField(required=False, allow_null=True)
