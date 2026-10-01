import { useMemo, useState } from "react";
import { useFetch, useTitle } from "../../lib/hooks.js";
import { manage } from "../../lib/manage.js";
import { FormError, StatusTag } from "../../components/admin/Kit.jsx";
import { Card } from "../../components/PageHeader.jsx";
import { EmptyState } from "../../components/Fun.jsx";
import { ErrorState, ListSkeleton } from "../../components/States.jsx";

const FILTERS = [["", "All"], ["false", "Unhandled"], ["true", "Handled"]];

const dateStr = (d) => new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium", timeStyle: "short" });

function Row({ m, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const toggle = async () => {
    setBusy(true); setErr("");
    try { await manage.action("contact-messages", m.id, m.is_handled ? "mark-unhandled" : "mark-handled"); onChanged(); }
    catch (err) { setErr(err.message); } finally { setBusy(false); }
  };
  return (
    <li className="border-b border-slate-200 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold">{m.name}</p>
          <p className="text-sm text-slate-600">{m.email} &middot; {dateStr(m.created_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusTag on={m.is_handled} yes="Handled" no="Unhandled" />
          <button className="btn btn-quiet btn-sm" disabled={busy} onClick={toggle}>
            {busy ? "Working..." : m.is_handled ? "Mark unhandled" : "Mark handled"}
          </button>
        </div>
      </div>
      <p className="mt-3 max-w-2xl whitespace-pre-wrap text-slate-700">{m.message}</p>
      {err && <div className="mt-2 max-w-md"><FormError>{err}</FormError></div>}
    </li>
  );
}

export default function ContactMessages() {
  useTitle("Contact messages", { noindex: true });
  const [handled, setHandled] = useState("");
  const [q, setQ] = useState("");
  const params = useMemo(() => ({ handled, q }), [handled, q]);
  const list = useFetch(() => manage.all("contact-messages", params), [handled, q]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl font-semibold">Contact messages</h1>
      </div>
      <div className="mb-6 flex flex-wrap gap-3">
        <select className="field w-auto" value={handled} onChange={(e) => setHandled(e.target.value)} aria-label="Filter by status">
          {FILTERS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </select>
        <input className="field w-auto flex-1" type="search" placeholder="Search by name, email or message" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search messages" />
      </div>
      {list.loading && <ListSkeleton />}
      {list.error && <ErrorState message={list.error} status={list.status} onRetry={list.reload} />}
      {list.data && (list.data.length === 0
        ? <EmptyState title="No messages match">Try a different filter or search.</EmptyState>
        : <Card><ul className="-mt-5 border-t border-slate-200">{list.data.map((m) => <Row key={m.id} m={m} onChanged={list.reload} />)}</ul></Card>)}
    </div>
  );
}
