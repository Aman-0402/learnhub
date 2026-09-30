import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { inr } from "../components/CourseCard.jsx";
import PageHeader, { Card, Notice } from "../components/PageHeader.jsx";

export default function Payments() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api("/my-courses/").then(setItems).catch((e) => setError(e.message)); }, []);
  const total = (items || []).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div>
      <PageHeader title="Payment history" subtitle="Every course you have paid for." />
      {error && <Notice>{error}</Notice>}
      {!items && !error && <p className="text-slate-500">Loading…</p>}
      {items?.length === 0 && <p className="text-slate-600">No payments yet. <Link to="/courses" className="font-medium text-brand-600">Browse courses</Link></p>}
      {items?.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr><th className="px-5 py-3 font-medium">Course</th><th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3 font-medium">Reference</th><th className="px-5 py-3 text-right font-medium">Amount</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((e) => (
                <tr key={e.id}>
                  <td className="px-5 py-3 font-medium">{e.course.title}</td>
                  <td className="px-5 py-3 text-slate-600">{e.paid_at ? new Date(e.paid_at).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—"}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{e.payment_ref || e.reference.slice(0, 8)}</td>
                  <td className="px-5 py-3 text-right font-semibold">{inr(e.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-slate-200"><tr><td colSpan={3} className="px-5 py-3 font-semibold">Total</td><td className="px-5 py-3 text-right font-bold">{inr(total)}</td></tr></tfoot>
          </table>
        </Card>
      )}
    </div>
  );
}
