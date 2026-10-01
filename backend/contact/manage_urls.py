from rest_framework.routers import DefaultRouter

from .manage import ContactMessageManageViewSet

router = DefaultRouter()
router.register("contact-messages", ContactMessageManageViewSet, basename="manage-contact-message")

urlpatterns = router.urls
