import { useMemo, useState } from "react";
import { useFetch, useTitle } from "../../lib/hooks.js";
import { manage } from "../../lib/manage.js";
import { FormError } from "../../components/admin/Kit.jsx";
import { Card } from "../../components/PageHeader.jsx";
import { EmptyState } from "../../components/Fun.jsx";
import { ErrorState, ListSkeleton } from "../../components/States.jsx";
import { inr } from "../../components/CourseCard.jsx";

const STATUSES = [["", "All statuses"], ["pending", "Pending"], ["paid", "Paid"], ["failed", "Failed"]];

const dateStr = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—");

function StatusPill({ status }) {
  const cls = status === "paid" ? "bg-brand-100 text-brand-strong" : status === "failed" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700";
  return <span className={`tag ${cls}`}>{status[0].toUpperCase() + status.slice(1)}</span>;
}

function SummaryCards({ summary }) {
  if (!summary) return null;
  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-3">
      <Card><p className="text-sm text-slate-600">Total paid</p><p className="num mt-1 text-2xl font-semibold">{inr(summary.total_paid)}</p><p className="mt-1 text-xs text-slate-600">{summary.total_paid_count} payments</p></Card>
      <Card><p className="text-sm text-slate-600">Paid this month</p><p className="num mt-1 text-2xl font-semibold">{inr(summary.this_month)}</p><p className="mt-1 text-xs text-slate-600">{summary.this_month_count} payments</p></Card>
      <Card><p className="text-sm text-slate-600">Pending</p><p className="num mt-1 text-2xl font-semibold">{summary.pending_count}</p><p className="mt-1 text-xs text-slate-600">awaiting payment</p></Card>
    </div>
  );
}

function Row({ e, onChanged }) {
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const act = async (action) => {
    setBusy(action); setErr("");
    try { await manage.action("enrollments", e.id, action); onChanged(); }
    catch (err) { setErr(err.message); } finally { setBusy(""); }
  };
  return (
    <tr>
      <th scope="row" className="px-5 py-3 text-left">
        <p className="font-medium">{e.student_name}</p>
        <p className="text-xs text-slate-600">{e.student_email}</p>
      </th>
      <td className="px-5 py-3">
        <p>{e.course_title}</p>
        {e.batch_label && <p className="text-xs text-slate-600">{e.batch_label}</p>}
      </td>
      <td className="px-5 py-3"><StatusPill status={e.status} /></td>
      <td className="px-5 py-3 num text-right font-semibold">{inr(e.amount)}</td>
      <td className="px-5 py-3 text-slate-600">{dateStr(e.created_at)}</td>
      <td className="px-5 py-3">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {e.status !== "paid" && <button className="btn btn-quiet btn-sm" disabled={!!busy} onClick={() => act("mark-paid")}>{busy === "mark-paid" ? "Working..." : "Mark paid"}</button>}
          {e.status === "pending" && <button className="btn btn-quiet btn-sm" disabled={!!busy} onClick={() => act("mark-failed")}>{busy === "mark-failed" ? "Working..." : "Mark failed"}</button>}
        </div>
        {err && <div className="mt-2 max-w-xs"><FormError>{err}</FormError></div>}
      </td>
    </tr>
  );
}

export default function Enrollments() {
  useTitle("Enrollments", { noindex: true });
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const params = useMemo(() => ({ status, q }), [status, q]);
  const list = useFetch(() => manage.all("enrollments", params), [status, q]);
  const summary = useFetch(() => manage.summary("enrollments"));
  const reload = () => { list.reload(); summary.reload(); };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl font-semibold">Enrollments</h1>
      </div>
      <SummaryCards summary={summary.data} />
      <div className="mb-6 flex flex-wrap gap-3">
        <select className="field w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          {STATUSES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </select>
        <input className="field w-auto flex-1" type="search" placeholder="Search by student, course or reference" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search enrollments" />
      </div>
      {list.loading && <ListSkeleton />}
      {list.error && <ErrorState message={list.error} status={list.status} onRetry={list.reload} />}
      {list.data && (list.data.length === 0
        ? <EmptyState title="No enrollments match">Try a different filter or search.</EmptyState>
        : (
          <Card className="overflow-x-auto !p-0">
            <table className="w-full min-w-[50rem] text-left text-sm">
              <caption className="sr-only">Enrollments</caption>
              <thead className="border-b border-slate-200 text-slate-600">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Student</th>
                  <th scope="col" className="px-5 py-3 font-medium">Course</th>
                  <th scope="col" className="px-5 py-3 font-medium">Status</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Amount</th>
                  <th scope="col" className="px-5 py-3 font-medium">Enrolled</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {list.data.map((e) => <Row key={e.id} e={e} onChanged={reload} />)}
              </tbody>
            </table>
          </Card>
        ))}
    </div>
  );
}
