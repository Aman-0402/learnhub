from django.contrib import admin
from django.urls import include, path

from courses.sitemap import sitemap_xml

urlpatterns = [
    path("admin/", admin.site.urls),
    path("sitemap.xml", sitemap_xml),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("courses.urls")),
    path("api/", include("enrollments.urls")),
    path("api/", include("contact.urls")),
]
