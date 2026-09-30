from datetime import date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand

from courses.models import Course, Subject

DEMO = [
    ("Mathematics", "Algebra Foundations", "online", "1499", 6, ""),
    ("Mathematics", "Geometry Workshop", "offline", "2499", 4, "Vadodara Centre"),
    ("Science", "Physics Made Simple", "hybrid", "1999", 8, "Vadodara Centre"),
    ("English", "Spoken English Bootcamp", "online", "999", 4, ""),
    ("Computer Science", "Python for Beginners", "online", "2999", 8, ""),
    ("Computer Science", "Web Development with React", "hybrid", "4999", 12, "Vadodara Centre"),
]


class Command(BaseCommand):
    help = "Create demo subjects and courses for local development."

    def handle(self, *args, **opts):
        created = 0
        for i, (subj, title, mode, fee, weeks, loc) in enumerate(DEMO):
            subject, _ = Subject.objects.get_or_create(name=subj)
            _, was_created = Course.objects.get_or_create(
                title=title,
                defaults=dict(
                    subject=subject, mode=mode, fee=Decimal(fee), duration_weeks=weeks,
                    location=loc, instructor="LearnHub Faculty",
                    description=f"{title}: a structured {weeks}-week course with practice and feedback.",
                    start_date=date.today() + timedelta(days=14 + 7 * i),
                    seats=30 if mode != "online" else None,
                ),
            )
            created += was_created
        self.stdout.write(self.style.SUCCESS(f"Seeded {created} new course(s)."))
