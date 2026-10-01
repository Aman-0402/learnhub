import { useState } from "react";
import { PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useFetch } from "../../lib/hooks.js";
import { check, fieldErrors, manage, KINDS, WEEKDAYS } from "../../lib/manage.js";
import { ConfirmDialog, Dialog, FormError, FormField, StatusTag, Toggle } from "../../components/admin/Kit.jsx";
import { ErrorState, ListSkeleton } from "../../components/States.jsx";

const hhmm = (t) => (t || "").slice(0, 5);
const localDT = (iso) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

function Actions({ onEdit, onDelete, name }) {
  return (
    <div className="flex gap-2">
      <button className="btn btn-quiet btn-sm" onClick={onEdit} aria-label={`Edit ${name}`}><PencilSimple size={16} aria-hidden="true" />Edit</button>
      <button className="btn btn-quiet btn-sm" onClick={onDelete} aria-label={`Delete ${name}`}><Trash size={16} aria-hidden="true" />Delete</button>
    </div>
  );
}

/** Shared list + dialog + delete scaffolding for the two child resources. */
function Panel({ title, resource, courseId, addLabel, empty, renderRow, renderForm, deleteText }) {
  const list = useFetch(() => manage.all(resource, { course: courseId }), [courseId]);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [delError, setDelError] = useState("");
  const [busy, setBusy] = useState(false);
  const close = () => setEditing(null);
  const done = () => { close(); list.reload(); };
  const confirmDelete = async () => {
    setBusy(true); setDelError("");
    try { await manage.remove(resource, deleting.id); setDeleting(null); list.reload(); }
    catch (err) { setDelError(err.message); } finally { setBusy(false); }
  };
  const h = `${resource}-h`;
  return (
    <section aria-labelledby={h} className="mt-14">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 id={h} className="text-2xl font-semibold">{title}</h2>
        <button className="btn btn-quiet btn-sm" onClick={() => setEditing({})}><Plus size={16} aria-hidden="true" />{addLabel}</button>
      </div>
      {list.loading && <ListSkeleton rows={2} />}
      {list.error && <ErrorState message={list.error} status={list.status} onRetry={list.reload} />}
      {list.data && (list.data.length === 0
        ? <p className="border-t border-slate-200 py-6 text-sm text-slate-600">{empty}</p>
        : (
          <ul className="border-t border-slate-200">
            {list.data.map((it) => (
              <li key={it.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 py-4">
                <div className="min-w-0">{renderRow(it)}</div>
                <Actions name={it.label || it.title} onEdit={() => setEditing(it)} onDelete={() => { setDelError(""); setDeleting(it); }} />
              </li>
            ))}
          </ul>
        ))}
      <Dialog open={!!editing} onClose={close} title={editing?.id ? `Edit ${resource === "batches" ? "batch" : "lesson"}` : addLabel} wide>
        {editing && renderForm({ item: editing.id ? editing : null, onDone: done, onClose: close })}
      </Dialog>
      <ConfirmDialog open={!!deleting} title={`Delete "${deleting?.label || deleting?.title}"?`} busy={busy} error={delError} onConfirm={confirmDelete} onClose={() => setDeleting(null)}>
        <p>{deleteText}</p>
      </ConfirmDialog>
    </section>
  );
}

function FormShell({ errs, busy, onClose, submitLabel, onSubmit, children }) {
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <FormError>{errs._form}</FormError>
      {children}
      <div className="flex justify-end gap-3">
        <button type="button" className="btn btn-quiet btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? "Saving..." : submitLabel}</button>
      </div>
    </form>
  );
}

function useSave(resource, item, onDone) {
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const save = async (body, local) => {
    if (Object.values(local).some(Boolean)) return setErrs(local);
    setBusy(true); setErrs({});
    try { item ? await manage.update(resource, item.id, body) : await manage.create(resource, body); onDone(); }
    catch (err) { setErrs(fieldErrors(err)); } finally { setBusy(false); }
  };
  return { errs, busy, save };
}

function BatchForm({ course, item, onDone, onClose }) {
  const [f, setF] = useState({
    label: item?.label || "", days: item?.days || [], start_time: hhmm(item?.start_time), end_time: hhmm(item?.end_time),
    start_date: item?.start_date || "", format: item?.format || "", seats: item?.seats ?? "", is_active: item ? item.is_active : true,
  });
  const { errs, busy, save } = useSave("batches", item, onDone);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggleDay = (d) => setF({ ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d] });
  const submit = (e) => {
    e.preventDefault();
    const local = {
      label: check.required(f.label, "Label"),
      days: f.days.length ? "" : "Pick at least one day.",
      start_time: check.required(f.start_time, "Start time"),
      end_time: check.required(f.end_time, "End time") || (f.start_time && f.end_time <= f.start_time ? "End time must be after the start time." : ""),
      seats: check.int(f.seats, "Seats", { min: 1, optional: true }),
    };
    save({ course: course.id, label: f.label.trim(), days: WEEKDAYS.filter((d) => f.days.includes(d)), start_time: f.start_time, end_time: f.end_time, start_date: f.start_date || null, format: f.format, seats: f.seats === "" ? null : Number(f.seats), is_active: f.is_active }, local);
  };
  return (
    <FormShell errs={errs} busy={busy} onClose={onClose} onSubmit={submit} submitLabel={item ? "Save changes" : "Add batch"}>
      <FormField label="Label" error={errs.label} hint="For example: Weekday evenings">{(p) => <input {...p} className="field" value={f.label} maxLength={100} onChange={set("label")} autoFocus />}</FormField>
      <fieldset aria-describedby={errs.days ? "days-e" : undefined}>
        <legend className="mb-1.5 text-sm font-medium">Days</legend>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((d) => (
            <label key={d} className={`flex min-h-11 min-w-14 cursor-pointer items-center justify-center rounded-xl border px-3 text-sm font-semibold ${f.days.includes(d) ? "border-transparent bg-slate-900 text-slate-50" : "border-slate-300"} has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--color-brand)]`}>
              <input type="checkbox" className="sr-only" checked={f.days.includes(d)} onChange={() => toggleDay(d)} />{d}
            </label>
          ))}
        </div>
        {errs.days && <p id="days-e" className="mt-1.5 text-sm text-red-700">{errs.days}</p>}
      </fieldset>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Start time" error={errs.start_time}>{(p) => <input {...p} type="time" className="field" value={f.start_time} onChange={set("start_time")} />}</FormField>
        <FormField label="End time" error={errs.end_time}>{(p) => <input {...p} type="time" className="field" value={f.end_time} onChange={set("end_time")} />}</FormField>
        <FormField label="Start date" error={errs.start_date} hint="Empty uses the course start date.">{(p) => <input {...p} type="date" className="field" value={f.start_date} onChange={set("start_date")} />}</FormField>
        <FormField label="Seats" error={errs.seats} hint="Empty means no limit.">{(p) => <input {...p} inputMode="numeric" className="field" value={f.seats} onChange={set("seats")} />}</FormField>
      </div>
      <FormField label="Format" error={errs.format} hint="For example: In person. Empty uses the course format.">{(p) => <input {...p} className="field" value={f.format} maxLength={100} onChange={set("format")} />}</FormField>
      <div className="flex items-center gap-3"><Toggle label="Active" checked={f.is_active} onChange={(v) => setF({ ...f, is_active: v })} /><span className="text-sm">Active (students can pick this batch)</span></div>
    </FormShell>
  );
}

function LessonForm({ course, item, onDone, onClose }) {
  const [f, setF] = useState({
    title: item?.title || "", kind: item?.kind || "video", order: item?.order ?? 1, description: item?.description || "", url: item?.url || "",
    session_at: localDT(item?.session_at), duration_minutes: item?.duration_minutes ?? "", is_published: item ? item.is_published : true,
  });
  const { errs, busy, save } = useSave("lessons", item, onDone);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    let urlErr = "";
    if (f.url) { try { new URL(f.url); } catch { urlErr = "Enter a full link, starting with https://"; } }
    const local = {
      title: check.required(f.title, "Title"), order: check.int(f.order, "Order", { min: 1 }),
      duration_minutes: check.int(f.duration_minutes, "Duration", { min: 1, optional: true }), url: urlErr,
    };
    save({ course: course.id, title: f.title.trim(), kind: f.kind, order: Number(f.order), description: f.description, url: f.url, session_at: f.session_at ? new Date(f.session_at).toISOString() : null, duration_minutes: f.duration_minutes === "" ? null : Number(f.duration_minutes), is_published: f.is_published }, local);
  };
  return (
    <FormShell errs={errs} busy={busy} onClose={onClose} onSubmit={submit} submitLabel={item ? "Save changes" : "Add lesson"}>
      <FormField label="Title" error={errs.title}>{(p) => <input {...p} className="field" value={f.title} maxLength={200} onChange={set("title")} autoFocus />}</FormField>
      <div className="grid gap-5 sm:grid-cols-3">
        <FormField label="Type" error={errs.kind}>{(p) => <select {...p} className="field" value={f.kind} onChange={set("kind")}>{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}</FormField>
        <FormField label="Order" error={errs.order}>{(p) => <input {...p} inputMode="numeric" className="field" value={f.order} onChange={set("order")} />}</FormField>
        <FormField label="Duration (minutes)" error={errs.duration_minutes}>{(p) => <input {...p} inputMode="numeric" className="field" value={f.duration_minutes} onChange={set("duration_minutes")} />}</FormField>
      </div>
      <FormField label="Link" error={errs.url} hint="Video, document or meeting link.">{(p) => <input {...p} type="url" className="field" value={f.url} onChange={set("url")} />}</FormField>
      <FormField label="Session time" error={errs.session_at} hint="For live or in-person classes.">{(p) => <input {...p} type="datetime-local" className="field" value={f.session_at} onChange={set("session_at")} />}</FormField>
      <FormField label="Description" error={errs.description}>{(p) => <textarea {...p} rows={3} className="field" value={f.description} onChange={set("description")} />}</FormField>
      <div className="flex items-center gap-3"><Toggle label="Published" checked={f.is_published} onChange={(v) => setF({ ...f, is_published: v })} /><span className="text-sm">Published (visible to enrolled students)</span></div>
    </FormShell>
  );
}

export function BatchesPanel({ course }) {
  return (
    <Panel title="Batches" resource="batches" courseId={course.id} addLabel="Add batch" empty="No batches. Students enroll in the course directly."
      deleteText="Enrollments in this batch are kept, but lose their batch."
      renderRow={(b) => (
        <>
          <p className="flex items-center gap-3 font-display text-lg font-semibold">{b.label}<StatusTag on={b.is_active} yes="Active" no="Inactive" /></p>
          <p className="num text-sm text-slate-600">{b.days.join(", ")}, {hhmm(b.start_time)} to {hhmm(b.end_time)} <span aria-hidden="true">·</span> {b.paid_count} / {b.seats ?? "no limit"} seats</p>
        </>
      )}
      renderForm={(p) => <BatchForm course={course} {...p} />} />
  );
}

export function LessonsPanel({ course }) {
  return (
    <Panel title="Lessons" resource="lessons" courseId={course.id} addLabel="Add lesson" empty="No lessons yet."
      deleteText="This lesson will be removed from the course."
      renderRow={(l) => (
        <>
          <p className="flex items-center gap-3 font-display text-lg font-semibold"><span className="num text-slate-500">{l.order}.</span>{l.title}<StatusTag on={l.is_published} /></p>
          <p className="text-sm text-slate-600">{KINDS.find(([v]) => v === l.kind)?.[1]}{l.duration_minutes ? `, ${l.duration_minutes} min` : ""}</p>
        </>
      )}
      renderForm={(p) => <LessonForm course={course} {...p} />} />
  );
}
