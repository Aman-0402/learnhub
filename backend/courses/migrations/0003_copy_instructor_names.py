from django.db import migrations


def copy_names(apps, schema_editor):
    Course = apps.get_model("courses", "Course")
    Instructor = apps.get_model("courses", "Instructor")
    from django.utils.text import slugify

    by_name = {}
    for course in Course.objects.exclude(instructor=""):
        name = course.instructor.strip()
        if not name:
            continue
        inst = by_name.get(name)
        if inst is None:
            base = slugify(name)[:160] or "instructor"
            slug, n = base, 2
            while Instructor.objects.filter(slug=slug).exists():
                slug = f"{base}-{n}"
                n += 1
            inst = Instructor.objects.create(name=name, slug=slug)
            by_name[name] = inst
        course.teacher = inst
        course.save(update_fields=["teacher"])


def restore_names(apps, schema_editor):
    Course = apps.get_model("courses", "Course")
    for course in Course.objects.exclude(teacher=None).select_related("teacher"):
        course.instructor = course.teacher.name
        course.save(update_fields=["instructor"])


class Migration(migrations.Migration):
    dependencies = [("courses", "0002_instructor_model")]
    operations = [migrations.RunPython(copy_names, restore_names)]
