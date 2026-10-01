from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from courses.sitemap import sitemap_xml

from .manage_overview import OverviewView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("sitemap.xml", sitemap_xml),
    path("api/auth/", include("accounts.urls")),
    path("api/manage/overview/", OverviewView.as_view()),
    path("api/manage/", include("accounts.manage_urls")),
    path("api/manage/", include("courses.manage_urls")),
    path("api/manage/", include("enrollments.manage_urls")),
    path("api/manage/", include("contact.manage_urls")),
    path("api/", include("courses.urls")),
    path("api/", include("enrollments.urls")),
    path("api/", include("contact.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
