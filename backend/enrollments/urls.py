from django.urls import path

from .views import EnrollView, MyEnrollmentsView, PayView

urlpatterns = [
    path("enroll/", EnrollView.as_view(), name="enroll"),
    path("enrollments/<uuid:reference>/pay/", PayView.as_view(), name="enrollment-pay"),
    path("my-courses/", MyEnrollmentsView.as_view(), name="my-courses"),
]
