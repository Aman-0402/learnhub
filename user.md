# Demo users

Local/dev demo data only, seeded by `python manage.py seed_demo` then
`python manage.py seed_people` (backend). **Do not seed this on a real
production database.** None of these are real people; names and bios are
made up for the demo.

Re-running `seed_people` is safe (idempotent) — it skips anything that
already exists by email/title.

## Students (10)

All students share one password: **`Student@123`**

Each is enrolled in 2 courses with a realistic mix of statuses (mostly paid,
a couple pending, one failed) so the enrollments dashboard, revenue summary
and "My courses" pages all have real-looking activity instead of sitting
empty.

| # | Name | Email | Enrollments |
|---|---|---|---|
| 1 | Aarav Shah | `aarav.shah@student.learnhub.test` | Geometry Workshop (paid), Algebra Foundations (paid) |
| 2 | Ishita Patel | `ishita.patel@student.learnhub.test` | Python for Beginners (paid), Geometry Workshop (paid) |
| 3 | Rohan Gupta | `rohan.gupta@student.learnhub.test` | AWS Cloud and DevOps Essentials (paid), Physics Made Simple (pending) |
| 4 | Sneha Reddy | `sneha.reddy@student.learnhub.test` | UI/UX Design Fundamentals (paid), Spoken English Bootcamp (paid) |
| 5 | Karan Malhotra | `karan.malhotra@student.learnhub.test` | Backend Systems Design (paid), Python for Beginners (failed) |
| 6 | Pooja Nair | `pooja.nair@student.learnhub.test` | Algebra Foundations (paid), Web Development with React (paid) |
| 7 | Yash Agarwal | `yash.agarwal@student.learnhub.test` | Spoken English Bootcamp (paid), Full-Stack Web Development Bootcamp (paid) |
| 8 | Riya Singh | `riya.singh@student.learnhub.test` | Full-Stack Web Development Bootcamp (paid), AWS Cloud and DevOps Essentials (pending) |
| 9 | Dev Patel | `dev.patel@student.learnhub.test` | Machine Learning Foundations (paid), Data Analytics with Python (paid) |
| 10 | Anjali Verma | `anjali.verma@student.learnhub.test` | Mobile App Development with React Native (paid), Machine Learning Foundations (paid) |

Log in at `/login` with any email above and `Student@123`.

## Instructors (10)

Instructors have no login (the `Instructor` model is a profile only, not a
`User` account — see `Agent.md`). Each got their own new course so instructor
pages, the catalog and the subject list all look populated rather than
funneling through the 4 instructors `seed_demo` already creates.

| # | Name | Email (profile only, no login) | Teaches | Course created |
|---|---|---|---|---|
| 1 | Ananya Krishnan | `ananya.krishnan@learnhub.test` | Full-Stack Web Development | Full-Stack Web Development Bootcamp |
| 2 | Vikram Desai | `vikram.desai@learnhub.test` | Cloud and DevOps Engineer | AWS Cloud and DevOps Essentials |
| 3 | Priya Sharma | `priya.sharma@learnhub.test` | Data Science and Analytics | Data Analytics with Python |
| 4 | Arjun Mehta | `arjun.mehta@learnhub.test` | Machine Learning Engineer | Machine Learning Foundations |
| 5 | Neha Kapoor | `neha.kapoor@learnhub.test` | UI/UX Design | UI/UX Design Fundamentals |
| 6 | Rahul Iyer | `rahul.iyer@learnhub.test` | Cybersecurity Specialist | Cybersecurity Basics |
| 7 | Divya Menon | `divya.menon@learnhub.test` | Mobile App Development | Mobile App Development with React Native |
| 8 | Siddharth Rao | `siddharth.rao@learnhub.test` | Backend Systems Architect | Backend Systems Design |
| 9 | Kavya Pillai | `kavya.pillai@learnhub.test` | Digital Marketing | Digital Marketing Masterclass |
| 10 | Aditya Joshi | `aditya.joshi@learnhub.test` | Competitive Programming Coach | Competitive Programming and DSA |

## Admin / staff

Not created by `seed_people` — created separately with
`python manage.py createsuperuser`. The current super admin:

- `learnhubadmin@learnhub.com` — super admin, access `/manage` or Django admin at `/admin`
