from rest_framework.routers import DefaultRouter

from .manage import (
    BatchManageViewSet, CourseManageViewSet, InstructorManageViewSet, LessonManageViewSet, SubjectManageViewSet,
)

router = DefaultRouter()
router.register("subjects", SubjectManageViewSet, basename="manage-subject")
router.register("instructors", InstructorManageViewSet, basename="manage-instructor")
router.register("courses", CourseManageViewSet, basename="manage-course")
router.register("batches", BatchManageViewSet, basename="manage-batch")
router.register("lessons", LessonManageViewSet, basename="manage-lesson")

urlpatterns = router.urls
