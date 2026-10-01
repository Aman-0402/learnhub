import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { fetchAllCourses } from "../lib/catalog.js";
import { useFetch, useTitle } from "../lib/hooks.js";
import { useCompare, useRecent } from "../lib/store.js";
import CourseCard, { inr } from "../components/CourseCard.jsx";
import { EmptyState } from "../components/Fun.jsx";
import { CardGridSkeleton, ErrorState } from "../components/States.jsx";

const MODES = [["", "All formats"], ["online", "Online"], ["offline", "Offline"], ["hybrid", "Online + Offline"]];
const PRICES = [["", "Any price"], ["0-5000", "Under ₹5,000"], ["5000-10000", "₹5,000 to ₹10,000"], ["10000-", "Over ₹10,000"]];
const SORTS = [
  ["new", "Newest first"], ["soon", "Starts soonest"], ["low", "Price: low to high"], ["high", "Price: high to low"], ["short", "Shortest first"],
];
const PAGE = 12;

const bySort = {
  new: (a, b) => b.id - a.id,
  soon: (a, b) => (a.start_date || "9999").localeCompare(b.start_date || "9999"),
  low: (a, b) => a.fee - b.fee,
  high: (a, b) => b.fee - a.fee,
  short: (a, b) => a.duration_weeks - b.duration_weeks,
};

export default function Courses() {
  useTitle("Courses");
  const [params, setParams] = useSearchParams();
  const get = (k) => params.get(k) || "";
  const q = get("q"), subject = get("subject"), mode = get("mode"), price = get("price"), sort = get("sort") || "new";
  const open = get("open") === "1";
  const page = Math.max(1, Number(get("page")) || 1);

  const subjects = useFetch(() => api("/subjects/", { auth: false }));
  const list = useFetch(() => fetchAllCourses());
  const recent = useRecent();
  const cmp = useCompare();

  const set = (k, v) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    if (k !== "page") next.delete("page");
    setParams(next, { replace: true });
  };
  const clear = () => setParams({}, { replace: true });
  const active = [q, subject, mode, price, open && "1"].filter(Boolean).length;

  const subjectList = subjects.data?.results || subjects.data || [];
  const filtered = useMemo(() => {
    if (!list.data) return [];
    const [lo, hi] = price ? price.split("-").map((n) => (n === "" ? Infinity : Number(n))) : [0, Infinity];
    const needle = q.trim().toLowerCase();
    return list.data
      .filter((c) => (!subject || c.subject.slug === subject) && (!mode || c.mode === mode))
      .filter((c) => !price || (Number(c.fee) >= lo && Number(c.fee) < (hi === undefined ? Infinity : hi)))
      .filter((c) => !open || c.seats_left == null || c.seats_left > 0)
      .filter((c) => !needle || `${c.title} ${c.description} ${c.instructor} ${c.subject.name}`.toLowerCase().includes(needle))
      .sort(bySort[sort] || bySort.new);
  }, [list.data, q, subject, mode, price, open, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const cur = Math.min(page, pages);
  const shown = filtered.slice((cur - 1) * PAGE, cur * PAGE);
  const recentCourses = (list.data && recent.slugs.map((s) => list.data.find((c) => c.slug === s)).filter(Boolean).slice(0, 4)) || [];

  const field = "rounded-2xl border-2 border-slate-200 bg-surface px-3 py-2 text-sm font-semibold focus:border-brand-600";
  const chip = (on) => `rounded-full border-2 px-4 py-1.5 text-sm font-bold transition ${on ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 bg-surface text-slate-700 hover:border-brand-600"}`;

  return (
    <div className="pb-20">
      <h1 className="mb-6 font-display text-3xl font-bold">Find your course</h1>

      <form role="search" aria-label="Filter courses" onSubmit={(e) => e.preventDefault()} className="mb-6 space-y-4 rounded-3xl border border-slate-200 bg-surface p-4 shadow-sm">
        <input aria-label="Search courses" type="search" className={`${field} w-full`} placeholder="Search by title, subject or instructor" value={q} onChange={(e) => set("q", e.target.value)} />
        <div role="group" aria-label="Subject" className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={!subject} className={chip(!subject)} onClick={() => set("subject", "")}>All subjects</button>
          {subjectList.map((s) => (
            <button type="button" key={s.id} aria-pressed={subject === s.slug} className={chip(subject === s.slug)} onClick={() => set("subject", s.slug)}>{s.name}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select aria-label="Format" className={field} value={mode} onChange={(e) => set("mode", e.target.value)}>
            {MODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select aria-label="Price" className={field} value={price} onChange={(e) => set("price", e.target.value)}>
            {PRICES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select aria-label="Sort by" className={field} value={sort} onChange={(e) => set("sort", e.target.value === "new" ? "" : e.target.value)}>
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
            <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={open} onChange={(e) => set("open", e.target.checked ? "1" : "")} />
            Seats available
          </label>
          {active > 0 && <button type="button" onClick={clear} className="ml-auto text-sm font-bold text-brand hover:underline">Clear all filters</button>}
        </div>
      </form>

      {list.loading && <CardGridSkeleton count={6} />}
      {list.error && <ErrorState message={list.error} onRetry={list.reload} />}
      {list.data && (
        <>
          <p className="mb-4 text-sm font-bold text-slate-600" role="status">
            {filtered.length} {filtered.length === 1 ? "course" : "courses"} found{pages > 1 && ` · page ${cur} of ${pages}`}
          </p>
          {filtered.length === 0 ? (
            <EmptyState title="No courses match" action={<button onClick={clear} className="rounded-full bg-brand-600 px-5 py-2 font-bold text-white hover:bg-brand-700">Clear filters</button>}>
              Try a different search or remove a filter.
            </EmptyState>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{shown.map((c) => <CourseCard key={c.id} course={c} as="h2" compare />)}</div>
          )}
          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3">
              <button disabled={cur <= 1} onClick={() => set("page", String(cur - 1))} className={`${chip(false)} disabled:opacity-50`}>Previous</button>
              <span className="text-sm font-bold">Page {cur} of {pages}</span>
              <button disabled={cur >= pages} onClick={() => set("page", String(cur + 1))} className={`${chip(false)} disabled:opacity-50`}>Next</button>
            </nav>
          )}
          {recentCourses.length > 0 && (
            <section aria-labelledby="recent" className="mt-12">
              <h2 id="recent" className="mb-1 font-display text-xl font-bold">Recently viewed</h2>
              <p className="mb-4 text-sm text-slate-600">Remembered on this device only.</p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{recentCourses.map((c) => <CourseCard key={c.id} course={c} />)}</div>
            </section>
          )}
        </>
      )}

      {cmp.slugs.length > 0 && (
        <div role="region" aria-label="Compare courses" className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-brand-100 bg-surface/95 px-4 py-3 shadow-2xl backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold">{cmp.slugs.length} of 3 selected to compare</p>
            <div className="flex items-center gap-3">
              <button onClick={cmp.clear} className="text-sm font-bold text-slate-600 hover:text-slate-900">Clear</button>
              {cmp.slugs.length >= 2
                ? <Link to="/compare" className="rounded-full bg-brand-600 px-5 py-2 font-bold text-white hover:bg-brand-700">Compare now</Link>
                : <span className="text-sm text-slate-600">Pick one more to compare</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
