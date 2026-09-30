from datetime import date, timedelta, datetime, time
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from courses.models import Batch, Course, Instructor, Lesson, Subject

INSTRUCTORS = {
    "Dr. Meera Nair": "Mathematics Teacher, 12 years of experience",
    "Rohan Verma": "Physics and Science Educator",
    "Sara Thomas": "English Communication Coach",
    "Kabir Shah": "Software Engineer and Trainer",
}

DEMO = [
    ("Mathematics", "Algebra Foundations", "online", "1499", 6, "", "Dr. Meera Nair"),
    ("Mathematics", "Geometry Workshop", "offline", "2499", 4, "Vadodara Centre", "Dr. Meera Nair"),
    ("Science", "Physics Made Simple", "hybrid", "1999", 8, "Vadodara Centre", "Rohan Verma"),
    ("English", "Spoken English Bootcamp", "online", "999", 4, "", "Sara Thomas"),
    ("Computer Science", "Python for Beginners", "online", "2999", 8, "", "Kabir Shah"),
    ("Computer Science", "Web Development with React", "hybrid", "4999", 12, "Vadodara Centre", "Kabir Shah"),
]

LESSONS = [
    ("Welcome and course roadmap", "video", 15),
    ("Core concepts, part 1", "video", 40),
    ("Practice worksheet", "assignment", 30),
    ("Live doubt-clearing class", "live", 60),
]


class Command(BaseCommand):
    help = "Create demo subjects, instructors, courses and lessons for local development."

    def handle(self, *args, **opts):
        people = {}
        for name, headline in INSTRUCTORS.items():
            people[name], _ = Instructor.objects.get_or_create(
                name=name, defaults={"headline": headline, "bio": f"{name} teaches with a focus on clear explanations and practice."}
            )
        created = 0
        for i, (subj, title, mode, fee, weeks, loc, teacher) in enumerate(DEMO):
            subject, _ = Subject.objects.get_or_create(name=subj)
            start = date.today() + timedelta(days=14 + 7 * i)
            course, was_created = Course.objects.get_or_create(
                title=title,
                defaults=dict(
                    subject=subject, mode=mode, fee=Decimal(fee), duration_weeks=weeks,
                    location=loc, instructor=people[teacher],
                    description=f"{title}: a structured {weeks}-week course with practice and feedback.",
                    start_date=start, seats=30 if mode != "online" else None,
                ),
            )
            created += was_created
            if was_created:
                offline = mode != "online"
                Batch.objects.create(course=course, label="Weekday evenings", days="Mon,Wed,Fri", start_time=time(18, 0), end_time=time(19, 30),
                                     format="Online, with in-person Fridays" if mode == "hybrid" else "In person" if offline else "Online",
                                     seats=30 if offline else None)
                Batch.objects.create(course=course, label="Weekend mornings", days="Sat,Sun", start_time=time(10, 0), end_time=time(12, 0),
                                     format="In person" if offline else "Online", seats=30 if offline else None)
                for n, (lt, kind, mins) in enumerate(LESSONS, start=1):
                    session = None
                    if kind == "live":
                        session = timezone.make_aware(datetime.combine(start + timedelta(days=7), time(18, 0)))
                    Lesson.objects.create(
                        course=course, title=lt, kind=kind, order=n, duration_minutes=mins,
                        description=f"{lt} for {title}.", session_at=session,
                        url="https://example.com/replace-me" if kind != "live" else "",
                    )
        self.stdout.write(self.style.SUCCESS(f"Seeded {created} new course(s)."))
