from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [("courses", "0003_copy_instructor_names")]
    operations = [
        migrations.RemoveField(model_name="course", name="instructor"),
        migrations.RenameField(model_name="course", old_name="teacher", new_name="instructor"),
    ]
