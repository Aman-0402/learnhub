from rest_framework.routers import DefaultRouter

from .manage import UserManageViewSet

router = DefaultRouter()
router.register("users", UserManageViewSet, basename="manage-user")

urlpatterns = router.urls
