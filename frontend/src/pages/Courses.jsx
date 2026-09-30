import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import CourseCard from "../components/CourseCard.jsx";

const MODES = [
  ["", "All formats"],
  ["online", "Online"],
  ["offline", "Offline"],
  ["hybrid", "Online + Offline"],
];

export default function Courses() {
  const [params, setParams] = useSearchParams();
  const [subjects, setSubjects] = useState([]);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const q = params.get("q") || "";
  const subject = params.get("subject") || "";
  const mode = params.get("mode") || "";

  useEffect(() => { api("/subjects/", { auth: false }).then(setSubjects).catch(() => {}); }, []);
  useEffect(() => {
    setData(null); setError("");
    const qs = new URLSearchParams({ ...(q && { q }), ...(subject && { subject }), ...(mode && { mode }) });
    api(`/courses/?${qs}`, { auth: false }).then(setData).catch((e) => setError(e.message));
  }, [q, subject, mode]);

  const set = (k, v) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    setParams(next, { replace: true });
  };

  const field = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Courses</h1>
      <div className="mb-6 flex flex-wrap gap-3">
        <input className={`${field} min-w-56 flex-1`} placeholder="Search courses" value={q} onChange={(e) => set("q", e.target.value)} />
        <select className={field} value={subject} onChange={(e) => set("subject", e.target.value)}>
          <option value="">All subjects</option>
          {subjects.map((s) => <option key={s.id} value={s.slug}>{s.name}</option>)}
        </select>
        <select className={field} value={mode} onChange={(e) => set("mode", e.target.value)}>
          {MODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      {error && <p className="text-red-600">{error}</p>}
      {!data && !error && <p className="text-slate-500">Loading…</p>}
      {data && data.results.length === 0 && <p className="text-slate-500">No courses match your filters.</p>}
      {data && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.results.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      )}
    </div>
  );
}
