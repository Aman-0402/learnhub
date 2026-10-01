import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useFetch, useTitle } from "../../lib/hooks.js";
import { check, fieldErrors, manage, MODES } from "../../lib/manage.js";
import { FormError, FormField, Toggle } from "../../components/admin/Kit.jsx";
import { DetailSkeleton, ErrorState } from "../../components/States.jsx";
import { BatchesPanel, LessonsPanel } from "./CourseParts.jsx";

function Form({ course, subjects, instructors }) {
  const nav = useNavigate();
  const [f, setF] = useState({
    title: course?.title || "", subject: course?.subject ?? "", mode: course?.mode || "online", description: course?.description || "",
    instructor: course?.instructor ?? "", fee: course?.fee ?? "", duration_weeks: course?.duration_weeks ?? 4, start_date: course?.start_date || "",
    location: course?.location || "", seats: course?.seats ?? "", is_published: course ? course.is_published : true,
  });
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const needsLocation = f.mode !== "online";
  const paid = course?.paid_count || 0;

  const submit = async (e) => {
    e.preventDefault();
    const seatsErr = check.int(f.seats, "Seats", { min: 1, optional: true }) || (f.seats !== "" && Number(f.seats) < paid ? `Seats cannot be below the ${paid} already paid.` : "");
    const local = {
      title: check.required(f.title, "Title"), subject: f.subject ? "" : "Choose a subject.", description: check.required(f.description, "Description"),
      fee: check.money(f.fee, "Fee"), duration_weeks: check.int(f.duration_weeks, "Duration", { min: 1 }),
      location: needsLocation ? check.required(f.location, "Location") : "", seats: seatsErr,
    };
    if (Object.values(local).some(Boolean)) { setErrs(local); setSaved(""); return; }
    setBusy(true); setErrs({}); setSaved("");
    const body = {
      title: f.title.trim(), subject: Number(f.subject), mode: f.mode, description: f.description, instructor: f.instructor === "" ? null : Number(f.instructor),
      fee: f.fee, duration_weeks: Number(f.duration_weeks), start_date: f.start_date || null, location: f.location.trim(),
      seats: f.seats === "" ? null : Number(f.seats), is_published: f.is_published,
    };
    try {
      if (course) { await manage.update("courses", course.id, body); setSaved("Changes saved."); }
      else { const c = await manage.create("courses", body); nav(`/manage/courses/${c.id}`, { replace: true }); }
    } catch (err) { setErrs(fieldErrors(err)); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} noValidate className="max-w-3xl space-y-6">
      <FormError>{errs._form}</FormError>
      <FormField label="Title" error={errs.title}>{(p) => <input {...p} className="field" maxLength={200} value={f.title} onChange={set("title")} />}</FormField>
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField label="Subject" error={errs.subject}>{(p) => (
          <select {...p} className="field" value={f.subject} onChange={set("subject")}>
            <option value="">Choose a subject</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>)}</FormField>
        <FormField label="Instructor" error={errs.instructor}>{(p) => (
          <select {...p} className="field" value={f.instructor} onChange={set("instructor")}>
            <option value="">No instructor</option>{instructors.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>)}</FormField>
        <FormField label="Format" error={errs.mode}>{(p) => <select {...p} className="field" value={f.mode} onChange={set("mode")}>{MODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}</FormField>
        <FormField label="Location" error={errs.location} hint={needsLocation ? "Required for offline and hybrid courses." : "Only needed for offline and hybrid courses."}>{(p) => <input {...p} className="field" maxLength={200} value={f.location} onChange={set("location")} />}</FormField>
        <FormField label="Fee (INR)" error={errs.fee}>{(p) => <input {...p} inputMode="decimal" className="field" value={f.fee} onChange={set("fee")} />}</FormField>
        <FormField label="Duration (weeks)" error={errs.duration_weeks}>{(p) => <input {...p} inputMode="numeric" className="field" value={f.duration_weeks} onChange={set("duration_weeks")} />}</FormField>
        <FormField label="Start date" error={errs.start_date}>{(p) => <input {...p} type="date" className="field" value={f.start_date} onChange={set("start_date")} />}</FormField>
        <FormField label="Seats" error={errs.seats} hint={paid ? `Empty means no limit. ${paid} already paid.` : "Empty means no limit."}>{(p) => <input {...p} inputMode="numeric" className="field" value={f.seats} onChange={set("seats")} />}</FormField>
      </div>
      <FormField label="Description" error={errs.description}>{(p) => <textarea {...p} rows={6} className="field" value={f.description} onChange={set("description")} />}</FormField>
      <div className="flex items-center gap-3"><Toggle label="Published" checked={f.is_published} onChange={(v) => setF({ ...f, is_published: v })} /><span className="text-sm">Published (visible on the site)</span></div>
      <div className="flex items-center gap-4">
        <button className="btn btn-primary" disabled={busy}>{busy ? "Saving..." : course ? "Save changes" : "Create course"}</button>
        <Link to="/manage/courses" className="btn btn-quiet">Back to courses</Link>
        <span role="status" className="text-sm text-slate-600">{saved}</span>
      </div>
    </form>
  );
}

export default function CourseForm() {
  const { id } = useParams();
  const isNew = !id;
  useTitle(isNew ? "New course" : "Edit course", { noindex: true });
  const data = useFetch(async () => {
    const [subjects, instructors, course] = await Promise.all([manage.all("subjects"), manage.all("instructors"), isNew ? null : manage.get("courses", id)]);
    return { subjects, instructors, course };
  }, [id]);

  if (data.loading) return <DetailSkeleton />;
  if (data.error) return <ErrorState message={data.status === 404 ? "That course does not exist." : data.error} status={data.status} onRetry={data.reload} />;
  const { subjects, instructors, course } = data.data;

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-600"><Link to="/manage/courses" className="link-draw">Courses</Link><span aria-hidden="true" className="mx-2">/</span><span>{isNew ? "New" : course.title}</span></nav>
      <h1 className="mb-8 text-4xl font-semibold">{isNew ? "New course" : "Edit course"}</h1>
      {isNew && subjects.length === 0 && <p className="mb-6 text-sm text-slate-700">There are no subjects yet. <Link to="/manage/subjects" className="link-draw font-semibold text-brand-strong">Add a subject</Link> first.</p>}
      <Form key={course?.id || "new"} course={course} subjects={subjects} instructors={instructors} />
      {course && <><BatchesPanel course={course} /><LessonsPanel course={course} /></>}
    </div>
  );
}
