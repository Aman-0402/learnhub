import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useFetch, useTitle } from "../lib/hooks.js";
import PageHeader from "../components/PageHeader.jsx";
import { Avatar } from "../components/Media.jsx";
import { Reveal } from "../components/Fun.jsx";
import { ErrorState, ListSkeleton } from "../components/States.jsx";

export default function Instructors() {
  useTitle("Instructors", { description: "Meet the instructors teaching LearnHub courses, with their subjects and the courses they lead." });
  const { data, error, loading, reload } = useFetch(() => api("/instructors/", { auth: false }));
  return (
    <div>
      <PageHeader title="Instructors" subtitle="The teachers behind our courses." />
      {loading && <ListSkeleton rows={4} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data?.length === 0 && <p className="text-slate-600">Instructor profiles will appear here once they are added.</p>}
      <ul className="border-t border-slate-200">
        {data?.map((p, i) => (
          <Reveal as="li" key={p.id} delay={(i % 4) * 50} className="grid gap-5 border-b border-slate-200 py-7 md:grid-cols-[20rem_1fr] md:gap-10">
            <div className="flex items-center gap-4">
              <Avatar name={p.name} photo={p.photo_url} />
              <div>
                <h2 className="text-xl font-semibold"><Link to={`/instructors/${p.slug}`} className="link-draw">{p.name}</Link></h2>
                <p className="text-sm text-slate-600">{p.headline || p.subjects.join(", ")}</p>
              </div>
            </div>
            <div>
              {p.bio && <p className="line-clamp-3 max-w-2xl text-slate-700">{p.bio}</p>}
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                {p.courses.map((c) => <li key={c.id}><Link to={`/courses/${c.slug}`} className="link-draw font-medium text-brand-strong">{c.title}</Link></li>)}
              </ul>
            </div>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}
