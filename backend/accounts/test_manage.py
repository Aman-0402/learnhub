from rest_framework.test import APITestCase

from accounts.models import User

BASE = "/api/manage/users/"


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
        self.assertEqual(self.client.delete(f"{BASE}{self.student.id}/").status_code, 405)

    def test_staff_cannot_set_role(self):
        self.as_(self.staff)
        r = self.client.post(f"{BASE}{self.student.id}/set-role/", {"role": "staff"})
        self.assertEqual(r.status_code, 403)

    def test_superadmin_can_set_role(self):
        self.as_(self.root)
        r = self.client.post(f"{BASE}{self.student.id}/set-role/", {"role": "staff"})
        self.assertEqual(r.status_code, 200)


class ListFilterTests(ManageBase):
    def test_list_includes_everyone(self):
        self.as_(self.root)
        emails = {u["email"] for u in self.client.get(BASE).data["results"]}
        self.assertEqual(emails, {"stu@example.com", "staff@example.com", "root@example.com"})

    def test_filter_by_role(self):
        self.as_(self.root)
        r = self.client.get(f"{BASE}?role=staff").data["results"]
        self.assertEqual([u["email"] for u in r], ["staff@example.com"])

    def test_search(self):
        self.as_(self.root)
        r = self.client.get(f"{BASE}?q=Stu").data["results"]
        self.assertEqual([u["email"] for u in r], ["stu@example.com"])


class SetRoleTests(ManageBase):
    def test_promote_student_to_staff(self):
        self.as_(self.root)
        r = self.client.post(f"{BASE}{self.student.id}/set-role/", {"role": "staff"})
        self.assertEqual(r.data["role"], "staff")
        self.student.refresh_from_db()
        self.assertTrue(self.student.is_staff)
        self.assertFalse(self.student.is_superuser)

    def test_demote_staff_to_student(self):
        self.as_(self.root)
        r = self.client.post(f"{BASE}{self.staff.id}/set-role/", {"role": "student"})
        self.assertEqual(r.data["role"], "student")
        self.staff.refresh_from_db()
        self.assertFalse(self.staff.is_staff)

    def test_promote_to_superadmin_sets_both_flags(self):
        self.as_(self.root)
        r = self.client.post(f"{BASE}{self.staff.id}/set-role/", {"role": "superadmin"})
        self.assertEqual(r.status_code, 200)
        self.staff.refresh_from_db()
        self.assertTrue(self.staff.is_staff and self.staff.is_superuser)

    def test_superadmin_cannot_demote_self(self):
        self.as_(self.root)
        r = self.client.post(f"{BASE}{self.root.id}/set-role/", {"role": "staff"})
        self.assertEqual(r.status_code, 400)
        self.root.refresh_from_db()
        self.assertEqual(self.root.role, "superadmin")

    def test_invalid_role_rejected(self):
        self.as_(self.root)
        r = self.client.post(f"{BASE}{self.student.id}/set-role/", {"role": "owner"})
        self.assertEqual(r.status_code, 400)
