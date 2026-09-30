import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useFetch, useTitle } from "../lib/hooks.js";
import PageHeader, { Card } from "../components/PageHeader.jsx";
import { Avatar } from "../components/Media.jsx";
import { CardGridSkeleton, ErrorState } from "../components/States.jsx";

export default function Instructors() {
  useTitle("Instructors");
  const { data, error, loading, reload } = useFetch(() => api("/instructors/", { auth: false }));
  return (
    <div>
      <PageHeader title="Our instructors" subtitle="Meet the teachers behind our courses." />
      {loading && <CardGridSkeleton />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data?.length === 0 && <p className="text-slate-600">Instructor profiles will appear here once they are added.</p>}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((p) => (
          <Card key={p.id}>
            <div className="flex items-center gap-4">
              <Avatar name={p.name} photo={p.photo_url} />
              <div>
                <h2 className="font-semibold"><Link to={`/instructors/${p.slug}`} className="hover:text-brand">{p.name}</Link></h2>
                <p className="text-sm text-slate-500">{p.headline || p.subjects.join(", ")}</p>
              </div>
            </div>
            {p.bio && <p className="mt-4 line-clamp-3 text-sm text-slate-600">{p.bio}</p>}
            <ul className="mt-4 space-y-1.5 text-sm">
              {p.courses.map((c) => <li key={c.id}><Link to={`/courses/${c.slug}`} className="text-brand hover:underline">{c.title}</Link></li>)}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
