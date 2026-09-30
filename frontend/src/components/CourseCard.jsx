import { Link } from "react-router-dom";
import { CourseThumb } from "./Media.jsx";

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

export default function CourseCard({ course, as: Heading = "h3" }) {
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-surface shadow-sm transition hover:shadow-md"
    >
      <CourseThumb course={course} />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{course.subject.name}</span>
          <ModeBadge mode={course.mode} label={course.mode_display} />
        </div>
        <Heading className="text-lg font-semibold">{course.title}</Heading>
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{course.description}</p>
        <div className="mt-auto flex items-end justify-between pt-4">
          <span className="text-sm text-slate-500">{course.duration_weeks} weeks</span>
          <span className="text-lg font-bold text-brand">{inr(course.fee)}</span>
        </div>
      </div>
    </Link>
  );
}
