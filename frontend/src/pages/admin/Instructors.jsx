import { useState } from "react";
import { Plus, PencilSimple, Trash } from "@phosphor-icons/react";
import { useFetch, useTitle } from "../../lib/hooks.js";
import { check, fieldErrors, manage } from "../../lib/manage.js";
import { Dialog, ConfirmDialog, FormError, FormField, StatusTag, Toggle } from "../../components/admin/Kit.jsx";
import { EmptyState } from "../../components/Fun.jsx";
import { ErrorState, ListSkeleton } from "../../components/States.jsx";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function InstructorForm({ item, onDone, onClose }) {
  const [f, setF] = useState({ name: item?.name || "", headline: item?.headline || "", bio: item?.bio || "", email: item?.email || "", is_active: item ? item.is_active : true });
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    const local = { name: check.required(f.name, "Name"), email: f.email && !EMAIL.test(f.email) ? "Enter a valid email address." : "" };
    if (Object.values(local).some(Boolean)) return setErrs(local);
    setBusy(true); setErrs({});
    const body = { ...f, name: f.name.trim() };
    try { item ? await manage.update("instructors", item.id, body) : await manage.create("instructors", body); onDone(); }
    catch (err) { setErrs(fieldErrors(err)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <FormError>{errs._form}</FormError>
      <FormField label="Name" error={errs.name}>{(p) => <input {...p} className="field" value={f.name} maxLength={150} onChange={set("name")} autoFocus />}</FormField>
      <FormField label="Headline" error={errs.headline} hint="For example: Senior Mathematics Teacher">{(p) => <input {...p} className="field" value={f.headline} maxLength={200} onChange={set("headline")} />}</FormField>
      <FormField label="Email" error={errs.email} hint="Optional. Not shown on the public site.">{(p) => <input {...p} type="email" className="field" value={f.email} onChange={set("email")} />}</FormField>
      <FormField label="Bio" error={errs.bio}>{(p) => <textarea {...p} rows={4} className="field" value={f.bio} onChange={set("bio")} />}</FormField>
      <div className="flex items-center gap-3"><Toggle label="Active" checked={f.is_active} onChange={(v) => setF({ ...f, is_active: v })} /><span className="text-sm">Active (shown on the site)</span></div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn btn-quiet btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? "Saving..." : item ? "Save changes" : "Add instructor"}</button>
      </div>
    </form>
  );
}

export default function Instructors() {
  useTitle("Instructors", { noindex: true });
  const list = useFetch(() => manage.all("instructors"));
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [delError, setDelError] = useState("");
  const [busy, setBusy] = useState(false);
  const close = () => setEditing(null);
  const done = () => { close(); list.reload(); };
  const confirmDelete = async () => {
    setBusy(true); setDelError("");
    try { await manage.remove("instructors", deleting.id); setDeleting(null); list.reload(); }
    catch (err) { setDelError(err.message); } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl font-semibold">Instructors</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing({})}><Plus size={16} aria-hidden="true" />Add instructor</button>
      </div>
      {list.loading && <ListSkeleton rows={4} />}
      {list.error && <ErrorState message={list.error} status={list.status} onRetry={list.reload} />}
      {list.data && (list.data.length === 0
        ? <EmptyState title="No instructors yet" action={<button className="btn btn-primary" onClick={() => setEditing({})}>Add instructor</button>}>Add the people who teach your courses.</EmptyState>
        : (
          <ul className="border-t border-slate-200">
            {list.data.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 py-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-3 font-display text-lg font-semibold">{t.name}<StatusTag on={t.is_active} yes="Active" no="Hidden" /></p>
                  <p className="text-sm text-slate-600">{t.headline || "No headline"} <span aria-hidden="true">·</span> <span className="num">{t.course_count}</span> {t.course_count === 1 ? "course" : "courses"}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-quiet btn-sm" onClick={() => setEditing(t)} aria-label={`Edit ${t.name}`}><PencilSimple size={16} aria-hidden="true" />Edit</button>
                  <button className="btn btn-quiet btn-sm" onClick={() => { setDelError(""); setDeleting(t); }} aria-label={`Delete ${t.name}`}><Trash size={16} aria-hidden="true" />Delete</button>
                </div>
              </li>
            ))}
          </ul>
        ))}
      <Dialog open={!!editing} onClose={close} title={editing?.id ? "Edit instructor" : "Add instructor"} wide>
        {editing && <InstructorForm key={editing.id || "new"} item={editing.id ? editing : null} onDone={done} onClose={close} />}
      </Dialog>
      <ConfirmDialog open={!!deleting} title="Delete this instructor?" busy={busy} error={delError} onConfirm={confirmDelete} onClose={() => setDeleting(null)}>
        <p><strong>{deleting?.name}</strong> will be removed. Their courses stay, but will show no instructor. To hide them instead, edit and turn off Active.</p>
      </ConfirmDialog>
    </div>
  );
}
