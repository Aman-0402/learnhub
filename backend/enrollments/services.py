from django.utils import timezone

from .models import Enrollment


def mark_paid(enrollment, payment_ref):
    """Record a successful payment. Idempotent: safe to call twice for the same enrollment."""
    if enrollment.status == Enrollment.Status.PAID:
        return enrollment
    enrollment.status = Enrollment.Status.PAID
    enrollment.payment_ref = payment_ref
    enrollment.paid_at = timezone.now()
    enrollment.save(update_fields=["status", "payment_ref", "paid_at"])
    return enrollment


def mark_failed(enrollment):
    """Record a failed payment, but never downgrade one that is already paid."""
    if enrollment.status == Enrollment.Status.PENDING:
        enrollment.status = Enrollment.Status.FAILED
        enrollment.save(update_fields=["status"])
    return enrollment


def batch_is_full(batch):
    return batch.seats is not None and batch.enrollments.filter(status=Enrollment.Status.PAID).count() >= batch.seats
