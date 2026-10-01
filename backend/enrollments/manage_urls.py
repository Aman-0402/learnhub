from rest_framework.routers import DefaultRouter

from .manage import EnrollmentManageViewSet

router = DefaultRouter()
router.register("enrollments", EnrollmentManageViewSet, basename="manage-enrollment")

urlpatterns = router.urls
