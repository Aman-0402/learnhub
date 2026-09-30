import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useFetch, useTitle } from "../lib/hooks.js";
import CourseCard from "../components/CourseCard.jsx";
import { CardGridSkeleton, ErrorState } from "../components/States.jsx";

const MODES = [["", "All formats"], ["online", "Online"], ["offline", "Offline"], ["hybrid", "Online + Offline"]];

export default function Courses() {
  useTitle("Courses");
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const subject = params.get("subject") || "";
  const mode = params.get("mode") || "";

  const subjects = useFetch(() => api("/subjects/", { auth: false }));
  const list = useFetch(() => {
    const qs = new URLSearchParams({ ...(q && { q }), ...(subject && { subject }), ...(mode && { mode }) });
    return api(`/courses/?${qs}`, { auth: false });
  }, [q, subject, mode]);

  const set = (k, v) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    setParams(next, { replace: true });
  };
  const field = "rounded-lg border border-slate-300 bg-surface px-3 py-2 text-sm";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Courses</h1>
      <form role="search" aria-label="Filter courses" onSubmit={(e) => e.preventDefault()} className="mb-6 flex flex-wrap gap-3">
        <input aria-label="Search courses" type="search" className={`${field} min-w-56 flex-1`} placeholder="Search courses" value={q} onChange={(e) => set("q", e.target.value)} />
        <select aria-label="Subject" className={field} value={subject} onChange={(e) => set("subject", e.target.value)}>
          <option value="">All subjects</option>
          {subjects.data?.map((s) => <option key={s.id} value={s.slug}>{s.name}</option>)}
        </select>
        <select aria-label="Format" className={field} value={mode} onChange={(e) => set("mode", e.target.value)}>
          {MODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </form>
      {list.loading && <CardGridSkeleton />}
      {list.error && <ErrorState message={list.error} onRetry={list.reload} />}
      {list.data && (
        <>
          <p className="sr-only" role="status">{list.data.count} courses found</p>
          {list.data.results.length === 0
            ? <p className="text-slate-600">No courses match your filters.</p>
            : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.data.results.map((c) => <CourseCard key={c.id} course={c} as="h2" />)}</div>}
        </>
      )}
    </div>
  );
}
