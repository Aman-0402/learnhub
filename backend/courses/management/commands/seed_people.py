from datetime import date, timedelta, datetime, time
from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from accounts.models import User
from courses.models import Batch, Course, Instructor, Lesson, Subject
from enrollments.models import Enrollment
from enrollments.services import mark_failed, mark_paid

from .seed_demo import LESSONS

PASSWORD = "Student@123"
STAFF_PASSWORD = "Staff@123"

STUDENTS = [
    "Aarav Shah", "Ishita Patel", "Rohan Gupta", "Sneha Reddy", "Karan Malhotra",
    "Pooja Nair", "Yash Agarwal", "Riya Singh", "Dev Patel", "Anjali Verma",
]

STAFF = ["Meera Joshi", "Sanjay Kulkarni", "Tara Bhatt", "Nikhil Chawla", "Ritu Saxena"]

# (name, headline, bio, subject, course title, mode, fee, weeks, location)
INSTRUCTORS = [
    ("Ananya Krishnan", "Full-Stack Web Development", "Builds production React and Django apps and teaches the same stack she ships with.",
     "Computer Science", "Full-Stack Web Development Bootcamp", "hybrid", "5999", 10, "Vadodara Centre"),
    ("Vikram Desai", "Cloud and DevOps Engineer", "AWS-certified, focuses on CI/CD, containers and infrastructure as code.",
     "Computer Science", "AWS Cloud and DevOps Essentials", "online", "4499", 8, ""),
    ("Priya Sharma", "Data Science and Analytics", "Ten years turning messy data into decisions, now teaching the pipeline end to end.",
     "Data Science", "Data Analytics with Python", "online", "3999", 8, ""),
    ("Arjun Mehta", "Machine Learning Engineer", "Ships ML models to production and teaches the gap between notebooks and real systems.",
     "Data Science", "Machine Learning Foundations", "online", "4999", 10, ""),
    ("Neha Kapoor", "UI/UX Design", "Product designer who teaches design systems, prototyping and usability testing.",
     "Design", "UI/UX Design Fundamentals", "hybrid", "3499", 6, "Vadodara Centre"),
    ("Rahul Iyer", "Cybersecurity Specialist", "Former pentester, now teaches secure coding and threat modelling.",
     "Security", "Cybersecurity Basics", "online", "3999", 6, ""),
    ("Divya Menon", "Mobile App Development", "Ships React Native and Flutter apps, teaches cross-platform mobile from scratch.",
     "Computer Science", "Mobile App Development with React Native", "online", "4499", 10, ""),
    ("Siddharth Rao", "Backend Systems Architect", "Designs high-throughput APIs, teaches database design and systems thinking.",
     "Computer Science", "Backend Systems Design", "online", "4999", 8, ""),
    ("Kavya Pillai", "Digital Marketing", "Runs performance marketing campaigns, teaches SEO, analytics and growth.",
     "Marketing", "Digital Marketing Masterclass", "online", "2999", 6, ""),
    ("Aditya Joshi", "Competitive Programming Coach", "ICPC finalist, coaches DSA and interview preparation.",
     "Computer Science", "Competitive Programming and DSA", "online", "3499", 10, ""),
]

PAYMENT_REFS = ["upi_demo", "card_demo", "netbanking_demo"]


def slugify_email(name, domain):
    local = name.lower().replace(".", "").replace("  ", " ").replace(" ", ".")
    return f"{local}@{domain}"


class Command(BaseCommand):
    help = ("Create 10 demo students (with enrollments), 10 demo instructors (each with their "
            "own course) and 5 demo staff accounts, so the admin dashboard, catalog and "
            "instructor pages look like a live site. Run seed_demo first.")

    def handle(self, *args, **opts):
        if not Course.objects.exists():
            raise CommandError("No courses found. Run `python manage.py seed_demo` first.")

        courses_created = 0
        for i, (name, headline, bio, subj, title, mode, fee, weeks, loc) in enumerate(INSTRUCTORS):
            email = slugify_email(name, "learnhub.test")
            instructor, _ = Instructor.objects.get_or_create(
                name=name, defaults={"headline": headline, "bio": bio, "email": email, "is_active": True},
            )
            subject, _ = Subject.objects.get_or_create(name=subj)
            start = date.today() + timedelta(days=10 + 5 * i)
            course, was_created = Course.objects.get_or_create(
                title=title,
                defaults=dict(
                    subject=subject, mode=mode, fee=Decimal(fee), duration_weeks=weeks,
                    location=loc, instructor=instructor,
                    description=f"{title}: a structured {weeks}-week course with practice and feedback.",
                    start_date=start, seats=30 if mode != "online" else None,
                ),
            )
            courses_created += was_created
            if was_created:
                offline = mode != "online"
                Batch.objects.create(course=course, label="Weekday evenings", days="Tue,Thu", start_time=time(19, 0), end_time=time(20, 30),
                                     format="Online, with in-person sessions" if mode == "hybrid" else "In person" if offline else "Online",
                                     seats=30 if offline else None)
                Batch.objects.create(course=course, label="Weekend mornings", days="Sat,Sun", start_time=time(10, 0), end_time=time(12, 0),
                                     format="In person" if offline else "Online", seats=30 if offline else None)
                for n, (lt, kind, mins) in enumerate(LESSONS, start=1):
                    session = None
                    if kind == "live":
                        session = timezone.make_aware(datetime.combine(start + timedelta(days=7), time(19, 0)))
                    Lesson.objects.create(
                        course=course, title=lt, kind=kind, order=n, duration_minutes=mins,
                        description=f"{lt} for {title}.", session_at=session,
                        url="https://example.com/replace-me" if kind != "live" else "",
                    )

        courses = list(Course.objects.all().order_by("id"))
        students_created, enrollments_created = 0, 0
        # paid-heavy so the revenue summary and "my courses" pages look like a real,
        # mostly-successful cohort rather than an empty or all-pending demo
        status_cycle = ["paid", "paid", "pending", "paid", "failed", "paid", "paid", "pending", "paid", "paid"]

        for i, name in enumerate(STUDENTS):
            email = slugify_email(name, "student.learnhub.test")
            student, created = User.objects.get_or_create(email=email, defaults={"full_name": name})
            if created:
                student.set_password(PASSWORD)
                student.save()
            students_created += created

            picks = [courses[i % len(courses)], courses[(i * 3 + 1) % len(courses)]]
            statuses = [status_cycle[i], "paid"]
            for course, status in zip(picks, statuses):
                if course.instructor_id and course.instructor.name == name:
                    continue  # never enroll someone in their own course (not relevant here, just safe)
                enrollment, was_created = Enrollment.objects.get_or_create(
                    student=student, course=course,
                    defaults={"amount": course.fee, "batch": course.batches.first()},
                )
                if not was_created:
                    continue
                enrollments_created += 1
                if status == "paid":
                    mark_paid(enrollment, f"{PAYMENT_REFS[i % len(PAYMENT_REFS)]}_{enrollment.id}")
                elif status == "failed":
                    mark_failed(enrollment)
                # "pending" needs no change: that is the default status.

        staff_created = 0
        for name in STAFF:
            email = slugify_email(name, "staff.learnhub.test")
            staff, created = User.objects.get_or_create(email=email, defaults={"full_name": name})
            if created:
                staff.set_password(STAFF_PASSWORD)
                staff.role = User.Role.STAFF
                staff.save()
            staff_created += created

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {courses_created} new course(s), {students_created} new student(s), "
            f"{enrollments_created} new enrollment(s), 10 instructors, {staff_created} new staff. "
            f"Student password: {PASSWORD} | Staff password: {STAFF_PASSWORD}"
        ))
