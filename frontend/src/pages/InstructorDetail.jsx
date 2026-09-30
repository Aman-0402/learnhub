import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useFetch, useTitle } from "../lib/hooks.js";
import { inr } from "../components/CourseCard.jsx";
import { Card } from "../components/PageHeader.jsx";
import { Avatar } from "../components/Media.jsx";
import { DetailSkeleton, ErrorState } from "../components/States.jsx";

export default function InstructorDetail() {
  const { slug } = useParams();
  const { data: p, error, status, loading, reload } = useFetch(() => api(`/instructors/${slug}/`, { auth: false }), [slug]);
  useTitle(p?.name || "Instructor");
  if (loading) return <DetailSkeleton />;
  if (error) return <ErrorState message={status === 404 ? "This instructor profile does not exist." : error} status={status} onRetry={reload} />;
  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/instructors" className="text-sm text-slate-500 hover:text-slate-800">← All instructors</Link>
      <div className="mt-4 flex items-center gap-5">
        <Avatar name={p.name} photo={p.photo_url} size="h-20 w-20" text="text-2xl" />
        <div><h1 className="text-3xl font-bold tracking-tight">{p.name}</h1>{p.headline && <p className="mt-1 text-slate-600">{p.headline}</p>}</div>
      </div>
      {p.bio && <p className="mt-5 whitespace-pre-line text-slate-700">{p.bio}</p>}
      <h2 className="mb-3 mt-8 text-lg font-semibold">Courses</h2>
      <div className="space-y-3">
        {p.courses.map((c) => (
          <Card key={c.id} className="flex items-center justify-between !p-4">
            <Link to={`/courses/${c.slug}`} className="font-medium hover:text-brand">{c.title}</Link>
            <span className="font-semibold text-brand">{inr(c.fee)}</span>
          </Card>
        ))}
        {p.courses.length === 0 && <p className="text-slate-600">No courses listed yet.</p>}
      </div>
    </div>
  );
}
