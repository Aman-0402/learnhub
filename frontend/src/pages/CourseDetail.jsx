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
import { useRecent, useWishlist } from "../lib/store.js";

export default function CourseDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { data: course, error, status, loading, reload } = useFetch(() => api(`/courses/${slug}/`, { auth: false }), [slug]);
  useTitle(course?.title || "Course");
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
    course.instructor && ["Instructor", course.instructor_slug ? <Link key="i" to={`/instructors/${course.instructor_slug}`} className="text-brand hover:underline">{course.instructor}</Link> : course.instructor],
    course.location && ["Location", course.location],
    course.seats_left != null && ["Seats left", String(course.seats_left)],
  ].filter(Boolean);

  return (
    <div>
      <div className="relative mb-6 overflow-hidden rounded-3xl"><CourseThumb course={course} className="h-44 sm:h-56" label /><HeartButton className="absolute right-4 top-4" active={wish.has(course.slug)} onClick={() => wish.toggle(course.slug)} title={course.title} /></div>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-3">
            <span className="text-sm font-medium uppercase tracking-wide text-slate-500">{course.subject.name}</span>
            <ModeBadge mode={course.mode} label={course.mode_display} />
          </div>
          <h1 className="font-display text-4xl font-bold">{course.title}</h1>
          <p className="mt-4 whitespace-pre-line text-slate-700">{course.description}</p>
        </div>
        <aside aria-label="Enrollment" className="h-fit rounded-3xl border border-slate-200 bg-surface p-6 shadow-sm">
          <p className="text-3xl font-bold text-brand">{inr(course.fee)}</p>
          <dl className="mt-4 space-y-2 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4"><dt className="text-slate-500">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
            ))}
          </dl>
          {batches.length > 0 && !full && <BatchPicker batches={batches} value={batch} onChange={setBatch} />}
          {batches.length > 0 && isSample("batchesApi") && <div className="mt-3"><SampleNote>Sample batch timings. Real timings appear once batches are added on the server.</SampleNote></div>}
          {full ? (
            <p className="mt-6 rounded-lg bg-slate-100 px-4 py-2.5 text-center font-medium text-slate-600">Course is full</p>
          ) : (
            <button onClick={() => nav(`/checkout/${course.slug}${batch ? `?batch=${batch}` : ""}`)} disabled={needsBatch} aria-describedby={needsBatch ? "batch-hint" : undefined}
              className="mt-6 block w-full rounded-full bg-brand-600 px-4 py-3 text-center font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">
              Enroll now
            </button>
          )}
          {needsBatch && !full && <p id="batch-hint" className="mt-2 text-center text-xs text-slate-500">Choose a batch to continue.</p>}
        </aside>
      </div>
      {similar.length > 0 && (
        <section aria-labelledby="similar" className="mt-12">
          <h2 id="similar" className="mb-4 font-display text-2xl font-bold">More in {course.subject.name}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{similar.map((c) => <CourseCard key={c.id} course={c} />)}</div>
        </section>
      )}
    </div>
  );
}
