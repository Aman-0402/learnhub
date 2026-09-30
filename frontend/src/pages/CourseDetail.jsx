import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useFetch, useTitle } from "../lib/hooks.js";
import { getBatches, isSample } from "../lib/services.js";
import { inr, ModeBadge } from "../components/CourseCard.jsx";
import { CourseThumb } from "../components/Media.jsx";
import { BatchPicker, SampleNote } from "../components/Batches.jsx";
import { DetailSkeleton, ErrorState } from "../components/States.jsx";

export default function CourseDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { data: course, error, status, loading, reload } = useFetch(() => api(`/courses/${slug}/`, { auth: false }), [slug]);
  useTitle(course?.title || "Course");
  const [batches, setBatches] = useState([]);
  const [batch, setBatch] = useState("");

  useEffect(() => { if (course) getBatches(course).then(setBatches).catch(() => setBatches([])); }, [course]);

  if (loading) return <DetailSkeleton />;
  if (error) return <ErrorState message={status === 404 ? "This course does not exist or is no longer available." : error} status={status} onRetry={reload} />;

  const full = course.seats_left === 0;
  const needsBatch = batches.length > 0 && !batch;
  const rows = [
    ["Duration", `${course.duration_weeks} weeks`],
    course.start_date && ["Starts", new Date(course.start_date).toLocaleDateString("en-IN", { dateStyle: "long" })],
    course.instructor && ["Instructor", course.instructor_slug ? <Link key="i" to={`/instructors/${course.instructor_slug}`} className="text-brand hover:underline">{course.instructor}</Link> : course.instructor],
    course.location && ["Location", course.location],
    course.seats_left != null && ["Seats left", String(course.seats_left)],
  ].filter(Boolean);

  return (
    <div>
      <div className="mb-6 overflow-hidden rounded-xl"><CourseThumb course={course} className="h-44 sm:h-56" label /></div>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-3">
            <span className="text-sm font-medium uppercase tracking-wide text-slate-500">{course.subject.name}</span>
            <ModeBadge mode={course.mode} label={course.mode_display} />
          </div>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="mt-4 whitespace-pre-line text-slate-700">{course.description}</p>
        </div>
        <aside aria-label="Enrollment" className="h-fit rounded-xl border border-slate-200 bg-surface p-6 shadow-sm">
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
              className="mt-6 block w-full rounded-lg bg-brand-600 px-4 py-2.5 text-center font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">
              Enroll now
            </button>
          )}
          {needsBatch && !full && <p id="batch-hint" className="mt-2 text-center text-xs text-slate-500">Choose a batch to continue.</p>}
        </aside>
      </div>
    </div>
  );
}
