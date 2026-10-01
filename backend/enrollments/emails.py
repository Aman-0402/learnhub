from django.conf import settings
from django.utils import timezone

from accounts.emails import email_layout, send_email


def send_receipt_email(enrollment):
    """Payment receipt for a paid enrollment. Never raises."""
    course, batch, student = enrollment.course, enrollment.batch, enrollment.student
    paid = timezone.localtime(enrollment.paid_at or timezone.now())
    rows = [
        ("Receipt number", str(enrollment.reference)),
        ("Course", course.title),
        ("Format", course.get_mode_display()),
    ]
    if batch:
        rows.append(("Batch", f"{batch.label}: {', '.join(batch.days_list)}, {batch.start_time:%H:%M} to {batch.end_time:%H:%M}"))
    start = (batch.start_date if batch and batch.start_date else course.start_date)
    if start:
        rows.append(("Classes start", f"{start:%d %b %Y}"))
    rows += [("Paid on", f"{paid:%d %b %Y}"), ("Amount paid", f"INR {enrollment.amount:,.2f}")]
    text, html = email_layout(
        "Payment received. You are enrolled!",
        [f"Hi {student.full_name}, thank you for enrolling. Here is your receipt."],
        button=("Open your course", f"{settings.FRONTEND_URL}/learn/{course.slug}"),
        rows=rows,
    )
    return send_email(f"Receipt for {course.title}", student.email, text, html)
