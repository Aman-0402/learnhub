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
