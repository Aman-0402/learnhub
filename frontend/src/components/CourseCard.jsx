import { Link } from "react-router-dom";

export const inr = (v) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

const badge = {
  online: "bg-emerald-50 text-emerald-700",
  offline: "bg-amber-50 text-amber-700",
  hybrid: "bg-sky-50 text-sky-700",
};

export function ModeBadge({ mode, label }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge[mode]}`}>{label}</span>;
}

export default function CourseCard({ course }) {
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{course.subject.name}</span>
        <ModeBadge mode={course.mode} label={course.mode_display} />
      </div>
      <h3 className="text-lg font-semibold">{course.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{course.description}</p>
      <div className="mt-auto flex items-end justify-between pt-4">
        <span className="text-sm text-slate-500">{course.duration_weeks} weeks</span>
        <span className="text-lg font-bold text-brand-600">{inr(course.fee)}</span>
      </div>
    </Link>
  );
}
