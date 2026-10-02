from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from enrollments.models import Enrollment

from .models import Course, Instructor, Subject
from .serializers import BatchSerializer, CourseSerializer, InstructorSerializer, LessonSerializer, SubjectSerializer


class SubjectListView(generics.ListAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class CourseListView(generics.ListAPIView):
    serializer_class = CourseSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Course.objects.filter(is_published=True).select_related("subject", "instructor").annotate(
            lesson_count=Count("lessons", filter=Q(lessons__is_published=True), distinct=True)
        )
        p = self.request.query_params
        if p.get("subject"):
            qs = qs.filter(subject__slug=p["subject"])
        mode = p.get("mode")
        if mode in {"online", "offline"}:
            # hybrid courses appear under both online and offline
            qs = qs.filter(Q(mode=mode) | Q(mode="hybrid"))
        elif mode == "hybrid":
            qs = qs.filter(mode="hybrid")
        if p.get("q"):
            qs = qs.filter(Q(title__icontains=p["q"]) | Q(description__icontains=p["q"]))
        return qs


class CourseDetailView(generics.RetrieveAPIView):
    queryset = Course.objects.filter(is_published=True).select_related("subject", "instructor").annotate(
        lesson_count=Count("lessons", filter=Q(lessons__is_published=True), distinct=True)
    )
    serializer_class = CourseSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"


class InstructorListView(generics.ListAPIView):
    serializer_class = InstructorSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        return Instructor.objects.filter(is_active=True).prefetch_related("courses__subject")


class InstructorDetailView(generics.RetrieveAPIView):
    serializer_class = InstructorSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        return Instructor.objects.filter(is_active=True).prefetch_related("courses__subject")


class CourseLessonsView(APIView):
    """Lessons are visible only to students with a paid enrollment (and to staff)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug):
        course = get_object_or_404(Course, slug=slug, is_published=True)
        allowed = request.user.is_staff or Enrollment.objects.filter(
            student=request.user, course=course, status="paid"
        ).exists()
        if not allowed:
            return Response({"detail": "Enroll in this course to access its lessons."}, status=403)
        lessons = course.lessons.filter(is_published=True)
        return Response(LessonSerializer(lessons, many=True, context={"request": request}).data)


class CourseBatchesView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        course = get_object_or_404(Course, slug=slug, is_published=True)
        batches = course.batches.filter(is_active=True).select_related("course")
        return Response(BatchSerializer(batches, many=True).data)
