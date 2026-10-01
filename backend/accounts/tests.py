from rest_framework.test import APITestCase

from .models import User


class ChangePasswordTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("a@example.com", "Old-pass-123", full_name="A")
        self.client.force_authenticate(self.user)

    def post(self, old, new):
        return self.client.post("/api/auth/change-password/", {"old_password": old, "new_password": new})

    def test_success_and_login_with_new_password(self):
        self.assertEqual(self.post("Old-pass-123", "Brand-new-456").status_code, 200)
        self.client.force_authenticate(None)
        ok = self.client.post("/api/auth/login/", {"email": "a@example.com", "password": "Brand-new-456"})
        old = self.client.post("/api/auth/login/", {"email": "a@example.com", "password": "Old-pass-123"})
        self.assertEqual((ok.status_code, old.status_code), (200, 401))

    def test_wrong_current_password(self):
        r = self.post("wrong", "Brand-new-456")
        self.assertEqual(r.status_code, 400)
        self.assertIn("old_password", r.data)

    def test_weak_new_password_rejected(self):
        self.assertEqual(self.post("Old-pass-123", "12345678").status_code, 400)

    def test_requires_login(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.post("a", "b").status_code, 401)


import re
from django.core import mail
from django.core.cache import cache
from django.test import override_settings


@override_settings(FRONTEND_URL="https://learnhub.test")
class PasswordResetTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user("a@example.com", "Old-pass-123", full_name="Asha")

    def request(self, email="a@example.com"):
        return self.client.post("/api/auth/password-reset/", {"email": email})

    def link_params(self):
        body = mail.outbox[-1].body
        m = re.search(r"https://learnhub\.test/reset-password\?uid=([^&\s]+)&token=([^&\s]+)", body)
        self.assertIsNotNone(m, body)
        return m.group(1), m.group(2)

    def confirm(self, uid, token, pw="Brand-new-456"):
        return self.client.post("/api/auth/password-reset/confirm/", {"uid": uid, "token": token, "new_password": pw})

    def test_same_answer_whether_or_not_the_account_exists(self):
        known, unknown = self.request(), self.request("nobody@example.com")
        self.assertEqual((known.status_code, unknown.status_code), (200, 200))
        self.assertEqual(known.data, unknown.data)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["a@example.com"])

    def test_email_is_case_insensitive_and_inactive_users_get_nothing(self):
        self.request("A@Example.com")
        self.assertEqual(len(mail.outbox), 1)
        User.objects.filter(pk=self.user.pk).update(is_active=False)
        self.request()
        self.assertEqual(len(mail.outbox), 1)

    def test_full_flow_then_login_with_new_password(self):
        self.request()
        uid, token = self.link_params()
        self.assertEqual(self.confirm(uid, token).status_code, 200)
        ok = self.client.post("/api/auth/login/", {"email": "a@example.com", "password": "Brand-new-456"})
        old = self.client.post("/api/auth/login/", {"email": "a@example.com", "password": "Old-pass-123"})
        self.assertEqual((ok.status_code, old.status_code), (200, 401))

    def test_link_works_only_once(self):
        self.request()
        uid, token = self.link_params()
        self.assertEqual(self.confirm(uid, token).status_code, 200)
        self.assertEqual(self.confirm(uid, token, "Another-one-789").status_code, 400)

    def test_bad_token_and_bad_uid_rejected(self):
        self.request()
        uid, token = self.link_params()
        self.assertEqual(self.confirm(uid, "wrong-token").status_code, 400)
        self.assertEqual(self.confirm("!!!", token).status_code, 400)
        self.assertEqual(self.confirm("MTIzNDU2", token).status_code, 400)  # uid of a user that does not exist
        self.assertTrue(self.user.__class__.objects.get(pk=self.user.pk).check_password("Old-pass-123"))

    def test_weak_password_rejected_and_link_still_usable(self):
        self.request()
        uid, token = self.link_params()
        r = self.confirm(uid, token, "12345678")
        self.assertEqual(r.status_code, 400)
        self.assertIn("new_password", r.data)
        self.assertEqual(self.confirm(uid, token).status_code, 200)

    @override_settings(PASSWORD_RESET_TIMEOUT=-1)
    def test_expired_link_rejected(self):
        self.request()
        uid, token = self.link_params()
        r = self.confirm(uid, token)
        self.assertEqual(r.status_code, 400)
        self.assertIn("expired", r.data["detail"])

    def test_email_failure_does_not_leak_or_crash(self):
        from unittest.mock import patch
        with patch("accounts.emails.send_mail", side_effect=OSError("smtp down")), self.assertLogs("accounts.emails", "ERROR"):
            r = self.request()
        self.assertEqual(r.status_code, 200)

    def test_rate_limited(self):
        codes = [self.request().status_code for _ in range(11)]
        self.assertEqual(codes, [200] * 10 + [429])

    def test_invalid_email_format_is_a_validation_error(self):
        self.assertEqual(self.request("not-an-email").status_code, 400)


class RoleTests(APITestCase):
    def test_new_users_are_students(self):
        u = User.objects.create_user("s@example.com", "Pass-12345", full_name="S")
        self.assertEqual((u.role, u.is_staff, u.is_superuser), ("student", False, False))

    def test_createsuperuser_gets_superadmin_role(self):
        u = User.objects.create_superuser("root@example.com", "Pass-12345", full_name="R")
        self.assertEqual((u.role, u.is_staff, u.is_superuser), ("superadmin", True, True))

    def test_flags_set_in_django_admin_set_the_role(self):
        u = User.objects.create_user("s@example.com", "Pass-12345", full_name="S")
        u.is_staff = True
        u.save()
        self.assertEqual(u.role, "staff")
        u.is_superuser = True
        u.save()
        self.assertEqual(u.role, "superadmin")

    def test_changing_role_updates_flags_both_ways(self):
        u = User.objects.create_user("s@example.com", "Pass-12345", full_name="S")
        u.role = "superadmin"
        u.save()
        self.assertEqual((u.is_staff, u.is_superuser), (True, True))
        u.role = "staff"
        u.save()
        self.assertEqual((u.is_staff, u.is_superuser), (True, False))
        u.role = "student"
        u.save()
        self.assertEqual((u.is_staff, u.is_superuser), (False, False))
        self.assertEqual(User.objects.get(pk=u.pk).role, "student")

    def test_demoting_a_superuser_by_role_is_not_undone_by_stale_flags(self):
        u = User.objects.create_superuser("root@example.com", "Pass-12345", full_name="R")
        fresh = User.objects.get(pk=u.pk)
        fresh.role = "student"
        fresh.save()
        self.assertEqual((fresh.role, fresh.is_staff, fresh.is_superuser), ("student", False, False))

    def test_me_returns_role_and_cannot_change_it(self):
        u = User.objects.create_user("s@example.com", "Pass-12345", full_name="S")
        self.client.force_authenticate(u)
        self.assertEqual(self.client.get("/api/auth/me/").data["role"], "student")
        self.client.patch("/api/auth/me/", {"role": "superadmin", "full_name": "S2"})
        u.refresh_from_db()
        self.assertEqual((u.role, u.full_name), ("student", "S2"))
