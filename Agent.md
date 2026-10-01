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
- `courses.Subject`, `courses.Instructor`, `courses.Course` (mode: online / offline / hybrid, fee, seats, start_date, location), `courses.Batch` (weekly slot: days, times, optional own start date / format / seats), `courses.Lesson` (video / reading / live / assignment)
- `enrollments.Enrollment`: student + course + batch, status pending / paid / failed, payment_ref
- `contact.ContactMessage`: messages from the contact form (rate limited to 5 per hour per visitor)

## API summary

Auth: `POST /api/auth/register|login|refresh/`, `GET/PATCH /api/auth/me/`, `POST /api/auth/change-password/`, `POST /api/auth/password-reset/` and `/password-reset/confirm/`
Public: `GET /api/subjects/`, `/api/courses/?subject=&mode=&q=`, `/api/courses/<slug>/`, `/api/instructors/`, `/api/instructors/<slug>/`, `/api/courses/<slug>/batches/`, `POST /api/contact/`
Payments: `GET /api/payments/config/` (active gateway), `POST /api/payments/razorpay/webhook/` (called by Razorpay)
Student: `POST /api/enroll/`, `POST /api/enrollments/<ref>/pay/`, `GET /api/my-courses/`, `GET /api/courses/<slug>/lessons/` (paid students and staff only)

## Frontend feature switches

`frontend/src/lib/features.js` has one switch per feature that can run on built-in sample data (`lib/sample.js`, `lib/services.js`) when its backend is missing.
Both are now **on** (`true`), so the pages use the real API. Setting one back to `false` restores the sample-data behaviour with a visible "sample" note.

| Switch | Pages | Backend |
|---|---|---|
| `passwordResetApi` | Forgot password, Reset password | `POST /api/auth/password-reset/` `{email}` (same 200 answer whether or not the email exists), `POST /api/auth/password-reset/confirm/` `{uid, token, new_password}` |
| `batchesApi` | Course page batch picker, Checkout, Timetable tab | `GET /api/courses/<slug>/batches/`, `POST /api/enroll/` accepts `batch`, `GET /api/my-courses/` returns `batch` |

Images need no switch: `CourseThumb` and `Avatar` use `image_url` (course) and `photo_url` (instructor) when the API sends them, and draw a generated placeholder otherwise.
The receipt page uses `/api/my-courses/` and needs no new endpoint.

## Decisions and gotchas

- Password reset: links are built from `FRONTEND_URL`, valid 2 hours (`PASSWORD_RESET_TIMEOUT`), single use (Django token), rate limited to 10 requests per hour per visitor (request and confirm share the limit). The request endpoint never reveals whether an email has an account, and an email failure is logged, not shown. In development emails are **printed to the server console** (`EMAIL_BACKEND=console`); for real delivery set the SMTP variables in `.env` (see `.env.example`).
- Batches: if a course has active batches, enrolling **requires** a batch (400 otherwise); the batch must belong to the course and have a free seat, checked again at payment time. A student can change batch while the enrollment is still pending. Courses without batches work as before.
- Batch `days` are stored as text ("Mon,Wed,Fri") and validated; the API returns them as a list in week order. Batch `seats_left` counts paid enrollments in that batch.

- Payments go through `backend/enrollments/payments.py`. `get_gateway()` returns `MockGateway` (default) or `RazorpayGateway` based on `PAYMENT_GATEWAY`. Views never depend on a specific provider.
- Razorpay structure is in place but has **never run against the real Razorpay API** (no keys yet). Order creation, signature checks and the webhook are covered by tests using a stubbed API and real HMAC math. The frontend popup is covered by a browser test with a stand-in Razorpay window.
- `Enrollment.gateway_order_id` links a Razorpay order to an enrollment. `enrollments/services.py` (`mark_paid`, `mark_failed`) is the only place that changes payment status; it is idempotent and never downgrades a paid enrollment.
- Razorpay amounts are in paise (fee x 100). Keys come from the environment, never from code.
- Known small risk: seats are checked before the order is created, not at capture time, so a last-seat race can oversell. Revisit when going live.
- MySQL cannot create conditional unique constraints, so "one paid enrollment per student and course" is enforced in `PayView` (and tested). Check `models.W036` is silenced for this reason.
- `mysqlclient` needs system headers, so the project uses the pure-Python `PyMySQL` driver (installed as MySQLdb in `config/settings.py`).
- Portfolio page: content is in `pages/Portfolio.jsx`; the email in `OWNER` (`lib/site.js`) is a placeholder until the owner sets it. LearnHub itself is not linked there because its repo is private.
- Frontend contact details live in `frontend/src/lib/site.js` and are placeholders until the owner fills them in.
- Dark mode: toggled in the navbar, stored in localStorage (`theme`), applied before first paint by a script in `index.html`. It works by remapping colour variables in `index.css` (`.dark { ... }`), so components use semantic classes: `bg-surface`, `text-brand`, `text-brand-strong`. Do not hard-code `bg-white` or `text-brand-600`.
- Data pages use `useFetch` (lib/hooks.js) for loading skeletons, error states with "Try again", and 404 handling. Every page calls `useTitle`.
- Accessibility baseline: skip link, focus ring (base layer), route changes move focus to `<main>`, keyboard-navigable tabs, labelled forms and tables. Verified with axe-core on every page in light and dark (0 violations). Keep it that way.
- After a deliberate logout, protected pages send the user home (not to login). See `RequireAuth` and `AuthProvider.loggedOut`.

- Playful redesign: colours are tokens in `index.css` (`brand`, `coral`, `sun`, `mint`, `sky`, plus semantic `surface`, `brand`, `brand-strong`). On white pills and buttons over gradients use a fixed dark text colour (not `text-slate-900` or `text-brand-strong`, which dark mode remaps to light). Fonts load from Google Fonts (Fredoka for headings, Nunito for body).
- Course list: the Courses, Home, Saved and Compare pages load every course once through `lib/catalog.js` (`fetchAllCourses`, pages through `/api/courses/`) and filter in the browser. Fine for a small catalog; move filtering back to the API if the catalog grows to hundreds.
- Device-only data (`lib/store.js`): saved courses, recently viewed, compare picks (session only) and lesson completion live in this browser's storage, are labelled "saved on this device", and are not linked to the account. A backend progress endpoint would be needed to sync them.
- Page width: use the `.shell` class (index.css) for any full-width container; do not hard-code `max-w-6xl`. Max width is 1450px.
- SEO: set `VITE_SITE_URL` when building the frontend (canonical links, og tags and robots.txt use it) and `SITE_URL` or `FRONTEND_URL` on the backend (sitemap.xml). Both default to placeholders. The production web server must serve `/sitemap.xml` from the backend (the dev server proxies it). Pass `{ noindex: true }` to `useTitle` on any private page. The app is client-side rendered, so Google sees content only after running JavaScript; prerendering or server rendering the course pages would be the next SEO step. Search Console verification needs the live domain and the owner's Google account.
- HTTPS: set `FORCE_HTTPS=1` in production behind a proxy that sends `X-Forwarded-Proto`; off by default for local work.
- Stretched card links: interactive controls on a `CourseCard` (heart, compare checkbox) need `relative z-10` or the title link's overlay covers them.
- Admin login is by email (`USER_NAME_FIELD=email`). Create the admin with `python manage.py createsuperuser`; credentials are never committed.

## Progress log

| Date | What happened |
|---|---|
| 2026-10-01 | Repo `learnhub` created. Initial scaffold: Django REST backend (auth, courses, enrollment with mock payment, admin, tests) and React frontend (catalog, auth, checkout). |
| 2026-10-01 | Frontend expanded to 15 pages: About, Contact, Instructors, FAQ, Dashboard, Profile, Payment history, Course space. Responsive navbar, footer, favicon. |
| 2026-10-01 | Backend expanded: Instructor model (with data migration from the old name field), Lesson model and enrolled-only lessons endpoint, contact endpoint with rate limit, change-password endpoint, double-payment guard. 23 tests pass on MySQL. Frontend wired to all of it; full flow verified in a browser. |
| 2026-10-01 | Added this Agent.md and a CLAUDE.md that loads it. |
| 2026-10-01 | Frontend round 2: password reset pages, batch picker and weekly timetable, course and instructor images (generated placeholders), printable receipt, dark mode, loading skeletons and error states, accessibility pass. Password reset and batches run on sample data behind `features.js` switches. axe-core: 0 violations on all pages, light and dark; full flow verified in a browser. |
| 2026-10-01 | Backend for the two sample features: password reset by email (request + confirm, console email in dev, SMTP via env, rate limited) and batches (model, endpoint, batch on enrollment with seat limits, admin, seed data). Frontend switches turned on. 57 backend tests pass on MySQL; real reset email, real batches, seat limits and accessibility verified in a browser against the live backend. |
| 2026-10-01 | Razorpay structure added (off by default): `RazorpayGateway`, signature verification, webhook endpoint, `gateway_order_id`, `/api/payments/config/`, frontend `lib/razorpay.js` and Checkout hook. 38 backend tests pass; mock and stubbed-Razorpay checkout verified in a browser. Not yet tested with real Razorpay keys. |
| 2026-10-01 | Frontend upgrade (playful look, real API only): purple/coral/sun/mint palette and Fredoka + Nunito fonts, colourful Home (stats, subject tiles, how it works, instructors), Courses page with instant filters (subject chips, format, price, seats available, sort, pagination, URL synced), compare (up to 3) and Saved pages, recently viewed, similar courses, next-class card, lesson checkboxes with progress bars, add-to-calendar (.ics), confetti on enrollment, scroll-reveal and page fade (respect reduced motion). axe-core 0 violations on all pages, light and dark; 57 backend tests pass; flow verified in a browser. |
| 2026-10-01 | Added the `/portfolio` page (About me, roles, skills, projects, contact), linked from the navbar and footer. Owner details live in `OWNER` in `frontend/src/lib/site.js`. axe-core 0 violations in light and dark, no horizontal scroll at 390px. |
| 2026-10-01 | Layout: content width capped at 1450px through one `.shell` class (navbar, main, footer, compare bar) with side padding that grows with the screen; course grids go to 4 columns from 1280px; navbar switches to the mobile menu below 1024px (it overflowed at tablet widths). Checked at 360, 768, 1024, 1366, 1440, 1920 and 2560px: no horizontal scroll; axe-core clean at 360 and 1920. |
| 2026-10-01 | SEO pass: `useTitle(title, opts)` now sets title, meta description, canonical (query strings ignored), Open Graph and Twitter tags, robots (noindex on private, login, compare, saved and 404 pages) and JSON-LD (Organization + WebSite on Home, Course on course pages, Person on instructor and portfolio pages). Added share image `public/og-image.png`, `robots.txt` (built from `frontend/robots.txt.template`), dynamic `/sitemap.xml` from the database (backend, tested), and `FORCE_HTTPS` settings (redirect, HSTS, secure cookies). Browser checks on 8 public and 11 private pages, a 23-page link crawl (0 broken), LCP about 1.3s and CLS under 0.02 locally. 58 backend tests pass. |

## Status

**Done**
- Registration, login, JWT refresh, profile edit, change password, forgot/reset password by email
- Batches with weekly timetable and per-batch seat limits
- Course catalog with subject / format / search filters
- Instructors (list and profile pages), lessons, schedule
- Enrollment and checkout with seat limits (mock payment), payment history
- Playful redesign: course discovery (filters, compare, saved), student dashboard (next class, progress, calendar)
- Contact form stored in the database (view it in Django admin)
- Django admin for all models

**Go-live checklist for Razorpay (owner action needed)**
1. Create a Razorpay account and copy the **test** Key ID and Key Secret.
2. In `backend/.env` set `PAYMENT_GATEWAY=razorpay`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
3. In the Razorpay dashboard add a webhook to `https://<your-domain>/api/payments/razorpay/webhook/` with events `payment.captured` and `payment.failed`, and put its secret in `RAZORPAY_WEBHOOK_SECRET`. (Webhooks need a public URL; use a tunnel such as ngrok when testing locally.)
4. Make one test payment with Razorpay test cards, confirm the enrollment turns paid, then switch to live keys.

**Next (pick in this order unless told otherwise)**
1. Test Razorpay end to end with real test keys, then handle refunds and last-seat races
2. Email: welcome email and payment receipt email (the email plumbing and settings exist; password reset already uses them)
3. Batches and timetable for offline and online classes
4. Course images and instructor photos (file uploads)
5. Production setup: Gunicorn, environment variables, static files, deployment

**Known gaps**
- Emails are only printed to the console until SMTP is configured in `.env`
- No refunds or cancellations
- Razorpay integration is untested against the live API
- Real course thumbnails and instructor photos need an upload field on the backend (frontend is ready)
