# LearnHub

A website to sell online and offline classes across multiple subjects. Students register, browse courses, enroll and pay the fee.

**Stack:** React (Vite) + Tailwind CSS · Django REST Framework + JWT · MySQL

## Features (v0.1)
- Student registration and login (email + password, JWT)
- Course catalog with subject, format (online / offline / hybrid) and text filters
- Enrollment and checkout, with seat limits and duplicate-enrollment protection
- "My courses" page
- Dark mode, loading and error states, printable receipts, and an accessibility-checked UI
- Password reset by email and class batches with seat limits
- Django admin for subjects, courses, students and enrollments
- Instructors, lessons and schedule, a contact form and change-password
- Payments: **mock by default**. Razorpay is wired in (`backend/enrollments/payments.py`, webhook at `/api/payments/razorpay/webhook/`) and switches on with `PAYMENT_GATEWAY=razorpay` plus your keys in `backend/.env`. See `Agent.md` for the go-live checklist.

## Frontend highlights
Playful colourful design with dark mode, instant course filters (subject, format, price, seats, sort), compare up to 3 courses, saved courses, recently viewed, next-class card, lesson progress and calendar export. Saved courses, recently viewed and lesson progress are stored in your browser only.

## Run locally

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # set DB_* for MySQL, or DB_ENGINE=sqlite for quick dev
python manage.py migrate
python manage.py seed_demo  # optional sample courses
python manage.py createsuperuser
python manage.py runserver
```
Create the MySQL database first: `CREATE DATABASE learnhub CHARACTER SET utf8mb4;`

### Frontend
```bash
cd frontend
npm install
npm run dev    # http://localhost:5173, proxies /api to Django on :8000
```

### Tests
```bash
cd backend && DB_ENGINE=sqlite python manage.py test
```

## API
| Method | Path | Auth |
|---|---|---|
| POST | `/api/auth/register/`, `/api/auth/login/`, `/api/auth/refresh/` | no |
| GET/PATCH | `/api/auth/me/` | yes |
| POST | `/api/auth/change-password/` | yes |
| POST | `/api/auth/password-reset/`, `/api/auth/password-reset/confirm/` | no |
| GET | `/api/courses/<slug>/batches/` | no |
| GET | `/api/subjects/`, `/api/courses/?subject=&mode=&q=`, `/api/courses/<slug>/` | no |
| GET | `/api/instructors/`, `/api/instructors/<slug>/` | no |
| POST | `/api/contact/` (5 per hour per visitor) | no |
| POST | `/api/enroll/` `{course, batch}` then `/api/enrollments/<ref>/pay/` | yes |
| GET | `/api/my-courses/` | yes |
| GET | `/api/courses/<slug>/lessons/` (paid students and staff) | yes |

See `Agent.md` for project rules, decisions and the progress log.
