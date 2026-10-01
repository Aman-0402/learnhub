from xml.sax.saxutils import escape

from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.cache import cache_page

from .models import Course, Instructor

# Public pages of the React app that search engines should index.
STATIC_PATHS = ["/", "/courses", "/instructors", "/about", "/portfolio", "/faq", "/contact"]


def sitemap_paths():
    paths = list(STATIC_PATHS)
    paths += [f"/courses/{slug}" for slug in Course.objects.filter(is_published=True).values_list("slug", flat=True)]
    paths += [f"/instructors/{slug}" for slug in Instructor.objects.values_list("slug", flat=True)]
    return paths


@cache_page(60 * 15)
def sitemap_xml(request):
    """sitemap.xml built from the database. Addresses use FRONTEND_URL, because that is where visitors land."""
    base = settings.SITE_URL
    urls = "".join(f"<url><loc>{escape(base + p if p != '/' else base + '/')}</loc></url>" for p in sitemap_paths())
    xml = f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n'
    return HttpResponse(xml, content_type="application/xml")
