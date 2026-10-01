import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useFetch, useTitle } from "../lib/hooks.js";
import { inr, ModeBadge } from "../components/CourseCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { ErrorState, ListSkeleton } from "../components/States.jsx";

export default function MyCourses() {
  useTitle("My courses", { noindex: true });
  const { data: items, error, loading, reload } = useFetch(() => api("/my-courses/"));
  return (
    <div>
      <PageHeader title="My courses" />
      {loading && <ListSkeleton />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {items?.length === 0 && <p className="text-slate-600">You have not enrolled in any course yet. <Link to="/courses" className="font-medium text-brand">Browse courses</Link></p>}
      <div className="space-y-3">
        {items?.map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-surface p-5">
            <div>
              <Link to={`/learn/${e.course.slug}`} className="font-semibold hover:text-brand">{e.course.title}</Link>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-500"><ModeBadge mode={e.course.mode} label={e.course.mode_display} /><span>{e.course.subject.name}</span></div>
            </div>
            <div className="text-right text-sm"><p className="font-semibold">{inr(e.amount)}</p><p className="text-slate-500">Paid</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}
