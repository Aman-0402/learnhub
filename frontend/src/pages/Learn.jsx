import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { api } from "../lib/api.js";
import { useFetch, useTitle } from "../lib/hooks.js";
import { chosenBatch, isSample } from "../lib/services.js";
import { ModeBadge } from "../components/CourseCard.jsx";
import { Timetable } from "../components/Batches.jsx";
import { Card } from "../components/PageHeader.jsx";
import { ProgressBar } from "../components/Fun.jsx";
import { useProgress } from "../lib/store.js";
import { buildICS, downloadICS } from "../lib/ics.js";
import { DetailSkeleton, ErrorState } from "../components/States.jsx";

const TABS = ["Overview", "Timetable", "Lessons"];
const when = (d) => new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export default function Learn() {
  const { slug } = useParams();
  const [tab, setTab] = useState("Overview");
  const tabRefs = useRef({});
  const prog = useProgress();
  const { data, error, status, loading, reload } = useFetch(async () => {
    const list = await api("/my-courses/");
    const enrollment = list.find((e) => e.course.slug === slug) || null;
    const lessons = enrollment ? await api(`/courses/${slug}/lessons/`) : [];
    return { enrollment, lessons };
  }, [slug]);
  useTitle(data?.enrollment?.course.title || "Course", { noindex: true });

  if (loading) return <DetailSkeleton />;
  if (error) return <ErrorState message={error} status={status} onRetry={reload} />;
  const { enrollment, lessons } = data;
  if (!enrollment) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <h1 className="text-2xl font-semibold">You are not enrolled in this course</h1>
        <p className="mt-2 text-slate-600">Enroll to get access to the course space.</p>
        <Link to={`/courses/${slug}`} className="btn btn-primary mt-5">View course</Link>
      </Card>
    );
  }

  const c = enrollment.course;
  const batch = enrollment.batch || (isSample("batchesApi") ? chosenBatch.get(slug) : null);
  const sessions = lessons.filter((l) => l.session_at);
  const doneIds = prog.done(slug).filter((id) => lessons.some((l) => l.id === id));
  const pct = lessons.length ? (doneIds.length / lessons.length) * 100 : 0;
  const canCal = Boolean(batch || sessions.length);
  const addToCalendar = () => downloadICS(`${slug}.ics`, buildICS({ course: c, batch, sessions }));
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
      <Link to="/dashboard" className="link-draw text-sm text-slate-600">Dashboard</Link>
      <div className="mb-6 mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-4xl font-semibold sm:text-5xl">{c.title}</h1>
        <ModeBadge label={c.mode_display} />
      </div>
      {lessons.length > 0 && (
        <div className="mb-6 max-w-md">
          <p className="mb-2 text-sm"><span className="num font-semibold">{doneIds.length} of {lessons.length}</span> lessons done <span className="text-slate-600">(saved on this device)</span></p>
          <ProgressBar value={pct} label="Lesson progress" />
        </div>
      )}
      <div className="mb-6 flex gap-1 border-b border-slate-200" role="tablist" aria-label="Course sections" onKeyDown={onKey}>
        {TABS.map((t) => (
          <button key={t} ref={(el) => (tabRefs.current[t] = el)} role="tab" id={`tab-${t}`} aria-selected={tab === t} aria-controls={`panel-${t}`} tabIndex={tab === t ? 0 : -1} onClick={() => setTab(t)}
            className={`relative min-h-11 px-4 py-2 text-sm font-semibold transition-colors duration-150 ${tab === t ? "text-slate-900" : "text-slate-600 hover-fine:text-slate-900"}`}>{t}{tab === t && <motion.span layoutId="learn-tab" aria-hidden="true" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600" transition={{ type: "spring", stiffness: 520, damping: 40 }} />}</button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "Overview" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2"><h2 className="mb-3 text-xl font-semibold">About this course</h2><p className="whitespace-pre-line text-slate-700">{c.description}</p></Card>
            <Card>
              <h2 className="mb-3 text-xl font-semibold">Course details</h2>
              <dl className="space-y-2 text-sm">{detail.map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-slate-600">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}</dl>
            </Card>
          </div>
        )}
        {tab === "Timetable" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              {canCal && <button onClick={addToCalendar} className="btn btn-quiet btn-sm mb-4">Add to calendar</button>}
              {batch ? <Timetable batch={batch} /> : (
                <p className="text-slate-600">{c.start_date ? `Classes begin on ${new Date(c.start_date).toLocaleDateString("en-IN", { dateStyle: "full" })}.` : "The start date has not been announced yet."} Your weekly timetable appears here once a batch is assigned.</p>
              )}
            </Card>
            <Card>
              <h2 className="mb-3 text-xl font-semibold">Scheduled sessions</h2>
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
                  <input type="checkbox" aria-label={`Mark "${l.title}" as done`} checked={doneIds.includes(l.id)} onChange={() => prog.toggle(slug, l.id)} className="mt-1 h-5 w-5 shrink-0 accent-brand-600" />
                  <span aria-hidden="true" className="num flex h-8 w-6 shrink-0 items-center text-sm text-slate-500">{String(i + 1).padStart(2, "0")}</span>
                  <div className="flex-1">
                    <p className="font-medium">{l.title}</p>
                    <p className="text-sm text-slate-600">{l.kind_display}{l.duration_minutes ? `, ${l.duration_minutes} min` : ""}{l.session_at ? `, ${when(l.session_at)}` : ""}</p>
                    {l.description && <p className="mt-1 text-sm text-slate-600">{l.description}</p>}
                  </div>
                  {l.url && <a href={l.url} target="_blank" rel="noopener noreferrer" className="link-draw shrink-0 text-sm font-semibold text-brand-strong">Open<span className="sr-only"> {l.title} (opens in a new tab)</span></a>}
                </Card></li>
              ))}
            </ol>
          )
        )}
      </div>
    </div>
  );
}
