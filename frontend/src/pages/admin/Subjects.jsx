import { useState } from "react";
import { Plus, PencilSimple, Trash } from "@phosphor-icons/react";
import { useFetch, useTitle } from "../../lib/hooks.js";
import { check, fieldErrors, manage } from "../../lib/manage.js";
import { Dialog, ConfirmDialog, FormError, FormField } from "../../components/admin/Kit.jsx";
import { EmptyState } from "../../components/Fun.jsx";
import { ErrorState, ListSkeleton } from "../../components/States.jsx";

function SubjectForm({ subject, onDone, onClose }) {
  const [name, setName] = useState(subject?.name || "");
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const local = { name: check.required(name, "Name") };
    if (local.name) return setErrs(local);
    setBusy(true); setErrs({});
    try {
      subject ? await manage.update("subjects", subject.id, { name: name.trim() }) : await manage.create("subjects", { name: name.trim() });
      onDone();
    } catch (err) { setErrs(fieldErrors(err)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <FormError>{errs._form}</FormError>
      <FormField label="Name" error={errs.name}>{(p) => <input {...p} className="field" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} autoFocus />}</FormField>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn btn-quiet btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? "Saving..." : subject ? "Save changes" : "Add subject"}</button>
      </div>
    </form>
  );
}

export default function Subjects() {
  useTitle("Subjects", { noindex: true });
  const list = useFetch(() => manage.all("subjects"));
  const [editing, setEditing] = useState(null); // {} for new, subject for edit
  const [deleting, setDeleting] = useState(null);
  const [delError, setDelError] = useState("");
  const [busy, setBusy] = useState(false);
  const close = () => setEditing(null);
  const done = () => { close(); list.reload(); };
  const confirmDelete = async () => {
    setBusy(true); setDelError("");
    try { await manage.remove("subjects", deleting.id); setDeleting(null); list.reload(); }
    catch (err) { setDelError(err.message); } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl font-semibold">Subjects</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing({})}><Plus size={16} aria-hidden="true" />Add subject</button>
      </div>
      {list.loading && <ListSkeleton rows={4} />}
      {list.error && <ErrorState message={list.error} status={list.status} onRetry={list.reload} />}
      {list.data && (list.data.length === 0
        ? <EmptyState title="No subjects yet" action={<button className="btn btn-primary" onClick={() => setEditing({})}>Add subject</button>}>Courses are grouped by subject, so add one first.</EmptyState>
        : (
          <ul className="border-t border-slate-200">
            {list.data.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 border-b border-slate-200 py-4">
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold">{s.name}</p>
                  <p className="num text-sm text-slate-600">{s.course_count} {s.course_count === 1 ? "course" : "courses"}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-quiet btn-sm" onClick={() => setEditing(s)} aria-label={`Edit ${s.name}`}><PencilSimple size={16} aria-hidden="true" />Edit</button>
                  <button className="btn btn-quiet btn-sm" onClick={() => { setDelError(""); setDeleting(s); }} aria-label={`Delete ${s.name}`}><Trash size={16} aria-hidden="true" />Delete</button>
                </div>
              </li>
            ))}
          </ul>
        ))}
      <Dialog open={!!editing} onClose={close} title={editing?.id ? "Edit subject" : "Add subject"}>
        {editing && <SubjectForm key={editing.id || "new"} subject={editing.id ? editing : null} onDone={done} onClose={close} />}
      </Dialog>
      <ConfirmDialog open={!!deleting} title="Delete this subject?" busy={busy} error={delError} onConfirm={confirmDelete} onClose={() => setDeleting(null)}>
        <p><strong>{deleting?.name}</strong> will be removed. A subject that still has courses cannot be deleted.</p>
      </ConfirmDialog>
    </div>
  );
}
