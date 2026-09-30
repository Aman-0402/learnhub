import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAllCourses } from "../lib/api.js";
import PageHeader, { Card, Notice } from "../components/PageHeader.jsx";

const initials = (n) => n.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export default function Instructors() {
  const [people, setPeople] = useState(null);
  const [error, setError] = useState("");

  // There is no instructors endpoint yet, so faculty are derived from each course's instructor name.
  useEffect(() => {
    fetchAllCourses()
      .then((courses) => {
        const map = new Map();
        for (const c of courses) {
          if (!c.instructor) continue;
          const p = map.get(c.instructor) || { name: c.instructor, subjects: new Set(), courses: [] };
          p.subjects.add(c.subject.name);
          p.courses.push(c);
          map.set(c.instructor, p);
        }
        setPeople([...map.values()].sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <PageHeader title="Our instructors" subtitle="Meet the teachers behind our courses." />
      {error && <Notice>{error}</Notice>}
      {!people && !error && <p className="text-slate-500">Loading…</p>}
      {people?.length === 0 && <p className="text-slate-600">Instructor profiles will appear here once courses are added.</p>}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {people?.map((p) => (
          <Card key={p.name}>
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">{initials(p.name)}</span>
              <div><h2 className="font-semibold">{p.name}</h2><p className="text-sm text-slate-500">{[...p.subjects].join(", ")}</p></div>
            </div>
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
