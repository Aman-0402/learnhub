import { Link, useLocation } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { useFetch, useTitle } from "../lib/hooks.js";
import { useProgress } from "../lib/store.js";
import { nextClassDates, timeRange, dayList } from "../components/Batches.jsx";
import { Confetti, ProgressBar } from "../components/Fun.jsx";
import { inr, ModeBadge } from "../components/CourseCard.jsx";
import { CourseThumb } from "../components/Media.jsx";
import PageHeader, { Card, Notice } from "../components/PageHeader.jsx";
import { CardGridSkeleton, ErrorState, Skeleton } from "../components/States.jsx";

function LessonProgress({ slug, prog }) {
  const { data } = useFetch(() => api(`/courses/${slug}/lessons/`), [slug]);
  if (!data || data.length === 0) return null;
  const done = prog.done(slug).filter((id) => data.some((l) => l.id === id)).length;
  return (
    <div className="mt-3">
      <p className="mb-1 text-xs font-bold text-slate-600">{done} of {data.length} lessons done · saved on this device</p>
      <ProgressBar value={(done / data.length) * 100} label={`Lesson progress for ${slug}`} />
    </div>
  );
}

const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" });

export default function Dashboard() {
  useTitle("Dashboard");
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
        <Link to="/courses" className="rounded-full bg-brand-600 px-5 py-2 text-sm font-bold text-white hover:bg-brand-700">Find a course</Link>
      </PageHeader>
      {just && <><Confetti /><div className="mb-6"><Notice kind="ok">You are enrolled in {just}. Welcome aboard! 🎉</Notice></div></>}
      {next && (
        <section aria-labelledby="next-class" className="mb-8 rounded-3xl bg-gradient-to-r from-brand-600 to-[#8b5cf6] p-6 text-white">
          <h2 id="next-class" className="text-sm font-bold uppercase tracking-wider">Your next class</h2>
          <p className="mt-1 font-display text-2xl font-bold">{next.e.course.title}</p>
          <p className="font-semibold">{next.d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} · {timeRange(next.e.batch)}</p>
          <p className="text-sm">{next.e.batch.label} · {dayList(next.e.batch)}</p>
        </section>
      )}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!error && (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {stats.map(([k, v]) => (
              <Card key={k}><p className="text-sm text-slate-500">{k}</p>{loading ? <Skeleton className="mt-2 h-7 w-24" /> : <p className="mt-1 text-2xl font-bold">{v}</p>}</Card>
            ))}
          </div>
          <h2 className="mb-4 text-lg font-semibold">Your courses</h2>
          {loading && <CardGridSkeleton count={2} />}
          {items?.length === 0 && <Card><p className="text-slate-600">You have not enrolled in a course yet. <Link to="/courses" className="font-medium text-brand">Browse courses</Link></p></Card>}
          <div className="grid gap-4 md:grid-cols-2">
            {items?.map((e) => (
              <div key={e.id} className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-surface shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <CourseThumb course={e.course} className="h-20" />
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{e.course.subject.name}</span>
                    <ModeBadge mode={e.course.mode} label={e.course.mode_display} />
                  </div>
                  <h3 className="font-semibold">{e.course.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{e.course.start_date ? `Starts ${fmt(e.course.start_date)}` : "Start date to be announced"}{e.course.location && ` · ${e.course.location}`}</p>
                  <LessonProgress slug={e.course.slug} prog={prog} />
                  <Link to={`/learn/${e.course.slug}`} className="mt-4 self-start text-sm font-semibold text-brand hover:underline">Open course<span className="sr-only"> {e.course.title}</span> →</Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
