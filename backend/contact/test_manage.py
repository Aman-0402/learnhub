from rest_framework.test import APITestCase

from accounts.models import User
from contact.models import ContactMessage

BASE = "/api/manage/contact-messages/"


class ManageBase(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user("stu@example.com", "Pass-12345", full_name="Stu")
        self.staff = User.objects.create_user("staff@example.com", "Pass-12345", full_name="Staff")
        self.staff.role = "staff"
        self.staff.save()
        self.root = User.objects.create_superuser("root@example.com", "Pass-12345", full_name="Root")

    def as_(self, user):
        self.client.force_authenticate(user)


class PermissionTests(ManageBase):
    def test_anonymous_gets_401(self):
        self.assertEqual(self.client.get(BASE).status_code, 401)

    def test_student_gets_403(self):
        self.as_(self.student)
        self.assertEqual(self.client.get(BASE).status_code, 403)

    def test_staff_and_superadmin_can_list(self):
        for user in (self.staff, self.root):
            self.as_(user)
            self.assertEqual(self.client.get(BASE).status_code, 200)

    def test_no_write_endpoints(self):
        self.as_(self.staff)
        self.assertEqual(self.client.post(BASE, {}).status_code, 405)
        m = ContactMessage.objects.create(name="A", email="a@example.com", message="hi")
        self.assertEqual(self.client.delete(f"{BASE}{m.id}/").status_code, 405)


class ListFilterTests(ManageBase):
    def setUp(self):
        super().setUp()
        self.open = ContactMessage.objects.create(name="Ravi", email="ravi@example.com", message="Need a course")
        self.handled = ContactMessage.objects.create(name="Mina", email="mina@example.com", message="Thanks", is_handled=True)
        self.as_(self.staff)

    def test_list_includes_everyone(self):
        ids = {r["id"] for r in self.client.get(BASE).data["results"]}
        self.assertEqual(ids, {self.open.id, self.handled.id})

    def test_filter_by_handled(self):
        r = self.client.get(f"{BASE}?handled=true").data["results"]
        self.assertEqual([x["id"] for x in r], [self.handled.id])

    def test_search(self):
        r = self.client.get(f"{BASE}?q=ravi").data["results"]
        self.assertEqual([x["id"] for x in r], [self.open.id])


class ActionTests(ManageBase):
    def test_mark_handled_and_unhandled(self):
        m = ContactMessage.objects.create(name="A", email="a@example.com", message="hi")
        self.as_(self.staff)
        r = self.client.post(f"{BASE}{m.id}/mark-handled/")
        self.assertEqual((r.status_code, r.data["is_handled"]), (200, True))
        r = self.client.post(f"{BASE}{m.id}/mark-unhandled/")
        self.assertEqual(r.data["is_handled"], False)

    def test_actions_need_staff(self):
        m = ContactMessage.objects.create(name="A", email="a@example.com", message="hi")
        self.as_(self.student)
        self.assertEqual(self.client.post(f"{BASE}{m.id}/mark-handled/").status_code, 403)
