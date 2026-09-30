import logging
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

log = logging.getLogger(__name__)


def send_password_reset_email(user):
    """Email a one-time reset link. Never raises: the caller must not reveal whether the email exists."""
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    link = f"{settings.FRONTEND_URL}/reset-password?{urlencode({'uid': uid, 'token': token})}"
    hours = settings.PASSWORD_RESET_TIMEOUT // 3600
    body = (
        f"Hi {user.full_name},\n\n"
        "We received a request to reset your LearnHub password. Choose a new one here:\n\n"
        f"{link}\n\n"
        f"This link works for {hours} hours and can be used once. "
        "If you did not ask for this, you can ignore this email; your password will not change.\n\n"
        "LearnHub"
    )
    try:
        send_mail("Reset your LearnHub password", body, settings.DEFAULT_FROM_EMAIL, [user.email])
    except Exception:  # SMTP down, bad credentials, etc.
        log.exception("Could not send password reset email to user %s", user.pk)
