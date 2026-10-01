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

- `accounts.User`: email login, full_name, phone, `role` (student / staff / superadmin). `role` drives the frontend admin area; `save()` keeps it in step with Django's `is_staff` / `is_superuser` (a role change in code wins, otherwise the flags win). `role` is read-only on `/api/auth/me/`
- `courses.Subject`, `courses.Instructor`, `courses.Course` (mode: online / offline / hybrid, fee, seats, start_date, location), `courses.Batch` (weekly slot: days, times, optional own start date / format / seats), `courses.Lesson` (video / reading / live / assignment)
- `enrollments.Enrollment`: student + course + batch, status pending / paid / failed, payment_ref
- `contact.ContactMessage`: messages from the contact form (rate limited to 5 per hour per visitor)

## API summary

Auth: `POST /api/auth/register|login|refresh/`, `GET/PATCH /api/auth/me/`, `POST /api/auth/change-password/`, `POST /api/auth/password-reset/` and `/password-reset/confirm/`
Public: `GET /api/subjects/`, `/api/courses/?subject=&mode=&q=`, `/api/courses/<slug>/`, `/api/instructors/`, `/api/instructors/<slug>/`, `/api/courses/<slug>/batches/`, `POST /api/contact/`
Payments: `GET /api/payments/config/` (active gateway), `POST /api/payments/razorpay/webhook/` (called by Razorpay)
Staff (role staff or superadmin; 401 anonymous, 403 students): `/api/manage/{subjects,instructors,courses,batches,lessons}/` full CRUD, paginated, including unpublished items. See `PHASES.md` for the rules.
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

- Design system (ink and emerald, from `web-dev-skills/design-taste`): Persuade mode for Home, Courses, Portfolio; Operate mode for the student area. One accent (emerald, `brand-*` and `accent-fill` tokens) on near-black ink and soft off-white; neutrals are oklch tinted slightly green and live in the `slate-*` scale in `index.css`, remapped under `.dark`. Light and dark both ship. Use the component classes `btn btn-primary|btn-ink|btn-quiet`, `card` (border only, no shadow), `field`, `tag`, `link-draw`; radius is 16px for cards and 12px for controls. Filled accent buttons use `text-[var(--color-on-accent)]`, never `text-white` (dark mode flips the accent to a bright emerald). Numbers use the `num` class (tabular figures). No gradients, no emoji, no decorative shapes.
- Fonts are self-hosted through `@fontsource-variable` (Geist body, Bricolage Grotesque headings, Geist Mono available), imported in `main.jsx`. Do not add a Google Fonts link.
- Icons: Phosphor only (`@phosphor-icons/react`). No hand-drawn SVG icons or illustrations.
- Motion: Motion library (`motion/react`), `MotionConfig reducedMotion="user"` in `main.jsx`. Easing `--ease-out-strong` (0.23, 1, 0.32, 1), UI under 300ms, only transform and opacity. Press feedback `active:scale-[0.97]` on `.btn`. Hover styles go through the `hover-fine:` and `group-hover-fine:` variants (pointer devices only). Scroll reveals (`Reveal` in `Fun.jsx`) are for marketing sections only. Shared motion: `layoutId` for nav underline, subject chips and course tabs; `AnimatePresence popLayout` for filtered course results; spring slide-up compare bar; hero preview stack with pointer parallax via `useMotionValue`/`useSpring`; scroll-linked line in Home "How it works" via `useScroll`; `DrawnCheck` after enrolling replaces the old confetti; route change is a 160ms opacity fade (`.page-in`). No window scroll listeners (the navbar edge uses an IntersectionObserver sentinel).
- Images: course covers are typographic tiles (subject icon plus name) and instructor avatars are solid monograms until real files exist. Real images use `image_url` / `photo_url` automatically. The site still needs real course images and instructor photos; do not fake them with gradients or illustrations.
- Run `node web-dev-skills/design-taste/scripts/preflight.mjs frontend/src` before committing frontend changes; it must report 0 hard violations. Zero em dashes anywhere in UI text.
- Pages except Home are lazy loaded in `App.jsx` to keep the first bundle small. `/faq` also emits FAQPage JSON-LD.
- Course list: the Courses, Home, Saved and Compare pages load every course once through `lib/catalog.js` (`fetchAllCourses`, pages through `/api/courses/`) and filter in the browser. Fine for a small catalog; move filtering back to the API if the catalog grows to hundreds.
- Device-only data (`lib/store.js`): saved courses, recently viewed, compare picks (session only) and lesson completion live in this browser's storage, are labelled "saved on this device", and are not linked to the account. A backend progress endpoint would be needed to sync them.
- Page width: use the `.shell` class (index.css) for any full-width container; do not hard-code `max-w-6xl`. Max width is 1450px.
- SEO: set `VITE_SITE_URL` when building the frontend (canonical links, og tags and robots.txt use it) and `SITE_URL` or `FRONTEND_URL` on the backend (sitemap.xml). Both default to placeholders. The production web server must serve `/sitemap.xml` from the backend (the dev server proxies it). Pass `{ noindex: true }` to `useTitle` on any private page. The app is client-side rendered, so Google sees content only after running JavaScript; prerendering or server rendering the course pages would be the next SEO step. Search Console verification needs the live domain and the owner's Google account.
- HTTPS: set `FORCE_HTTPS=1` in production behind a proxy that sends `X-Forwarded-Proto`; off by default for local work.
- Emails: build them with `email_layout` and send with `send_email` (both in `accounts/emails.py`); `send_email` swallows and logs errors on purpose. Receipts are sent only when `mark_paid` makes the first change to paid. No email is sent for failed payments.
- Stretched card links: interactive controls on a `CourseCard` (heart, compare checkbox) need `relative z-10` or the title link's overlay covers them.
- Frontend admin area lives at `/manage` (guard: `RequireStaff`, layout: `pages/admin/AdminLayout.jsx`; each phase of `PHASES.md` adds its links to `LINKS`). It is not `/admin`, which is Django admin on the API server. The navbar shows an Admin link only to staff and super admins; students who open `/manage` are sent to their dashboard.
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
| 2026-10-01 | Emails: welcome email on registration and payment receipt email on the first successful payment (HTML + plain text, shared layout in `accounts/emails.py`, receipt in `enrollments/emails.py`, sent from `services.mark_paid` so webhook retries never send twice). Sending never raises, so a mail outage cannot break signup or payment. 9 new tests (67 total pass on MariaDB); real flow checked end to end with console emails. |
| 2026-10-01 | Redesign to stop reading as AI-made, using `web-dev-skills/design-taste` (look chosen by the owner: ink and emerald). New tokens (oklch, one accent, light and dark), self-hosted Geist and Bricolage Grotesque, Phosphor icons, Motion library. Removed the purple/coral gradients, floating shapes, emoji, confetti, stat tiles, three-equal-card grids and Google Fonts. Home rebuilt (asymmetric hero with a live course preview, typographic subject rows, one large plus two small featured courses, scroll-linked steps), ruled-list layouts for About, FAQ, Instructors and Portfolio, typographic course covers, animated filters, nav underline, compare bar and enrollment check. Route-level code splitting, FAQPage schema, new share image. Pre-flight 0 violations; axe 0 violations on public pages (light, dark, 390px) and student pages; 67 backend tests pass. |
| 2026-10-01 | Image generation attempted and paused by the owner. Higgsfield has 0 credits (free plan); Canva generates images but only returns 199px previews to the workspace, so nothing usable was saved. No code changed. Covers stay typographic and avatars stay monograms. To resume: add Higgsfield credits (nano_banana is the budget model) or export full-size images from Canva, then add an image upload field on the backend and serve `image_url` / `photo_url`. Use real photos for instructors, not generated people. |
| 2026-10-01 | Portfolio content refreshed from the owner's latest resume (all 6 roles, full skill groups, 4 real shipped projects with live/GitHub links, education, certifications), real photo added (replacing the monogram avatar), marks/CGPA removed from education for privacy, Achievements section added (students trained, years experience, certifications, platforms shipped, tests written) styled to match the ink/emerald system rather than generic badge icons, and hero polish (stagger entrance motion, location tag, accent ring on the avatar). Local dev environment set up (Python venv, MySQL migrate + seed, both dev servers running). A superuser (`learnhubadmin@learnhub.com`) was created for Django admin access at `/admin` — the frontend has no separate admin dashboard yet. |
| 2026-10-01 | Wrote `PHASES.md`: a phased plan for a proper in-frontend admin dashboard (today only Django admin at `/admin` exists; the React app has zero staff-only pages or API endpoints, and `User` has no `role` field). Phases: 0 foundations (role field, RequireStaff guard, admin shell), 1 staff-only DRF API, 2 courses/subjects/instructors UI, 3 enrollments & payments dashboard, 4 contact inbox, 5 staff/student directory, 6 dashboard home, 7 polish and audit. Each phase needs the owner's approval before work starts. |
| 2026-10-01 | Admin dashboard Phase 0 (approved by the owner): `User.role` with migration and backfill (existing superuser became `superadmin`), role and Django flags kept in sync in `save()`, `role` returned by `/api/auth/me/` (read-only), `RequireStaff` guard and `/manage` admin shell with sidebar and a navbar link shown only to staff. Frontend path is `/manage` because `/admin` is Django admin. Also replaced em dashes in the owner's portfolio certificate list. 73 backend tests pass (6 new); build, pre-flight 0 violations; staff, student and anonymous access and axe (light, dark) checked in a browser. |
| 2026-10-01 | Admin dashboard Phase 1 (approved by the owner): staff-only DRF API at `/api/manage/` for subjects, instructors, courses, batches and lessons (`IsStaffRole` permission, write serializers with validation, counts of paid and total enrollments, filters, pagination). Deleting protected items returns 409 with advice to unpublish. 21 new tests cover 401 for anonymous, 403 for students, staff CRUD, validation and delete safety; 94 backend tests pass on MariaDB. No frontend changes. |
| 2026-10-01 | Admin dashboard Phase 2 (approved by the owner): `/manage` screens for Courses (search, status filter, inline publish switch, create, edit, delete), Subjects and Instructors (dialog forms), with Batches and Lessons edited from the course page. Client checks mirror the backend rules and server errors show under the field; 409 delete advice shown in the confirm dialog. New `lib/manage.js`, `components/admin/Kit.jsx`, `pages/admin/*`. Full CRUD flow, validation, delete safety and axe (light and dark) checked in a browser; build, pre-flight 0 violations, 94 backend tests pass. |

## Status

**Done**
- Registration, login, JWT refresh, profile edit, change password, forgot/reset password by email
- Batches with weekly timetable and per-batch seat limits
- Course catalog with subject / format / search filters
- Instructors (list and profile pages), lessons, schedule
- Enrollment and checkout with seat limits (mock payment), payment history
- Welcome and payment receipt emails (console in dev, SMTP when configured)
- Ink and emerald redesign: course discovery (filters, compare, saved), student dashboard (next class, progress, calendar), motion system
- Contact form stored in the database (view it in Django admin)
- Django admin for all models

**Go-live checklist for Razorpay (owner action needed)**
1. Create a Razorpay account and copy the **test** Key ID and Key Secret.
2. In `backend/.env` set `PAYMENT_GATEWAY=razorpay`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
3. In the Razorpay dashboard add a webhook to `https://<your-domain>/api/payments/razorpay/webhook/` with events `payment.captured` and `payment.failed`, and put its secret in `RAZORPAY_WEBHOOK_SECRET`. (Webhooks need a public URL; use a tunnel such as ngrok when testing locally.)
4. Make one test payment with Razorpay test cards, confirm the enrollment turns paid, then switch to live keys.

**Next (pick in this order unless told otherwise)**
1. Admin dashboard, built phase by phase from `PHASES.md` (Phases 0 to 2 done; Phase 3, the enrollments and payments dashboard, is next). Each phase needs the owner's approval before it starts.
2. Test Razorpay end to end with real test keys, then handle refunds and last-seat races
3. Course images and instructor photos: backend upload fields, then full-size course covers (needs Higgsfield credits or Canva exports) and real instructor photos
4. Production setup: Gunicorn, environment variables, static files, deployment

**Known gaps**
- Emails (reset, welcome, receipt) are only printed to the console until SMTP is configured in `.env`
- No refunds or cancellations
- Razorpay integration is untested against the live API
- Real course thumbnails and instructor photos need an upload field on the backend (frontend is ready); until then covers are typographic and avatars are monograms
