import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../lib/api.js";
import { inr, ModeBadge } from "../components/CourseCard.jsx";

export default function MyCourses() {
  const just = useLocation().state?.justEnrolled;
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api("/my-courses/").then(setItems).catch((e) => setError(e.message)); }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My courses</h1>
      {just && <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-2.5 text-emerald-800">You are enrolled in {just}.</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!items && !error && <p className="text-slate-500">Loading…</p>}
      {items && items.length === 0 && (
        <p className="text-slate-600">You have not enrolled in any course yet. <Link to="/courses" className="font-medium text-brand-600">Browse courses</Link></p>
      )}
      <div className="space-y-3">
        {items?.map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5">
            <div>
              <Link to={`/courses/${e.course.slug}`} className="font-semibold hover:text-brand-600">{e.course.title}</Link>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                <ModeBadge mode={e.course.mode} label={e.course.mode_display} />
                <span>{e.course.subject.name}</span>
              </div>
            </div>
            <div className="text-right text-sm"><p className="font-semibold">{inr(e.amount)}</p><p className="text-slate-500">Paid</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}
