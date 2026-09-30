import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { inr, ModeBadge } from "../components/CourseCard.jsx";

export default function CourseDetail() {
  const { slug } = useParams();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api(`/courses/${slug}/`, { auth: false }).then(setCourse).catch((e) => setError(e.message)); }, [slug]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!course) return <p className="text-slate-500">Loading…</p>;
  const full = course.seats_left === 0;
  const rows = [
    ["Duration", `${course.duration_weeks} weeks`],
    course.start_date && ["Starts", new Date(course.start_date).toLocaleDateString("en-IN", { dateStyle: "long" })],
    course.instructor && ["Instructor", course.instructor_slug ? <Link key="i" to={`/instructors/${course.instructor_slug}`} className="text-brand-600 hover:underline">{course.instructor}</Link> : course.instructor],
    course.location && ["Location", course.location],
    course.seats_left != null && ["Seats left", String(course.seats_left)],
  ].filter(Boolean);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-3 flex items-center gap-3">
          <span className="text-sm font-medium uppercase tracking-wide text-slate-500">{course.subject.name}</span>
          <ModeBadge mode={course.mode} label={course.mode_display} />
        </div>
        <h1 className="text-3xl font-bold">{course.title}</h1>
        <p className="mt-4 whitespace-pre-line text-slate-700">{course.description}</p>
      </div>
      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-3xl font-bold text-brand-600">{inr(course.fee)}</p>
        <dl className="mt-4 space-y-2 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4"><dt className="text-slate-500">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
          ))}
        </dl>
        {full ? (
          <p className="mt-6 rounded-lg bg-slate-100 px-4 py-2.5 text-center font-medium text-slate-600">Course is full</p>
        ) : (
          <Link to={`/checkout/${course.slug}`} className="mt-6 block rounded-lg bg-brand-600 px-4 py-2.5 text-center font-semibold text-white hover:bg-brand-700">
            Enroll now
          </Link>
        )}
      </aside>
    </div>
  );
}
