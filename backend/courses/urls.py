from django.urls import path

from .views import (
    CourseBatchesView, CourseDetailView, CourseLessonsView, CourseListView,
    InstructorDetailView, InstructorListView, SubjectListView,
)

urlpatterns = [
    path("subjects/", SubjectListView.as_view(), name="subject-list"),
    path("instructors/", InstructorListView.as_view(), name="instructor-list"),
    path("instructors/<slug:slug>/", InstructorDetailView.as_view(), name="instructor-detail"),
    path("courses/", CourseListView.as_view(), name="course-list"),
    path("courses/<slug:slug>/", CourseDetailView.as_view(), name="course-detail"),
    path("courses/<slug:slug>/batches/", CourseBatchesView.as_view(), name="course-batches"),
    path("courses/<slug:slug>/lessons/", CourseLessonsView.as_view(), name="course-lessons"),
]
