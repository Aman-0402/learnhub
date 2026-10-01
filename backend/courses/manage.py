"""Staff-only API used by the frontend admin area (mounted at /api/manage/)."""
from django.db.models import Count, ProtectedError, Q
from rest_framework import serializers, status, viewsets
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from accounts.permissions import IsStaffRole

from .models import WEEKDAYS, Batch, Course, Instructor, Lesson, Subject, validate_days


class ManagePagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200


# ---------- serializers ----------

class SubjectManageSerializer(serializers.ModelSerializer):
    course_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Subject
        fields = ("id", "name", "slug", "course_count")
        read_only_fields = ("slug",)


class InstructorManageSerializer(serializers.ModelSerializer):
    course_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Instructor
        fields = ("id", "name", "slug", "headline", "bio", "email", "is_active", "course_count")
        read_only_fields = ("slug",)


class CourseManageSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    instructor_name = serializers.CharField(source="instructor.name", read_only=True, default="")
    paid_count = serializers.IntegerField(read_only=True)
    enrollment_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Course
        fields = (
            "id", "title", "slug", "subject", "subject_name", "mode", "description", "instructor", "instructor_name",
            "fee", "duration_weeks", "start_date", "location", "seats", "is_published", "created_at",
            "paid_count", "enrollment_count",
        )
        read_only_fields = ("slug", "created_at")

    def validate_fee(self, value):
        if value < 0:
            raise serializers.ValidationError("Fee cannot be negative.")
        return value

    def validate_duration_weeks(self, value):
        if value < 1:
            raise serializers.ValidationError("Duration must be at least 1 week.")
        return value

    def validate(self, attrs):
        get = lambda k: attrs.get(k, getattr(self.instance, k, None))  # noqa: E731
        if get("mode") in ("offline", "hybrid") and not (get("location") or "").strip():
            raise serializers.ValidationError({"location": "Location is required for offline and hybrid courses."})
        seats = get("seats")
        if self.instance and seats is not None:
            paid = self.instance.enrollments.filter(status="paid").count()
            if seats < paid:
                raise serializers.ValidationError({"seats": f"{paid} seats are already paid for."})
        return attrs


class DaysField(serializers.Field):
    """Days as a list in the API ("Mon", "Wed"), stored as comma-separated text."""

    def to_representation(self, value):
        chosen = {d.strip() for d in value.split(",")}
        return [d for d in WEEKDAYS if d in chosen]

    def to_internal_value(self, data):
        if isinstance(data, str):
            data = data.split(",")
        if not isinstance(data, list):
            raise serializers.ValidationError("Send a list of days.")
        text = ",".join(str(d).strip() for d in data if str(d).strip())
        try:
            validate_days(text)
        except Exception as e:  # django ValidationError
            raise serializers.ValidationError(getattr(e, "messages", [str(e)])[0])
        chosen = set(text.split(","))
        return ",".join(d for d in WEEKDAYS if d in chosen)


class BatchManageSerializer(serializers.ModelSerializer):
    days = DaysField()
    course_title = serializers.CharField(source="course.title", read_only=True)
    paid_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Batch
        fields = ("id", "course", "course_title", "label", "days", "start_time", "end_time", "start_date",
                  "format", "seats", "is_active", "paid_count")

    def validate(self, attrs):
        start = attrs.get("start_time", getattr(self.instance, "start_time", None))
        end = attrs.get("end_time", getattr(self.instance, "end_time", None))
        if start and end and end <= start:
            raise serializers.ValidationError({"end_time": "End time must be after the start time."})
        seats = attrs.get("seats", getattr(self.instance, "seats", None))
        if self.instance and seats is not None:
            paid = self.instance.enrollments.filter(status="paid").count()
            if seats < paid:
                raise serializers.ValidationError({"seats": f"{paid} seats are already paid for."})
        return attrs


class LessonManageSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="course.title", read_only=True)

    class Meta:
        model = Lesson
        fields = ("id", "course", "course_title", "title", "kind", "order", "description", "url", "session_at",
                  "duration_minutes", "is_published")


# ---------- views ----------

class ManageViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaffRole]
    pagination_class = ManagePagination

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "This item is still in use and cannot be deleted. For a course with enrollments, unpublish it instead."},
                status=status.HTTP_409_CONFLICT,
            )


class SubjectManageViewSet(ManageViewSet):
    serializer_class = SubjectManageSerializer

    def get_queryset(self):
        return Subject.objects.annotate(course_count=Count("courses")).order_by("name")


class InstructorManageViewSet(ManageViewSet):
    serializer_class = InstructorManageSerializer

    def get_queryset(self):
        return Instructor.objects.annotate(course_count=Count("courses")).order_by("name")


class CourseManageViewSet(ManageViewSet):
    serializer_class = CourseManageSerializer

    def get_queryset(self):
        qs = Course.objects.select_related("subject", "instructor").annotate(
            paid_count=Count("enrollments", filter=Q(enrollments__status="paid")),
            enrollment_count=Count("enrollments"),
        )
        p = self.request.query_params
        if p.get("q"):
            qs = qs.filter(Q(title__icontains=p["q"]) | Q(subject__name__icontains=p["q"]))
        if p.get("subject"):
            qs = qs.filter(subject_id=p["subject"])
        if p.get("published") in ("true", "false"):
            qs = qs.filter(is_published=p["published"] == "true")
        return qs.order_by("-created_at", "-id")


class BatchManageViewSet(ManageViewSet):
    serializer_class = BatchManageSerializer

    def get_queryset(self):
        qs = Batch.objects.select_related("course").annotate(paid_count=Count("enrollments", filter=Q(enrollments__status="paid")))
        if self.request.query_params.get("course"):
            qs = qs.filter(course_id=self.request.query_params["course"])
        return qs.order_by("course_id", "start_time", "id")


class LessonManageViewSet(ManageViewSet):
    serializer_class = LessonManageSerializer

    def get_queryset(self):
        qs = Lesson.objects.select_related("course")
        if self.request.query_params.get("course"):
            qs = qs.filter(course_id=self.request.query_params["course"])
        return qs.order_by("course_id", "order", "id")
