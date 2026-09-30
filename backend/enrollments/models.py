import uuid

from django.conf import settings
from django.db import models

from courses.models import Course


class Enrollment(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending payment"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="enrollments")
    course = models.ForeignKey(Course, on_delete=models.PROTECT, related_name="enrollments")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_ref = models.CharField(max_length=100, blank=True)
    gateway_order_id = models.CharField(max_length=100, blank=True, db_index=True)
    reference = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["student", "course"],
                condition=models.Q(status="paid"),
                name="one_paid_enrollment_per_student_course",
            )
        ]

    def __str__(self):
        return f"{self.student} -> {self.course} ({self.status})"
