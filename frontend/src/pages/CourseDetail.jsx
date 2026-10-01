import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useFetch, useTitle } from "../lib/hooks.js";
import { getBatches, isSample } from "../lib/services.js";
import { inr, ModeBadge } from "../components/CourseCard.jsx";
import { CourseThumb } from "../components/Media.jsx";
import { BatchPicker, SampleNote } from "../components/Batches.jsx";
import { DetailSkeleton, ErrorState } from "../components/States.jsx";
import CourseCard from "../components/CourseCard.jsx";
import { HeartButton } from "../components/Fun.jsx";
import { fetchAllCourses } from "../lib/catalog.js";
import { SITE } from "../lib/site.js";
import { useRecent, useWishlist } from "../lib/store.js";

export default function CourseDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { data: course, error, status, loading, reload } = useFetch(() => api(`/courses/${slug}/`, { auth: false }), [slug]);
  const toPlain = (t = "") => t.replace(/\s+/g, " ").trim();
  useTitle(course?.title || "Course", course ? {
    description: toPlain(course.description) || `${course.title}: a ${course.duration_weeks}-week ${course.mode_display.toLowerCase()} course.`,
    jsonLd: {
      "@context": "https://schema.org", "@type": "Course", name: course.title, description: toPlain(course.description),
      provider: { "@type": "Organization", name: SITE.name, sameAs: SITE.url },
      ...(course.instructor && { instructor: { "@type": "Person", name: course.instructor } }),
      offers: { "@type": "Offer", category: "Paid", price: String(course.fee), priceCurrency: "INR", url: `${SITE.url}/courses/${course.slug}`, availability: course.seats_left === 0 ? "https://schema.org/SoldOut" : "https://schema.org/InStock" },
      hasCourseInstance: { "@type": "CourseInstance", courseMode: course.mode === "online" ? "online" : course.mode === "offline" ? "onsite" : ["online", "onsite"], ...(course.start_date && { startDate: course.start_date }), ...(course.location && { location: course.location }) },
    },
  } : { noindex: true });
  const [batches, setBatches] = useState([]);
  const [batch, setBatch] = useState("");
  const wish = useWishlist();
  const recent = useRecent();
  const all = useFetch(() => fetchAllCourses());

  useEffect(() => { if (course) recent.push(course.slug); }, [course?.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (course) getBatches(course).then(setBatches).catch(() => setBatches([])); }, [course]);

  if (loading) return <DetailSkeleton />;
  if (error) return <ErrorState message={status === 404 ? "This course does not exist or is no longer available." : error} status={status} onRetry={reload} />;

  const full = course.seats_left === 0;
  const needsBatch = batches.length > 0 && !batch;
  const similar = (all.data || []).filter((c) => c.slug !== course.slug && c.subject.slug === course.subject.slug).slice(0, 3);
  const rows = [
    ["Duration", `${course.duration_weeks} weeks`],
    course.start_date && ["Starts", new Date(course.start_date).toLocaleDateString("en-IN", { dateStyle: "long" })],
    course.instructor && ["Instructor", course.instructor_slug ? <Link key="i" to={`/instructors/${course.instructor_slug}`} className="link-draw text-brand-strong">{course.instructor}</Link> : course.instructor],
    course.location && ["Location", course.location],
    course.seats_left != null && ["Seats left", String(course.seats_left)],
  ].filter(Boolean);

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-600">
        <Link to="/courses" className="link-draw">Courses</Link><span aria-hidden="true" className="mx-2">/</span><span>{course.subject.name}</span>
      </nav>
      <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="mb-5 flex items-center gap-3"><ModeBadge label={course.mode_display} /></div>
          <h1 className="text-4xl font-semibold leading-[1.05] sm:text-6xl">{course.title}</h1>
          <div className="relative mt-8 overflow-hidden rounded-[var(--radius-card)]"><CourseThumb course={course} className="h-28 sm:h-36" label /></div>
          <p className="mt-8 max-w-2xl whitespace-pre-line text-lg text-slate-700">{course.description}</p>
        </div>
        <aside aria-label="Enrollment" className="card h-fit p-6 lg:sticky lg:top-24">
          <div className="flex items-start justify-between gap-3">
            <p className="num text-4xl font-semibold">{inr(course.fee)}</p>
            <HeartButton active={wish.has(course.slug)} onClick={() => wish.toggle(course.slug)} title={course.title} />
          </div>
          <dl className="mt-5 space-y-3 border-t border-slate-200 pt-5 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4"><dt className="text-slate-600">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
            ))}
          </dl>
          {batches.length > 0 && !full && <BatchPicker batches={batches} value={batch} onChange={setBatch} />}
          {batches.length > 0 && isSample("batchesApi") && <div className="mt-3"><SampleNote>Sample batch timings. Real timings appear once batches are added on the server.</SampleNote></div>}
          {full ? (
            <p className="mt-6 rounded-xl bg-slate-100 px-4 py-3 text-center font-medium text-slate-600">Course is full</p>
          ) : (
            <button onClick={() => nav(`/checkout/${course.slug}${batch ? `?batch=${batch}` : ""}`)} disabled={needsBatch} aria-describedby={needsBatch ? "batch-hint" : undefined}
              className="btn btn-primary mt-6 w-full">
              Enroll now
            </button>
          )}
          {needsBatch && !full && <p id="batch-hint" className="mt-2 text-center text-xs text-slate-600">Choose a batch to continue.</p>}
        </aside>
      </div>
      {similar.length > 0 && (
        <section aria-labelledby="similar" className="mt-20">
          <h2 id="similar" className="mb-6 text-3xl font-semibold">More in {course.subject.name}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{similar.map((c) => <CourseCard key={c.id} course={c} />)}</div>
        </section>
      )}
    </div>
  );
}
