from django.core.exceptions import ValidationError
from django.db import models
from django.utils.text import slugify


class Subject(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Instructor(models.Model):
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=170, unique=True, blank=True)
    headline = models.CharField(max_length=200, blank=True, help_text="e.g. Senior Mathematics Teacher")
    bio = models.TextField(blank=True)
    email = models.EmailField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name)[:160] or "instructor"
            slug, n = base, 2
            while Instructor.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{n}"
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Course(models.Model):
    class Mode(models.TextChoices):
        ONLINE = "online", "Online"
        OFFLINE = "offline", "Offline"
        HYBRID = "hybrid", "Online + Offline"

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    subject = models.ForeignKey(Subject, on_delete=models.PROTECT, related_name="courses")
    mode = models.CharField(max_length=10, choices=Mode.choices, default=Mode.ONLINE)
    description = models.TextField()
    instructor = models.ForeignKey(Instructor, null=True, blank=True, on_delete=models.SET_NULL, related_name="courses")
    fee = models.DecimalField(max_digits=10, decimal_places=2)
    duration_weeks = models.PositiveSmallIntegerField(default=4)
    start_date = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=200, blank=True, help_text="Required for offline/hybrid")
    seats = models.PositiveIntegerField(null=True, blank=True, help_text="Leave empty for unlimited")
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title)[:200]
            slug, n = base, 2
            while Course.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{n}"
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Lesson(models.Model):
    """A unit of course content: a video, reading, live/in-person session or assignment."""

    class Kind(models.TextChoices):
        VIDEO = "video", "Video"
        READING = "reading", "Reading"
        LIVE = "live", "Live or in-person class"
        ASSIGNMENT = "assignment", "Assignment"

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="lessons")
    title = models.CharField(max_length=200)
    kind = models.CharField(max_length=12, choices=Kind.choices, default=Kind.VIDEO)
    order = models.PositiveIntegerField(default=1, help_text="Position within the course")
    description = models.TextField(blank=True)
    url = models.URLField(blank=True, help_text="Video link, document link or meeting link")
    session_at = models.DateTimeField(null=True, blank=True, help_text="For live or in-person classes")
    duration_minutes = models.PositiveSmallIntegerField(null=True, blank=True)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["course", "order", "id"]

    def __str__(self):
        return f"{self.course.title}: {self.title}"


WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def validate_days(value):
    days = [d.strip() for d in value.split(",") if d.strip()]
    bad = [d for d in days if d not in WEEKDAYS]
    if not days or bad:
        raise ValidationError(f"Use comma-separated days from {', '.join(WEEKDAYS)}. Got: {value!r}")


class Batch(models.Model):
    """A recurring weekly class slot for a course, e.g. weekday evenings."""

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="batches")
    label = models.CharField(max_length=100, help_text="e.g. Weekday evenings")
    days = models.CharField(max_length=40, validators=[validate_days], help_text="Comma-separated, e.g. Mon,Wed,Fri")
    start_time = models.TimeField()
    end_time = models.TimeField()
    start_date = models.DateField(null=True, blank=True, help_text="Leave empty to use the course start date")
    format = models.CharField(max_length=100, blank=True, help_text="e.g. In person. Leave empty to use the course format")
    seats = models.PositiveIntegerField(null=True, blank=True, help_text="Leave empty for unlimited")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["course", "start_time", "id"]
        verbose_name_plural = "batches"

    @property
    def days_list(self):
        chosen = {d.strip() for d in self.days.split(",")}
        return [d for d in WEEKDAYS if d in chosen]

    def clean(self):
        if self.start_time and self.end_time and self.end_time <= self.start_time:
            raise ValidationError({"end_time": "End time must be after the start time."})

    def __str__(self):
        return f"{self.course.title}: {self.label}"
