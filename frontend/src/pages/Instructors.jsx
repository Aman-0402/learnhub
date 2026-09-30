import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import PageHeader, { Card, Notice } from "../components/PageHeader.jsx";

const initials = (n) => n.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export default function Instructors() {
  const [people, setPeople] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api("/instructors/", { auth: false }).then(setPeople).catch((e) => setError(e.message)); }, []);

  return (
    <div>
      <PageHeader title="Our instructors" subtitle="Meet the teachers behind our courses." />
      {error && <Notice>{error}</Notice>}
      {!people && !error && <p className="text-slate-500">Loading…</p>}
      {people?.length === 0 && <p className="text-slate-600">Instructor profiles will appear here once they are added.</p>}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {people?.map((p) => (
          <Card key={p.id}>
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">{initials(p.name)}</span>
              <div>
                <h2 className="font-semibold"><Link to={`/instructors/${p.slug}`} className="hover:text-brand-600">{p.name}</Link></h2>
                <p className="text-sm text-slate-500">{p.headline || p.subjects.join(", ")}</p>
              </div>
            </div>
            {p.bio && <p className="mt-4 line-clamp-3 text-sm text-slate-600">{p.bio}</p>}
            <ul className="mt-4 space-y-1.5 text-sm">
              {p.courses.map((c) => (
                <li key={c.id}><Link to={`/courses/${c.slug}`} className="text-brand-600 hover:underline">{c.title}</Link></li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
