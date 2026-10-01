import { Link } from "react-router-dom";
import { CourseThumb } from "./Media.jsx";
import { HeartButton } from "./Fun.jsx";
import { useCompare, useWishlist } from "../lib/store.js";

export const inr = (v) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

/** Format of the class. Neutral on purpose: colour is kept for the one accent. */
export function ModeBadge({ label }) {
  return <span className="tag">{label}</span>;
}

const startsOn = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export default function CourseCard({ course, as: Heading = "h3", compare = false }) {
  const wish = useWishlist();
  const cmp = useCompare();
  const few = course.seats_left != null && course.seats_left > 0 && course.seats_left <= 5;
  const full = course.seats_left === 0;
  return (
    <div className="group card relative flex flex-col overflow-hidden transition-[transform,border-color] duration-300 [transition-timing-function:var(--ease-out-strong)] hover-fine:-translate-y-0.5 hover-fine:border-slate-400">
      <div className="relative">
        <CourseThumb course={course} className="h-36" />
        <HeartButton className="absolute right-2 top-2 z-10 bg-surface/80" active={wish.has(course.slug)} onClick={() => wish.toggle(course.slug)} title={course.title} />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <ModeBadge label={course.mode_display} />
          {few && <span className="text-xs font-semibold text-slate-700">{course.seats_left} seats left</span>}
          {full && <span className="text-xs font-semibold text-slate-700">Full</span>}
        </div>
        <Heading className="text-lg font-semibold leading-snug">
          <Link to={`/courses/${course.slug}`} className="after:absolute after:inset-0 after:content-['']">{course.title}</Link>
        </Heading>
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{course.description}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <span className="text-sm text-slate-600">{course.duration_weeks} weeks{course.start_date && `, starts ${startsOn(course.start_date)}`}</span>
          <span className="num text-lg font-semibold">{inr(course.fee)}</span>
        </div>
      </div>
      {compare && (
        <label className="relative z-10 flex cursor-pointer items-center gap-2 border-t border-slate-200 px-5 py-3 text-sm text-slate-700 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
          <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={cmp.has(course.slug)} disabled={!cmp.has(course.slug) && cmp.full} onChange={() => cmp.toggle(course.slug)} />
          Compare<span className="sr-only"> {course.title}</span>
        </label>
      )}
    </div>
  );
}
