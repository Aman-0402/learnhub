import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { inr } from "../components/CourseCard.jsx";
import { Card, Notice } from "../components/PageHeader.jsx";

export default function InstructorDetail() {
  const { slug } = useParams();
  const [p, setP] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api(`/instructors/${slug}/`, { auth: false }).then(setP).catch((e) => setError(e.status === 404 ? "Instructor not found." : e.message)); }, [slug]);

  if (error) return <Notice>{error}</Notice>;
  if (!p) return <p className="text-slate-500">Loading…</p>;
  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/instructors" className="text-sm text-slate-500 hover:text-slate-800">← All instructors</Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">{p.name}</h1>
      {p.headline && <p className="mt-1 text-slate-600">{p.headline}</p>}
      {p.bio && <p className="mt-5 whitespace-pre-line text-slate-700">{p.bio}</p>}
      <h2 className="mb-3 mt-8 text-lg font-semibold">Courses</h2>
      <div className="space-y-3">
        {p.courses.map((c) => (
          <Card key={c.id} className="flex items-center justify-between !p-4">
            <Link to={`/courses/${c.slug}`} className="font-medium hover:text-brand-600">{c.title}</Link>
            <span className="font-semibold text-brand-600">{inr(c.fee)}</span>
          </Card>
        ))}
        {p.courses.length === 0 && <p className="text-slate-600">No courses listed yet.</p>}
      </div>
    </div>
  );
}
