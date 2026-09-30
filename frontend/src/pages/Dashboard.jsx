import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { inr, ModeBadge } from "../components/CourseCard.jsx";
import PageHeader, { Card, Notice } from "../components/PageHeader.jsx";

const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" });

export default function Dashboard() {
  const { user } = useAuth();
  const just = useLocation().state?.justEnrolled;
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api("/my-courses/").then(setItems).catch((e) => setError(e.message)); }, []);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (items || [])
    .filter((e) => e.course.start_date && e.course.start_date >= today)
    .sort((a, b) => a.course.start_date.localeCompare(b.course.start_date));
  const total = (items || []).reduce((s, e) => s + Number(e.amount), 0);

  const stats = [
    ["Courses enrolled", items?.length ?? "…"],
    ["Next class starts", upcoming[0] ? fmt(upcoming[0].course.start_date) : "None scheduled"],
    ["Total paid", items ? inr(total) : "…"],
  ];

  return (
    <div>
      <PageHeader title={`Welcome back, ${user.full_name.split(" ")[0]}`} subtitle="Here is where your learning stands.">
        <Link to="/courses" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Find a course</Link>
      </PageHeader>
      {just && <div className="mb-6"><Notice kind="ok">You are enrolled in {just}.</Notice></div>}
      {error && <Notice>{error}</Notice>}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {stats.map(([k, v]) => (
          <Card key={k}><p className="text-sm text-slate-500">{k}</p><p className="mt-1 text-2xl font-bold">{v}</p></Card>
        ))}
      </div>
      <h2 className="mb-4 text-lg font-semibold">Your courses</h2>
      {items?.length === 0 && (
        <Card><p className="text-slate-600">You have not enrolled in a course yet. <Link to="/courses" className="font-medium text-brand-600">Browse courses</Link></p></Card>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {items?.map((e) => (
          <Card key={e.id} className="flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{e.course.subject.name}</span>
              <ModeBadge mode={e.course.mode} label={e.course.mode_display} />
            </div>
            <h3 className="font-semibold">{e.course.title}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {e.course.start_date ? `Starts ${fmt(e.course.start_date)}` : "Start date to be announced"}
              {e.course.location && ` · ${e.course.location}`}
            </p>
            <Link to={`/learn/${e.course.slug}`} className="mt-4 self-start text-sm font-semibold text-brand-600 hover:underline">Open course →</Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
