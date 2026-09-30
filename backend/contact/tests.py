from django.core.cache import cache
from rest_framework.test import APITestCase

from .models import ContactMessage

GOOD = {"name": "Asha", "email": "a@example.com", "message": "What are the batch timings?"}


class ContactTests(APITestCase):
    def setUp(self):
        cache.clear()

    def test_message_is_saved(self):
        r = self.client.post("/api/contact/", GOOD)
        self.assertEqual(r.status_code, 201)
        self.assertEqual(ContactMessage.objects.get().email, "a@example.com")

    def test_validation(self):
        self.assertEqual(self.client.post("/api/contact/", {**GOOD, "email": "nope"}).status_code, 400)
        self.assertEqual(self.client.post("/api/contact/", {**GOOD, "message": ""}).status_code, 400)
        self.assertEqual(ContactMessage.objects.count(), 0)

    def test_rate_limited(self):
        codes = [self.client.post("/api/contact/", GOOD).status_code for _ in range(6)]
        self.assertEqual(codes, [201] * 5 + [429])
