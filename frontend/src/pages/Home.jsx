import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { fetchAllCourses } from "../lib/catalog.js";
import { useFetch, useTitle } from "../lib/hooks.js";
import { CHIP_TINTS } from "../lib/colors.js";
import CourseCard from "../components/CourseCard.jsx";
import { Avatar } from "../components/Media.jsx";
import { CountUp, Reveal } from "../components/Fun.jsx";
import { CardGridSkeleton, ErrorState } from "../components/States.jsx";

const STEPS = [
  ["1", "Create your account", "Sign up with your email in under a minute.", "bg-brand-100"],
  ["2", "Pick a course", "Filter by subject, format, price and start date.", "bg-sun/30"],
  ["3", "Choose a batch and pay", "Select a weekly slot that suits you and pay the fee.", "bg-coral/20"],
  ["4", "Start learning", "Open your course space, follow the timetable, finish lessons.", "bg-mint/25"],
];

function Shapes() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="absolute -right-10 -top-10 h-48 w-48 animate-float-slow rounded-full bg-white/10" />
      <span className="absolute right-24 top-24 h-12 w-12 animate-float rounded-2xl bg-sun" />
      <span className="absolute bottom-10 right-1/3 h-8 w-8 animate-float-slow rounded-full bg-coral" />
      <span className="absolute bottom-16 right-10 h-16 w-16 animate-float rounded-full bg-mint/90" />
      <span className="absolute left-1/2 top-8 h-6 w-6 rotate-45 animate-float rounded-md bg-sky" />
    </div>
  );
}

export default function Home() {
  useTitle("");
  const courses = useFetch(() => fetchAllCourses());
  const subjects = useFetch(() => api("/subjects/", { auth: false }));
  const instructors = useFetch(() => api("/instructors/", { auth: false }));

  const all = courses.data || [];
  const subjectList = subjects.data?.results || subjects.data || [];
  const instructorList = instructors.data?.results || instructors.data || [];
  const countFor = (slug) => all.filter((c) => c.subject.slug === slug).length;
  const featured = all.slice(0, 3);
  const stats = [
    [all.length, "courses"],
    [subjectList.length, "subjects"],
    [instructorList.length, "instructors"],
  ];

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-600 via-[#8b5cf6] to-coral px-6 py-14 text-white sm:px-12 sm:py-20">
        <Shapes />
        <div className="relative max-w-2xl">
          <p className="mb-3 inline-block rounded-full bg-white px-3 py-1 text-sm font-bold text-[#5a2bd0]">Online · Offline · Hybrid</p>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-6xl">Learning that feels like play.</h1>
          <p className="mt-4 max-w-xl text-lg font-semibold text-white">Join live classes online or in the classroom, across every subject. Register, pick a batch, pay the fee and start.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/courses" className="rounded-full bg-white px-6 py-3 font-bold text-[#5a2bd0] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">Browse courses</Link>
            <Link to="/register" className="rounded-full border-2 border-white px-6 py-3 font-bold transition hover:bg-white/15">Create free account</Link>
          </div>
        </div>
      </section>

      {all.length > 0 && (
        <section aria-label="LearnHub at a glance" className="-mt-8 grid grid-cols-3 gap-3 sm:gap-6">
          {stats.map(([n, label], i) => (
            <Reveal key={label} delay={i * 80} className="rounded-3xl border border-slate-200 bg-surface p-4 text-center shadow-sm sm:p-6">
              <p className="font-display text-3xl font-bold text-brand sm:text-4xl"><CountUp value={n} /></p>
              <p className="text-sm font-bold text-slate-600">{label}</p>
            </Reveal>
          ))}
        </section>
      )}

      {subjectList.length > 0 && (
        <section aria-labelledby="subjects">
          <h2 id="subjects" className="mb-5 font-display text-2xl font-bold">Pick a subject</h2>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {subjectList.map((s, i) => {
              const n = countFor(s.slug);
              return (
                <li key={s.id}>
                  <Link to={`/courses?subject=${s.slug}`} className={`block rounded-3xl p-5 text-slate-900 transition hover:-translate-y-1 hover:rotate-1 hover:shadow-lg ${CHIP_TINTS[i % CHIP_TINTS.length]}`}>
                    <span className="block font-display text-lg font-semibold">{s.name}</span>
                    <span className="text-sm font-semibold text-slate-700">{courses.data ? `${n} ${n === 1 ? "course" : "courses"}` : " "}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="how">
        <h2 id="how" className="mb-5 font-display text-2xl font-bold">How it works</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([n, t, d, tint], i) => (
            <Reveal as="li" key={n} delay={i * 90} className="rounded-3xl border border-slate-200 bg-surface p-5">
              <span className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl font-display text-lg font-bold text-slate-900 ${tint}`}>{n}</span>
              <h3 className="font-display text-lg font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-slate-600">{d}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section aria-labelledby="featured">
        <div className="mb-5 flex items-end justify-between">
          <h2 id="featured" className="font-display text-2xl font-bold">Featured courses</h2>
          <Link to="/courses" className="font-bold text-brand hover:underline">See all</Link>
        </div>
        {courses.loading && <CardGridSkeleton />}
        {courses.error && <ErrorState message={courses.error} onRetry={courses.reload} />}
        {courses.data && <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{featured.map((c) => <CourseCard key={c.id} course={c} />)}</div>}
      </section>

      {instructorList.length > 0 && (
        <section aria-labelledby="teachers">
          <div className="mb-5 flex items-end justify-between">
            <h2 id="teachers" className="font-display text-2xl font-bold">Meet your instructors</h2>
            <Link to="/instructors" className="font-bold text-brand hover:underline">All instructors</Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {instructorList.slice(0, 4).map((t) => (
              <li key={t.id}>
                <Link to={`/instructors/${t.slug}`} className="flex h-full items-center gap-3 rounded-3xl border border-slate-200 bg-surface p-4 transition hover:-translate-y-1 hover:shadow-lg">
                  <Avatar name={t.name} />
                  <span><span className="block font-display font-semibold">{t.name}</span><span className="line-clamp-2 text-sm text-slate-600">{t.headline}</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="relative overflow-hidden rounded-[2rem] bg-brand-100 px-6 py-12 text-center">
        <h2 className="font-display text-3xl font-bold text-slate-900">Ready to start?</h2>
        <p className="mx-auto mt-2 max-w-md font-semibold text-slate-700">Create a free account and enroll in your first class today.</p>
        <Link to="/register" className="mt-6 inline-block rounded-full bg-brand-600 px-7 py-3 font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-700">Sign up free</Link>
      </section>
    </div>
  );
}
