from decimal import Decimal

from rest_framework.test import APITestCase

from accounts.models import User
from courses.models import Course, Subject


class EnrollmentFlowTests(APITestCase):
    def setUp(self):
        self.subject = Subject.objects.create(name="Mathematics")
        self.online = Course.objects.create(
            title="Algebra Basics", subject=self.subject, mode="online",
            description="d", fee=Decimal("1500.00"),
        )
        self.offline = Course.objects.create(
            title="Geometry Lab", subject=self.subject, mode="offline",
            description="d", fee=Decimal("2500.00"), location="Vadodara", seats=1,
        )

    def register(self, email="a@example.com"):
        r = self.client.post("/api/auth/register/", {
            "email": email, "full_name": "Asha", "password": "Str0ng-pass-99",
        })
        self.assertEqual(r.status_code, 201, r.data)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + r.data["access"])
        return r

    def test_register_login_and_me(self):
        self.register()
        self.assertEqual(self.client.get("/api/auth/me/").data["email"], "a@example.com")
        self.client.credentials()
        r = self.client.post("/api/auth/login/", {"email": "a@example.com", "password": "Str0ng-pass-99"})
        self.assertEqual(r.status_code, 200)
        self.assertIn("access", r.data)

    def test_duplicate_email_rejected(self):
        self.register()
        self.client.credentials()
        r = self.client.post("/api/auth/register/", {
            "email": "A@example.com", "full_name": "X", "password": "Str0ng-pass-99",
        })
        self.assertEqual(r.status_code, 400)

    def test_catalog_filters(self):
        r = self.client.get("/api/courses/", {"mode": "online"})
        self.assertEqual([c["title"] for c in r.data["results"]], ["Algebra Basics"])
        r = self.client.get("/api/courses/", {"subject": "mathematics"})
        self.assertEqual(r.data["count"], 2)

    def test_enroll_requires_login(self):
        r = self.client.post("/api/enroll/", {"course": self.online.id})
        self.assertEqual(r.status_code, 401)

    def test_enroll_and_pay(self):
        self.register()
        r = self.client.post("/api/enroll/", {"course": self.online.id})
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["enrollment"]["status"], "pending")
        self.assertEqual(Decimal(r.data["enrollment"]["amount"]), Decimal("1500.00"))
        ref = r.data["enrollment"]["reference"]
        self.assertEqual(self.client.get("/api/my-courses/").data, [])
        r = self.client.post(f"/api/enrollments/{ref}/pay/", {})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["status"], "paid")
        self.assertEqual(len(self.client.get("/api/my-courses/").data), 1)
        # cannot enroll twice
        r = self.client.post("/api/enroll/", {"course": self.online.id})
        self.assertEqual(r.status_code, 400)

    def test_seat_limit(self):
        self.register("a@example.com")
        ref = self.client.post("/api/enroll/", {"course": self.offline.id}).data["enrollment"]["reference"]
        self.client.post(f"/api/enrollments/{ref}/pay/", {})
        self.register("b@example.com")
        r = self.client.post("/api/enroll/", {"course": self.offline.id})
        self.assertEqual(r.status_code, 400)
        self.assertIn("full", r.data["detail"])

    def test_cannot_pay_someone_elses_enrollment(self):
        self.register("a@example.com")
        ref = self.client.post("/api/enroll/", {"course": self.online.id}).data["enrollment"]["reference"]
        self.register("b@example.com")
        r = self.client.post(f"/api/enrollments/{ref}/pay/", {})
        self.assertEqual(r.status_code, 404)

    def test_cannot_pay_twice_for_same_course(self):
        self.register()
        user = User.objects.get(email="a@example.com")
        from enrollments.models import Enrollment
        Enrollment.objects.create(student=user, course=self.online, status="paid", amount=1500)
        dup = Enrollment.objects.create(student=user, course=self.online, status="pending", amount=1500)
        r = self.client.post(f"/api/enrollments/{dup.reference}/pay/", {})
        self.assertEqual(r.status_code, 400)
        dup.refresh_from_db()
        self.assertEqual(dup.status, "pending")
