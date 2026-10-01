from django.utils import timezone

from .emails import send_receipt_email
from .models import Enrollment


def mark_paid(enrollment, payment_ref):
    """Record a successful payment. Idempotent: safe to call twice for the same enrollment."""
    if enrollment.status == Enrollment.Status.PAID:
        return enrollment
    enrollment.status = Enrollment.Status.PAID
    enrollment.payment_ref = payment_ref
    enrollment.paid_at = timezone.now()
    enrollment.save(update_fields=["status", "payment_ref", "paid_at"])
    send_receipt_email(enrollment)  # only reached on the first payment, so retries never send a second receipt
    return enrollment


def mark_failed(enrollment):
    """Record a failed payment, but never downgrade one that is already paid."""
    if enrollment.status == Enrollment.Status.PENDING:
        enrollment.status = Enrollment.Status.FAILED
        enrollment.save(update_fields=["status"])
    return enrollment


def batch_is_full(batch):
    return batch.seats is not None and batch.enrollments.filter(status=Enrollment.Status.PAID).count() >= batch.seats


def current_month_range():
    """Start (inclusive) and end (exclusive) of the current local month, as aware datetimes.

    A plain `paid_at__year=`/`__month=` lookup extracts from the stored UTC value on MySQL
    but converts to local time first on SQLite, so the two backends disagree near a month
    boundary. A `gte`/`lt` range on the instant itself is backend-agnostic.
    """
    start = timezone.localtime(timezone.now()).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    end = start.replace(year=start.year + 1, month=1) if start.month == 12 else start.replace(month=start.month + 1)
    return start, end
