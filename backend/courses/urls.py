from django.urls import path

from .views import CourseDetailView, CourseListView, SubjectListView

urlpatterns = [
    path("subjects/", SubjectListView.as_view(), name="subject-list"),
    path("courses/", CourseListView.as_view(), name="course-list"),
    path("courses/<slug:slug>/", CourseDetailView.as_view(), name="course-detail"),
]
