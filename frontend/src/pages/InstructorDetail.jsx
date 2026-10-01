import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useFetch, useTitle } from "../lib/hooks.js";
import { SITE } from "../lib/site.js";
import { inr } from "../components/CourseCard.jsx";
import { Avatar } from "../components/Media.jsx";
import { DetailSkeleton, ErrorState } from "../components/States.jsx";

export default function InstructorDetail() {
  const { slug } = useParams();
  const { data: p, error, status, loading, reload } = useFetch(() => api(`/instructors/${slug}/`, { auth: false }), [slug]);
  useTitle(p?.name || "Instructor", p ? {
    description: (p.bio || p.headline || `${p.name} teaches at ${SITE.name}.`).replace(/\s+/g, " ").slice(0, 200),
    type: "profile",
    jsonLd: { "@context": "https://schema.org", "@type": "Person", name: p.name, ...(p.headline && { jobTitle: p.headline }), url: `${SITE.url}/instructors/${p.slug}`, worksFor: { "@type": "EducationalOrganization", name: SITE.name } },
  } : { noindex: true });
  if (loading) return <DetailSkeleton />;
  if (error) return <ErrorState message={status === 404 ? "This instructor profile does not exist." : error} status={status} onRetry={reload} />;
  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/instructors" className="link-draw text-sm text-slate-600">All instructors</Link>
      <div className="mt-4 flex items-center gap-5">
        <Avatar name={p.name} photo={p.photo_url} size="h-20 w-20" text="text-2xl" />
        <div><h1 className="text-4xl font-semibold sm:text-5xl">{p.name}</h1>{p.headline && <p className="mt-1 text-slate-600">{p.headline}</p>}</div>
      </div>
      {p.bio && <p className="mt-5 whitespace-pre-line text-slate-700">{p.bio}</p>}
      <h2 className="mb-4 mt-12 text-2xl font-semibold">Courses</h2>
      <div className="border-t border-slate-200">
        {p.courses.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-4 border-b border-slate-200 py-4">
            <Link to={`/courses/${c.slug}`} className="link-draw font-medium">{c.title}</Link>
            <span className="num font-semibold">{inr(c.fee)}</span>
          </div>
        ))}
        {p.courses.length === 0 && <p className="text-slate-600">No courses listed yet.</p>}
      </div>
    </div>
  );
}
