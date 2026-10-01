# Admin Dashboard: Phased Plan

Goal: a proper admin dashboard inside the React frontend (not Django admin) to control
everything — courses, batches, lessons, instructors, subjects, enrollments/payments,
contact messages, and staff users.

Status quo (see Agent.md for full context): the `User` model has no `role` field, only
Django's `is_staff`/`is_superuser`. There is zero staff-only DRF API today — every
endpoint is `AllowAny` or `IsAuthenticated` and scoped to the logged-in student. Django
admin already gives full CRUD for every model via `/admin/`; this plan does not replace
it, it adds a frontend-native surface with workflows Django admin can't express (revenue
view, bulk actions, a dashboard home).

**Process**: each phase below ships as its own commit (or small commit series), is
proposed here first, and **waits for explicit approval before work starts**. After a
phase is approved and done, its checkbox is ticked, Agent.md's Progress log gets a line,
and both files are committed and pushed together.

---

## Phase 0: Foundations (done)
- [x] Add `role` field to `accounts.User` (`student` / `staff` / `superadmin`, default
      `student`) — migration, no data loss. Keep `is_staff`/`is_superuser` as Django's
      own flags for `/admin/`; `role` drives the frontend.
- [x] Backfill: existing superusers get `role=superadmin`.
- [x] `GET/PATCH /api/auth/me/` returns `role`.
- [x] Frontend: `RequireStaff` route guard (mirrors `RequireAuth`, checks `role`).
- [x] Frontend: `/manage` layout shell (not `/admin`: that path belongs to Django admin on the same domain in production) — sidebar nav, empty landing page, linked only
      for staff/superadmin users (no link shown to students).

Role and flags stay in sync in `User.save()`: if `role` is changed in code it wins and `is_staff` / `is_superuser` follow; otherwise the flags win (so `createsuperuser` and the Django admin checkboxes still set the right role). `role` is read-only on `/api/auth/me/`.

## Phase 1: Admin API layer
- [ ] Staff-only DRF endpoints for `Course`, `Subject`, `Instructor`, `Batch`, `Lesson`:
      list/create/update/delete. New `IsStaffRole` permission class.
- [ ] Reuse existing serializers where possible; add write-enabled variants.
- [ ] Tests: staff can CRUD, student gets 403, unauthenticated gets 401.

## Phase 2: Courses, subjects, instructors UI
- [ ] Admin pages: Courses (list, create, edit, publish toggle, delete), Subjects,
      Instructors. Batches and Lessons editable from a course's detail page.
- [ ] Form validation mirrors backend (zod-equivalent or plain checks).

## Phase 3: Enrollments & payments dashboard
- [ ] Staff endpoint: list/filter enrollments (by status, course, date range).
- [ ] Manual status actions: mark paid / mark failed (uses existing `mark_paid` /
      `mark_failed` service functions, so emails and idempotency stay correct).
- [ ] Revenue summary (total paid, this month, by course).

## Phase 4: Contact messages
- [ ] Staff endpoint: list contact messages, toggle `is_handled`.
- [ ] Admin page: inbox-style list with filter (handled / unhandled).

## Phase 5: Staff & student directory
- [ ] Staff endpoint: list users, search, promote/demote `role` (superadmin only).
- [ ] Admin page: directory with role badges and a promote/demote action.

## Phase 6: Dashboard home
- [ ] Overview page: students count, active courses, pending enrollments, revenue
      this month, recent contact messages — pulling from endpoints built in earlier
      phases (no new backend logic beyond simple aggregation endpoints).

## Phase 7: Polish and audit
- [ ] Full permission audit across every new endpoint.
- [ ] axe-core pass on all new admin pages (light + dark).
- [ ] Backend test suite green on MySQL; frontend build green.
- [ ] Update README with admin dashboard section.

---

Each phase is independent and shippable; later phases can be reordered or dropped
without breaking earlier ones. Nothing here touches the existing student-facing app
except adding the `role` field and the new `/manage` route tree.
