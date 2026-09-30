import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { ModeBadge } from "../components/CourseCard.jsx";
import { Card, Notice } from "../components/PageHeader.jsx";

const TABS = ["Overview", "Schedule", "Materials"];

export default function Learn() {
  const { slug } = useParams();
  const [enrollment, setEnrollment] = useState(undefined); // undefined = loading, null = not enrolled
  const [tab, setTab] = useState("Overview");
  const [error, setError] = useState("");

  useEffect(() => {
    api("/my-courses/")
      .then((list) => setEnrollment(list.find((e) => e.course.slug === slug) || null))
      .catch((e) => setError(e.message));
  }, [slug]);

  if (error) return <Notice>{error}</Notice>;
  if (enrollment === undefined) return <p className="text-slate-500">Loading…</p>;
  if (enrollment === null) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <h1 className="text-xl font-bold">You are not enrolled in this course</h1>
        <p className="mt-2 text-slate-600">Enroll to get access to the course space.</p>
        <Link to={`/courses/${slug}`} className="mt-5 inline-block rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700">View course</Link>
      </Card>
    );
  }

  const c = enrollment.course;
  const detail = [
    ["Instructor", c.instructor],
    ["Format", c.mode_display],
    ["Duration", `${c.duration_weeks} weeks`],
    ["Starts", c.start_date && new Date(c.start_date).toLocaleDateString("en-IN", { dateStyle: "long" })],
    ["Location", c.location],
  ].filter(([, v]) => v);

  return (
    <div>
      <Link to="/dashboard" className="text-sm text-slate-500 hover:text-slate-800">← Dashboard</Link>
      <div className="mt-3 mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{c.title}</h1>
        <ModeBadge mode={c.mode} label={c.mode_display} />
      </div>
      <div className="mb-6 flex gap-1 border-b border-slate-200" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === t ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === "Overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2"><h2 className="mb-2 font-semibold">About this course</h2><p className="whitespace-pre-line text-slate-700">{c.description}</p></Card>
          <Card>
            <h2 className="mb-3 font-semibold">Course details</h2>
            <dl className="space-y-2 text-sm">
              {detail.map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-slate-500">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}
            </dl>
          </Card>
        </div>
      )}
      {tab === "Schedule" && (
        <Card>
          {c.start_date ? (
            <p>Classes begin on <strong>{new Date(c.start_date).toLocaleDateString("en-IN", { dateStyle: "full" })}</strong>{c.location && <> at <strong>{c.location}</strong></>}. The full weekly timetable will be shared here.</p>
          ) : <p className="text-slate-600">The start date has not been announced yet.</p>}
        </Card>
      )}
      {tab === "Materials" && (
        <Card className="text-center"><p className="font-medium">No materials yet</p><p className="mt-1 text-sm text-slate-600">Lessons, notes and recordings will appear here once your instructor adds them.</p></Card>
      )}
    </div>
  );
}
