import logging
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from html import escape

from django.core.mail import EmailMultiAlternatives, send_mail
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


def email_layout(heading, paragraphs, button=None, rows=None):
    """Plain and HTML versions of a simple branded email. Everything passed in is escaped for the HTML part."""
    text = [heading, ""] + paragraphs
    if rows:
        text += [""] + [f"{k}: {v}" for k, v in rows]
    if button:
        text += ["", f"{button[0]}: {button[1]}"]
    text += ["", "LearnHub"]
    cell = "padding:6px 0;border-bottom:1px solid #eee;"
    html = (
        '<div style="font-family:Arial,Helvetica,sans-serif;background:#f4f0ff;padding:24px">'
        '<div style="max-width:520px;margin:auto;background:#fff;border-radius:16px;overflow:hidden">'
        '<div style="background:#6c3ce9;color:#fff;padding:20px 24px;font-size:22px;font-weight:bold">LearnHub</div>'
        f'<div style="padding:24px;color:#1e1b4b;line-height:1.5"><h1 style="font-size:20px;margin:0 0 12px">{escape(heading)}</h1>'
        + "".join(f'<p style="margin:0 0 12px">{escape(p)}</p>' for p in paragraphs)
        + (
            '<table style="width:100%;border-collapse:collapse;margin:8px 0 16px">'
            + "".join(f'<tr><td style="{cell}color:#555">{escape(k)}</td><td style="{cell}text-align:right;font-weight:bold">{escape(str(v))}</td></tr>' for k, v in rows)
            + "</table>"
            if rows else ""
        )
        + (
            f'<p style="margin:20px 0 0"><a href="{escape(button[1], quote=True)}" style="background:#6c3ce9;color:#fff;text-decoration:none;'
            f'padding:12px 22px;border-radius:999px;font-weight:bold;display:inline-block">{escape(button[0])}</a></p>'
            if button else ""
        )
        + "</div></div></div>"
    )
    return "\n".join(text), html


def send_email(subject, to, text, html):
    """Send a multipart email. Never raises: a mail problem must not break registration or payment."""
    try:
        msg = EmailMultiAlternatives(subject, text, settings.DEFAULT_FROM_EMAIL, [to])
        msg.attach_alternative(html, "text/html")
        msg.send()
        return True
    except Exception:  # SMTP down, bad credentials, etc.
        log.exception("Could not send email %r to %s", subject, to)
        return False


def send_welcome_email(user):
    first = user.full_name.split()[0] if user.full_name else "there"
    text, html = email_layout(
        f"Welcome to LearnHub, {first}!",
        ["Your account is ready. Browse our online and offline classes, pick a batch that fits your week and enroll in a few clicks."],
        button=("Browse courses", f"{settings.FRONTEND_URL}/courses"),
    )
    return send_email("Welcome to LearnHub", user.email, text, html)
