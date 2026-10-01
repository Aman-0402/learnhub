import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MagnifyingGlass, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useFetch, useTitle } from "../../lib/hooks.js";
import { manage } from "../../lib/manage.js";
import { inr } from "../../components/CourseCard.jsx";
import { ConfirmDialog, Toggle } from "../../components/admin/Kit.jsx";
import { EmptyState } from "../../components/Fun.jsx";
import { ErrorState, ListSkeleton } from "../../components/States.jsx";

export default function Courses() {
  useTitle("Courses", { noindex: true });
  const list = useFetch(() => manage.all("courses"));
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState("");
  const [show, setShow] = useState("");
  const [note, setNote] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [delError, setDelError] = useState("");
  const [busy, setBusy] = useState(false);

  const data = rows || list.data;
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data || []).filter((c) => (show === "" || String(c.is_published) === show) && (!needle || `${c.title} ${c.subject_name} ${c.instructor_name || ""}`.toLowerCase().includes(needle)));
  }, [data, q, show]);

  const publish = async (c, value) => {
    setNote("");
    setRows((data || []).map((x) => (x.id === c.id ? { ...x, is_published: value } : x)));
    try { await manage.update("courses", c.id, { is_published: value }); setNote(`${c.title} is now ${value ? "published" : "a draft"}.`); }
    catch (err) { setRows((data || []).map((x) => (x.id === c.id ? c : x))); setNote(err.message); }
  };
  const confirmDelete = async () => {
    setBusy(true); setDelError("");
    try { await manage.remove("courses", deleting.id); setRows((data || []).filter((x) => x.id !== deleting.id)); setNote(`${deleting.title} was deleted.`); setDeleting(null); }
    catch (err) { setDelError(err.message); } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl font-semibold">Courses</h1>
        <Link to="/manage/courses/new" className="btn btn-primary btn-sm"><Plus size={16} aria-hidden="true" />New course</Link>
      </div>
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative min-w-60 flex-1 sm:max-w-sm">
          <MagnifyingGlass size={20} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="search" aria-label="Search courses" className="field !pl-11" placeholder="Search title, subject, instructor" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select aria-label="Status" className="field !w-auto" value={show} onChange={(e) => setShow(e.target.value)}>
          <option value="">All statuses</option><option value="true">Published</option><option value="false">Drafts</option>
        </select>
      </div>
      <p role="status" className="mb-4 min-h-5 text-sm text-slate-600">{note}</p>
      {list.loading && <ListSkeleton rows={5} />}
      {list.error && <ErrorState message={list.error} status={list.status} onRetry={list.reload} />}
      {data && (filtered.length === 0
        ? <EmptyState title={data.length ? "No courses match" : "No courses yet"} action={!data.length && <Link to="/manage/courses/new" className="btn btn-primary">New course</Link>}>{data.length ? "Try a different search or status." : "Create the first course to see it here."}</EmptyState>
        : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <caption className="sr-only">Courses</caption>
              <thead className="border-b border-slate-300 text-slate-600">
                <tr><th scope="col" className="py-3 pr-4 font-medium">Course</th><th scope="col" className="py-3 pr-4 font-medium">Format</th><th scope="col" className="py-3 pr-4 text-right font-medium">Fee</th><th scope="col" className="py-3 pr-4 text-right font-medium">Paid / seats</th><th scope="col" className="py-3 pr-4 font-medium">Published</th><th scope="col" className="py-3 text-right font-medium">Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-slate-200">
                    <td className="py-4 pr-4"><Link to={`/manage/courses/${c.id}`} className="link-draw font-display text-base font-semibold">{c.title}</Link><p className="text-slate-600">{c.subject_name}{c.instructor_name && ` · ${c.instructor_name}`}</p></td>
                    <td className="py-4 pr-4 capitalize">{c.mode}</td>
                    <td className="num py-4 pr-4 text-right">{inr(c.fee)}</td>
                    <td className="num py-4 pr-4 text-right">{c.paid_count} / {c.seats ?? "no limit"}</td>
                    <td className="py-4 pr-4"><Toggle label={`Published: ${c.title}`} checked={c.is_published} onChange={(v) => publish(c, v)} /></td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/manage/courses/${c.id}`} className="btn btn-quiet btn-sm" aria-label={`Edit ${c.title}`}><PencilSimple size={16} aria-hidden="true" />Edit</Link>
                        <button className="btn btn-quiet btn-sm" aria-label={`Delete ${c.title}`} onClick={() => { setDelError(""); setDeleting(c); }}><Trash size={16} aria-hidden="true" />Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      <ConfirmDialog open={!!deleting} title="Delete this course?" busy={busy} error={delError} onConfirm={confirmDelete} onClose={() => setDeleting(null)}>
        <p><strong>{deleting?.title}</strong> and its batches and lessons will be removed. This cannot be undone.</p>
        <p>A course with enrollments cannot be deleted. Turn off Published to hide it instead.</p>
      </ConfirmDialog>
    </div>
  );
}
