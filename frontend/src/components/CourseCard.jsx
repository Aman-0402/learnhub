import { Link } from "react-router-dom";
import { CourseThumb } from "./Media.jsx";
import { HeartButton } from "./Fun.jsx";
import { useCompare, useWishlist } from "../lib/store.js";

export const inr = (v) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

const badge = {
  online: "bg-emerald-50 text-emerald-700",
  offline: "bg-amber-50 text-amber-700",
  hybrid: "bg-sky-50 text-sky-700",
};

export function ModeBadge({ mode, label }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${badge[mode]}`}>{label}</span>;
}

const startsOn = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export default function CourseCard({ course, as: Heading = "h3", compare = false }) {
  const wish = useWishlist();
  const cmp = useCompare();
  const few = course.seats_left != null && course.seats_left > 0 && course.seats_left <= 5;
  const full = course.seats_left === 0;
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-surface shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-600/10">
      <div className="relative">
        <CourseThumb course={course} className="h-36" />
        <HeartButton className="absolute right-3 top-3 z-10" active={wish.has(course.slug)} onClick={() => wish.toggle(course.slug)} title={course.title} />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <ModeBadge mode={course.mode} label={course.mode_display} />
          {few && <span className="rounded-full bg-coral/20 px-2.5 py-0.5 text-xs font-bold text-slate-900">Only {course.seats_left} seats left</span>}
          {full && <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">Full</span>}
        </div>
        <Heading className="text-lg font-semibold leading-snug">
          <Link to={`/courses/${course.slug}`} className="after:absolute after:inset-0 after:content-[''] group-hover:text-brand">{course.title}</Link>
        </Heading>
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{course.description}</p>
        <div className="mt-auto flex items-end justify-between pt-4">
          <span className="text-sm text-slate-500">{course.duration_weeks} weeks{course.start_date && ` · starts ${startsOn(course.start_date)}`}</span>
          <span className="font-display text-xl font-bold text-brand">{inr(course.fee)}</span>
        </div>
      </div>
      {compare && (
        <label className="relative z-10 flex cursor-pointer items-center gap-2 border-t border-slate-200 px-5 py-2.5 text-sm text-slate-600 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
          <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={cmp.has(course.slug)} disabled={!cmp.has(course.slug) && cmp.full} onChange={() => cmp.toggle(course.slug)} />
          Compare<span className="sr-only"> {course.title}</span>
        </label>
      )}
    </div>
  );
}
