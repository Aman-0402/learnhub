import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useFetch, useTitle } from "../lib/hooks.js";
import { chosenBatch } from "../lib/services.js";
import { ModeBadge } from "../components/CourseCard.jsx";
import { CourseThumb } from "../components/Media.jsx";
import { Timetable } from "../components/Batches.jsx";
import { Card } from "../components/PageHeader.jsx";
import { DetailSkeleton, ErrorState } from "../components/States.jsx";

const TABS = ["Overview", "Timetable", "Lessons"];
const when = (d) => new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export default function Learn() {
  const { slug } = useParams();
  const [tab, setTab] = useState("Overview");
  const tabRefs = useRef({});
  const { data, error, status, loading, reload } = useFetch(async () => {
    const list = await api("/my-courses/");
    const enrollment = list.find((e) => e.course.slug === slug) || null;
    const lessons = enrollment ? await api(`/courses/${slug}/lessons/`) : [];
    return { enrollment, lessons };
  }, [slug]);
  useTitle(data?.enrollment?.course.title || "Course");

  if (loading) return <DetailSkeleton />;
  if (error) return <ErrorState message={error} status={status} onRetry={reload} />;
  const { enrollment, lessons } = data;
  if (!enrollment) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <h1 className="text-xl font-bold">You are not enrolled in this course</h1>
        <p className="mt-2 text-slate-600">Enroll to get access to the course space.</p>
        <Link to={`/courses/${slug}`} className="mt-5 inline-block rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700">View course</Link>
      </Card>
    );
  }

  const c = enrollment.course;
  const batch = enrollment.batch || chosenBatch.get(slug);
  const sessions = lessons.filter((l) => l.session_at);
  const detail = [
    ["Instructor", c.instructor], ["Format", c.mode_display], ["Duration", `${c.duration_weeks} weeks`],
    ["Starts", c.start_date && new Date(c.start_date).toLocaleDateString("en-IN", { dateStyle: "long" })], ["Location", c.location],
  ].filter(([, v]) => v);

  // Arrow keys, Home and End move between tabs, as screen-reader users expect.
  const onKey = (e) => {
    const i = TABS.indexOf(tab);
    const next = { ArrowRight: (i + 1) % TABS.length, ArrowLeft: (i + TABS.length - 1) % TABS.length, Home: 0, End: TABS.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault(); setTab(TABS[next]); tabRefs.current[TABS[next]]?.focus();
  };

  return (
    <div>
      <Link to="/dashboard" className="text-sm text-slate-500 hover:text-slate-800">← Dashboard</Link>
      <div className="mt-3 overflow-hidden rounded-xl"><CourseThumb course={c} className="h-24" /></div>
      <div className="mb-6 mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{c.title}</h1>
        <ModeBadge mode={c.mode} label={c.mode_display} />
      </div>
      <div className="mb-6 flex gap-1 border-b border-slate-200" role="tablist" aria-label="Course sections" onKeyDown={onKey}>
        {TABS.map((t) => (
          <button key={t} ref={(el) => (tabRefs.current[t] = el)} role="tab" id={`tab-${t}`} aria-selected={tab === t} aria-controls={`panel-${t}`} tabIndex={tab === t ? 0 : -1} onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === t ? "border-brand-600 text-brand" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{t}</button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "Overview" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2"><h2 className="mb-2 font-semibold">About this course</h2><p className="whitespace-pre-line text-slate-700">{c.description}</p></Card>
            <Card>
              <h2 className="mb-3 font-semibold">Course details</h2>
              <dl className="space-y-2 text-sm">{detail.map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-slate-500">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}</dl>
            </Card>
          </div>
        )}
        {tab === "Timetable" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              {batch ? <Timetable batch={batch} /> : (
                <p className="text-slate-600">{c.start_date ? `Classes begin on ${new Date(c.start_date).toLocaleDateString("en-IN", { dateStyle: "full" })}.` : "The start date has not been announced yet."} Your weekly timetable appears here once a batch is assigned.</p>
              )}
            </Card>
            <Card>
              <h2 className="mb-3 font-semibold">Scheduled sessions</h2>
              {sessions.length > 0 ? (
                <ul className="divide-y divide-slate-100 text-sm">{sessions.map((l) => <li key={l.id} className="flex justify-between gap-4 py-2"><span className="font-medium">{l.title}</span><span className="text-slate-600">{when(l.session_at)}</span></li>)}</ul>
              ) : <p className="text-sm text-slate-600">No live sessions have been scheduled yet.</p>}
            </Card>
          </div>
        )}
        {tab === "Lessons" && (
          lessons.length === 0 ? (
            <Card className="text-center"><p className="font-medium">No lessons yet</p><p className="mt-1 text-sm text-slate-600">Lessons and materials will appear here once your instructor adds them.</p></Card>
          ) : (
            <ol className="space-y-3">
              {lessons.map((l, i) => (
                <li key={l.id}><Card className="flex items-start gap-4 !p-4">
                  <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-strong">{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium">{l.title}</p>
                    <p className="text-sm text-slate-500">{l.kind_display}{l.duration_minutes ? ` · ${l.duration_minutes} min` : ""}{l.session_at ? ` · ${when(l.session_at)}` : ""}</p>
                    {l.description && <p className="mt-1 text-sm text-slate-600">{l.description}</p>}
                  </div>
                  {l.url && <a href={l.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-sm font-semibold text-brand hover:underline">Open<span className="sr-only"> {l.title} (opens in a new tab)</span></a>}
                </Card></li>
              ))}
            </ol>
          )
        )}
      </div>
    </div>
  );
}
