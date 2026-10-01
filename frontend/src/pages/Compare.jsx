import { Link } from "react-router-dom";
import { fetchAllCourses } from "../lib/catalog.js";
import { useFetch, useTitle } from "../lib/hooks.js";
import { useCompare } from "../lib/store.js";
import { inr, ModeBadge } from "../components/CourseCard.jsx";
import { EmptyState } from "../components/Fun.jsx";
import { ErrorState, ListSkeleton } from "../components/States.jsx";

const date = (d) => (d ? new Date(d + "T00:00:00").toLocaleDateString("en-IN", { dateStyle: "medium" }) : "To be announced");

export default function Compare() {
  useTitle("Compare courses", { noindex: true });
  const cmp = useCompare();
  const { data, error, loading, reload } = useFetch(() => fetchAllCourses());
  const courses = data ? cmp.slugs.map((s) => data.find((c) => c.slug === s)).filter(Boolean) : [];
  const rows = [
    ["Subject", (c) => c.subject.name],
    ["Format", (c) => <ModeBadge mode={c.mode} label={c.mode_display} />],
    ["Fee", (c) => <strong className="font-display text-lg text-brand">{inr(c.fee)}</strong>],
    ["Duration", (c) => `${c.duration_weeks} weeks`],
    ["Starts", (c) => date(c.start_date)],
    ["Instructor", (c) => c.instructor || "To be announced"],
    ["Location", (c) => c.location || "Online"],
    ["Seats left", (c) => (c.seats_left == null ? "Open enrollment" : c.seats_left)],
  ];
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold">Compare courses</h1>
      {loading && <ListSkeleton rows={4} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (courses.length < 2
        ? <EmptyState title="Pick at least two courses" action={<Link to="/courses" className="rounded-full bg-brand-600 px-5 py-2 font-bold text-white hover:bg-brand-700">Choose courses</Link>}>Tick Compare on the course cards to line them up here.</EmptyState>
        : (
          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-surface">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <caption className="sr-only">Side by side comparison of {courses.length} courses</caption>
              <thead>
                <tr className="border-b border-slate-200">
                  <td className="p-4" />
                  {courses.map((c) => (
                    <th key={c.id} scope="col" className="p-4 align-top font-display text-base font-semibold">
                      <Link to={`/courses/${c.slug}`} className="text-brand hover:underline">{c.title}</Link>
                      <button onClick={() => cmp.toggle(c.slug)} className="mt-1 block text-xs font-bold text-slate-600 hover:text-slate-900">Remove<span className="sr-only"> {c.title}</span></button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, f]) => (
                  <tr key={label} className="border-b border-slate-100 last:border-0">
                    <th scope="row" className="p-4 font-bold text-slate-600">{label}</th>
                    {courses.map((c) => <td key={c.id} className="p-4 font-semibold">{f(c)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );
}
