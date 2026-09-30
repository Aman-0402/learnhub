# Agent.md: LearnHub project guide and progress log

This file is the single source of truth for any AI agent (or developer) working on this repo.
**Read it first. Update it last.**

## Rules (mandatory)

1. **Always commit and push to GitHub.** After every meaningful change (a feature, a fix, a doc update), commit and run `git push origin main` before ending the turn. Never leave work only on a local machine or in a session.
2. **Update this file in the same commit.** Add a line to the Progress log and move items between Done / In progress / Next.
3. **Run the checks before committing:**
   - Backend: `cd backend && python manage.py test` (use MySQL; `DB_ENGINE=sqlite` is for quick runs only)
   - Frontend: `cd frontend && npm run build`
4. **Never commit secrets.** `.env` files, database passwords, tokens and `db.sqlite3` stay out of git. Only `.env.example` is committed.
5. **Commit messages:** short imperative subject, then a body explaining what and why.
6. **Do not silently change scope.** Payments stay in mock mode until the owner adds real Razorpay keys and switches `PAYMENT_GATEWAY=razorpay`.
7. **Keep it working.** Do not push code that fails the tests or the frontend build.

## Project

A website that sells online and offline classes across multiple subjects. Students register, browse courses, enroll and pay the fee.

- Repo: `Aman-0402/learnhub`
- Stack: React (Vite) + Tailwind CSS v4, Django 5.2 + Django REST Framework + JWT (SimpleJWT), MySQL (PyMySQL driver)
- Owner's stack choices: React JS frontend, Django backend, MySQL, email + password login, Tailwind, Razorpay later.

## Structure

```
backend/    Django project (config/) + apps: accounts, courses, enrollments, contact
frontend/   Vite + React app (src/pages, src/components, src/lib)
Agent.md    this file
README.md   setup and API reference
```

## Local setup (MySQL)

```
MySQL:  user root, password (empty on the owner's machine), database learnhub
cp backend/.env.example backend/.env   # then set DB_PASSWORD if needed
cd backend && pip install -r requirements.txt && python manage.py migrate && python manage.py seed_demo
python manage.py runserver             # API on :8000
cd frontend && npm install && npm run dev   # site on :5173, proxies /api to :8000
```

## Data model

- `accounts.User`: email login, full_name, phone
- `courses.Subject`, `courses.Instructor`, `courses.Course` (mode: online / offline / hybrid, fee, seats, start_date, location), `courses.Lesson` (video / reading / live / assignment)
- `enrollments.Enrollment`: student + course, status pending / paid / failed, payment_ref
- `contact.ContactMessage`: messages from the contact form (rate limited to 5 per hour per visitor)

## API summary

Auth: `POST /api/auth/register|login|refresh/`, `GET/PATCH /api/auth/me/`, `POST /api/auth/change-password/`
Public: `GET /api/subjects/`, `/api/courses/?subject=&mode=&q=`, `/api/courses/<slug>/`, `/api/instructors/`, `/api/instructors/<slug>/`, `POST /api/contact/`
Payments: `GET /api/payments/config/` (active gateway), `POST /api/payments/razorpay/webhook/` (called by Razorpay)
Student: `POST /api/enroll/`, `POST /api/enrollments/<ref>/pay/`, `GET /api/my-courses/`, `GET /api/courses/<slug>/lessons/` (paid students and staff only)

## Decisions and gotchas

- Payments go through `backend/enrollments/payments.py`. `get_gateway()` returns `MockGateway` (default) or `RazorpayGateway` based on `PAYMENT_GATEWAY`. Views never depend on a specific provider.
- Razorpay structure is in place but has **never run against the real Razorpay API** (no keys yet). Order creation, signature checks and the webhook are covered by tests using a stubbed API and real HMAC math. The frontend popup is covered by a browser test with a stand-in Razorpay window.
- `Enrollment.gateway_order_id` links a Razorpay order to an enrollment. `enrollments/services.py` (`mark_paid`, `mark_failed`) is the only place that changes payment status; it is idempotent and never downgrades a paid enrollment.
- Razorpay amounts are in paise (fee x 100). Keys come from the environment, never from code.
- Known small risk: seats are checked before the order is created, not at capture time, so a last-seat race can oversell. Revisit when going live.
- MySQL cannot create conditional unique constraints, so "one paid enrollment per student and course" is enforced in `PayView` (and tested). Check `models.W036` is silenced for this reason.
- `mysqlclient` needs system headers, so the project uses the pure-Python `PyMySQL` driver (installed as MySQLdb in `config/settings.py`).
- Frontend contact details live in `frontend/src/lib/site.js` and are placeholders until the owner fills them in.
- After a deliberate logout, protected pages send the user home (not to login). See `RequireAuth` and `AuthProvider.loggedOut`.

## Progress log

| Date | What happened |
|---|---|
| 2026-10-01 | Repo `learnhub` created. Initial scaffold: Django REST backend (auth, courses, enrollment with mock payment, admin, tests) and React frontend (catalog, auth, checkout). |
| 2026-10-01 | Frontend expanded to 15 pages: About, Contact, Instructors, FAQ, Dashboard, Profile, Payment history, Course space. Responsive navbar, footer, favicon. |
| 2026-10-01 | Backend expanded: Instructor model (with data migration from the old name field), Lesson model and enrolled-only lessons endpoint, contact endpoint with rate limit, change-password endpoint, double-payment guard. 23 tests pass on MySQL. Frontend wired to all of it; full flow verified in a browser. |
| 2026-10-01 | Added this Agent.md and a CLAUDE.md that loads it. |
| 2026-10-01 | Razorpay structure added (off by default): `RazorpayGateway`, signature verification, webhook endpoint, `gateway_order_id`, `/api/payments/config/`, frontend `lib/razorpay.js` and Checkout hook. 38 backend tests pass; mock and stubbed-Razorpay checkout verified in a browser. Not yet tested with real Razorpay keys. |

## Status

**Done**
- Registration, login, JWT refresh, profile edit, change password
- Course catalog with subject / format / search filters
- Instructors (list and profile pages), lessons, schedule
- Enrollment and checkout with seat limits (mock payment), payment history
- Contact form stored in the database (view it in Django admin)
- Django admin for all models

**Go-live checklist for Razorpay (owner action needed)**
1. Create a Razorpay account and copy the **test** Key ID and Key Secret.
2. In `backend/.env` set `PAYMENT_GATEWAY=razorpay`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
3. In the Razorpay dashboard add a webhook to `https://<your-domain>/api/payments/razorpay/webhook/` with events `payment.captured` and `payment.failed`, and put its secret in `RAZORPAY_WEBHOOK_SECRET`. (Webhooks need a public URL; use a tunnel such as ngrok when testing locally.)
4. Make one test payment with Razorpay test cards, confirm the enrollment turns paid, then switch to live keys.

**Next (pick in this order unless told otherwise)**
1. Test Razorpay end to end with real test keys, then handle refunds and last-seat races
2. Email: welcome email, payment receipt, password reset
3. Batches and timetable for offline and online classes
4. Course images and instructor photos (file uploads)
5. Production setup: Gunicorn, environment variables, static files, deployment

**Known gaps**
- No password reset by email yet
- No refunds or cancellations
- Razorpay integration is untested against the live API
- Course thumbnails and instructor photos are not supported yet
