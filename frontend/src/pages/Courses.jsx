import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { fetchAllCourses } from "../lib/catalog.js";
import { useFetch, useTitle } from "../lib/hooks.js";
import { useCompare, useRecent } from "../lib/store.js";
import CourseCard, { inr } from "../components/CourseCard.jsx";
import { EASE, EmptyState } from "../components/Fun.jsx";
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
  useTitle("Courses", { description: "Browse online, offline and hybrid courses. Filter by subject, format, price and start date, then enroll in the batch that suits you." });
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

  const field = "field !w-auto";
  const chip = (on) => `relative rounded-full px-4 py-1.5 text-sm font-semibold transition-colors duration-150 ${on ? "text-slate-50" : "text-slate-700 hover-fine:bg-slate-100"}`;
  const Chip = ({ on, onClick, children }) => (
    <button type="button" aria-pressed={on} className={chip(on)} onClick={onClick}>
      {on && <motion.span layoutId="subject-chip" aria-hidden="true" className="absolute inset-0 rounded-full bg-slate-900" transition={{ type: "spring", stiffness: 520, damping: 38 }} />}
      <span className="relative">{children}</span>
    </button>
  );

  return (
    <div className="pb-24">
      <h1 className="mb-8 text-4xl font-semibold sm:text-6xl">Courses</h1>

      <form role="search" aria-label="Filter courses" onSubmit={(e) => e.preventDefault()} className="mb-8 space-y-5">
        <div className="relative max-w-xl">
          <MagnifyingGlass size={20} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input aria-label="Search courses" type="search" className="field !pl-11" placeholder="Search by title, subject or instructor" value={q} onChange={(e) => set("q", e.target.value)} />
        </div>
        <div role="group" aria-label="Subject" className="-mx-1 flex flex-wrap gap-1">
          <Chip on={!subject} onClick={() => set("subject", "")}>All subjects</Chip>
          {subjectList.map((s) => <Chip key={s.id} on={subject === s.slug} onClick={() => set("subject", s.slug)}>{s.name}</Chip>)}
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
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium">
            <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={open} onChange={(e) => set("open", e.target.checked ? "1" : "")} />
            Seats available
          </label>
          {active > 0 && <button type="button" onClick={clear} className="link-draw ml-auto text-sm font-semibold text-brand-strong">Clear all filters</button>}
        </div>
      </form>

      {list.loading && <CardGridSkeleton count={6} />}
      {list.error && <ErrorState message={list.error} onRetry={list.reload} />}
      {list.data && (
        <>
          <p className="mb-5 text-sm text-slate-600" role="status">
            <span className="num font-semibold text-slate-900">{filtered.length}</span> {filtered.length === 1 ? "course" : "courses"}{pages > 1 && `, page ${cur} of ${pages}`}
          </p>
          {filtered.length === 0 ? (
            <EmptyState title="No courses match" action={<button onClick={clear} className="btn btn-primary">Clear filters</button>}>
              Try a different search or remove a filter.
            </EmptyState>
          ) : (
            <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence mode="popLayout" initial={false}>
                {shown.map((c) => (
                  <motion.div key={c.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25, ease: EASE }}>
                    <CourseCard course={c} as="h2" compare />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3">
              <button disabled={cur <= 1} onClick={() => set("page", String(cur - 1))} className="btn btn-quiet btn-sm">Previous</button>
              <span className="num text-sm">Page {cur} of {pages}</span>
              <button disabled={cur >= pages} onClick={() => set("page", String(cur + 1))} className="btn btn-quiet btn-sm">Next</button>
            </nav>
          )}
          {recentCourses.length > 0 && (
            <section aria-labelledby="recent" className="mt-12">
              <h2 id="recent" className="mb-1 text-2xl font-semibold">Recently viewed</h2>
              <p className="mb-4 text-sm text-slate-600">Remembered on this device only.</p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{recentCourses.map((c) => <CourseCard key={c.id} course={c} />)}</div>
            </section>
          )}
        </>
      )}

      <AnimatePresence>
        {cmp.slugs.length > 0 && (
          <motion.div role="region" aria-label="Compare courses" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-slate-50/95 py-3 backdrop-blur-sm">
            <div className="shell flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium"><span className="num">{cmp.slugs.length}</span> of 3 selected to compare</p>
              <div className="flex items-center gap-3">
                <button onClick={cmp.clear} className="text-sm font-medium text-slate-600 hover-fine:text-slate-900">Clear</button>
                {cmp.slugs.length >= 2
                  ? <Link to="/compare" className="btn btn-primary btn-sm">Compare now</Link>
                  : <span className="text-sm text-slate-600">Pick one more to compare</span>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
