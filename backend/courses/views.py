from django.db.models import Q
from rest_framework import generics, permissions

from .models import Course, Subject
from .serializers import CourseSerializer, SubjectSerializer


class SubjectListView(generics.ListAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class CourseListView(generics.ListAPIView):
    serializer_class = CourseSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Course.objects.filter(is_published=True).select_related("subject")
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
    queryset = Course.objects.filter(is_published=True).select_related("subject")
    serializer_class = CourseSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
