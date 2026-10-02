import { Link, useLocation } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { useFetch, useTitle } from "../lib/hooks.js";
import { useProgress } from "../lib/store.js";
import { nextClassDates, timeRange, dayList } from "../components/Batches.jsx";
import { DrawnCheck, ProgressBar } from "../components/Fun.jsx";
import { inr, ModeBadge } from "../components/CourseCard.jsx";
import { CourseThumb } from "../components/Media.jsx";
import PageHeader, { Card } from "../components/PageHeader.jsx";
import { CardGridSkeleton, ErrorState, Skeleton } from "../components/States.jsx";

// `lesson_count` rides along on the course object already in /my-courses/, so this
// needs no fetch of its own (one HTTP round trip per enrolled course, every visit, was
// the previous version's cost).
function LessonProgress({ slug, total, prog }) {
  if (!total) return null;
  const done = Math.min(prog.done(slug).length, total);
  return (
    <div className="mt-3">
      <p className="mb-1 text-xs text-slate-600"><span className="num">{done} of {total}</span> lessons done, saved on this device</p>
      <ProgressBar value={(done / total) * 100} label={`Lesson progress for ${slug}`} />
    </div>
  );
}

const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" });

export default function Dashboard() {
  useTitle("Dashboard", { noindex: true });
  const { user } = useAuth();
  const just = useLocation().state?.justEnrolled;
  const prog = useProgress();
  const { data: items, error, loading, reload } = useFetch(() => api("/my-courses/"));

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (items || []).filter((e) => e.course.start_date && e.course.start_date >= today).sort((a, b) => a.course.start_date.localeCompare(b.course.start_date));
  const total = (items || []).reduce((s, e) => s + Number(e.amount), 0);
  const withBatch = (items || []).filter((e) => e.batch).map((e) => ({ e, d: nextClassDates(e.batch, 1)[0] })).filter((x) => x.d).sort((a, b) => a.d - b.d);
  const next = withBatch[0];
  const stats = [
    ["Courses enrolled", items?.length],
    ["Next class starts", items && (upcoming[0] ? fmt(upcoming[0].course.start_date) : "None scheduled")],
    ["Total paid", items && inr(total)],
  ];

  return (
    <div>
      <PageHeader title={`Welcome back, ${user.full_name.split(" ")[0]}`} subtitle="Here is where your learning stands.">
        <Link to="/courses" className="btn btn-primary btn-sm">Find a course</Link>
      </PageHeader>
      {just && (
        <div role="status" className="card mb-8 flex items-center gap-4 p-5">
          <DrawnCheck size={48} />
          <div><p className="font-display text-xl font-semibold">You are enrolled</p><p className="text-slate-600">{just} is now in your courses.</p></div>
        </div>
      )}
      {next && (
        <section aria-labelledby="next-class" className="mb-10 rounded-[var(--radius-card)] bg-slate-900 p-6 text-slate-50 sm:p-8">
          <h2 id="next-class" className="text-sm font-medium text-slate-50/75">Your next class</h2>
          <p className="mt-2 font-display text-3xl font-semibold">{next.e.course.title}</p>
          <p className="mt-1 text-lg">{next.d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}, {timeRange(next.e.batch)}</p>
          <p className="text-sm text-slate-50/75">{next.e.batch.label}, {dayList(next.e.batch)}</p>
        </section>
      )}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!error && (
        <>
          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            {stats.map(([k, v]) => (
              <Card key={k}><p className="text-sm text-slate-600">{k}</p>{loading ? <Skeleton className="mt-2 h-7 w-24" /> : <p className="num mt-1 text-2xl font-semibold">{v}</p>}</Card>
            ))}
          </div>
          <h2 className="mb-5 text-2xl font-semibold">Your courses</h2>
          {loading && <CardGridSkeleton count={2} />}
          {items?.length === 0 && <Card><p className="text-slate-600">You have not enrolled in a course yet. <Link to="/courses" className="link-draw font-semibold text-brand-strong">Browse courses</Link></p></Card>}
          <div className="grid gap-4 md:grid-cols-2">
            {items?.map((e) => (
              <div key={e.id} className="card flex flex-col overflow-hidden">
                <CourseThumb course={e.course} className="h-20" />
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-slate-600">{e.course.subject.name}</span>
                    <ModeBadge label={e.course.mode_display} />
                  </div>
                  <h3 className="font-semibold">{e.course.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{e.course.start_date ? `Starts ${fmt(e.course.start_date)}` : "Start date to be announced"}{e.course.location && `, ${e.course.location}`}</p>
                  <LessonProgress slug={e.course.slug} total={e.course.lesson_count} prog={prog} />
                  <Link to={`/learn/${e.course.slug}`} className="link-draw mt-4 self-start text-sm font-semibold text-brand-strong">Open course<span className="sr-only"> {e.course.title}</span></Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
