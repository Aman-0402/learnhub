from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create(self, email, password, **extra):
        if not email:
            raise ValueError("Email is required")
        user = self.model(email=self.normalize_email(email), **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra):
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._create(email, password, **extra)

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("role", User.Role.SUPERADMIN)
        return self._create(email, password, **extra)


class User(AbstractUser):
    """Student account. Email is the login identifier."""

    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        STAFF = "staff", "Staff"
        SUPERADMIN = "superadmin", "Super admin"

    username = None
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=15, blank=True)
    # `role` drives the frontend admin area. Django's is_staff / is_superuser stay in step with it (see save()).
    role = models.CharField(max_length=12, choices=Role.choices, default=Role.STUDENT)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    objects = UserManager()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._loaded_role = self.role

    @property
    def is_admin_role(self):
        return self.role in (self.Role.STAFF, self.Role.SUPERADMIN)

    def _sync_role_and_flags(self):
        """Keep `role` and Django's flags consistent.

        If `role` was changed in code, it wins and the flags follow it. Otherwise the flags win,
        so `createsuperuser` and the Django admin checkboxes still produce the right role.
        """
        if self.role != self._loaded_role:
            self.is_superuser = self.role == self.Role.SUPERADMIN
            self.is_staff = self.role in (self.Role.STAFF, self.Role.SUPERADMIN)
        elif self.is_superuser:
            self.role, self.is_staff = self.Role.SUPERADMIN, True
        elif self.is_staff:
            self.role = self.Role.STAFF
        else:
            self.role = self.Role.STUDENT

    def save(self, *args, **kwargs):
        self._sync_role_and_flags()
        super().save(*args, **kwargs)
        self._loaded_role = self.role

    def __str__(self):
        return self.email
