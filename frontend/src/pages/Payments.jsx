import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useFetch, useTitle } from "../lib/hooks.js";
import { inr } from "../components/CourseCard.jsx";
import PageHeader, { Card } from "../components/PageHeader.jsx";
import { ErrorState, ListSkeleton } from "../components/States.jsx";

export default function Payments() {
  useTitle("Payment history");
  const { data: items, error, loading, reload } = useFetch(() => api("/my-courses/"));
  const total = (items || []).reduce((s, e) => s + Number(e.amount), 0);
  const th = "px-5 py-3 font-medium";
  return (
    <div>
      <PageHeader title="Payment history" subtitle="Every course you have paid for." />
      {loading && <ListSkeleton />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {items?.length === 0 && <p className="text-slate-600">No payments yet. <Link to="/courses" className="font-medium text-brand">Browse courses</Link></p>}
      {items?.length > 0 && (
        <Card className="overflow-x-auto !p-0">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">Your payments</caption>
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr><th scope="col" className={th}>Course</th><th scope="col" className={th}>Date</th><th scope="col" className={th}>Reference</th><th scope="col" className={`${th} text-right`}>Amount</th><th scope="col" className={`${th} text-right`}>Receipt</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((e) => (
                <tr key={e.id}>
                  <th scope="row" className="px-5 py-3 text-left font-medium">{e.course.title}</th>
                  <td className="px-5 py-3 text-slate-600">{e.paid_at ? new Date(e.paid_at).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—"}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{e.payment_ref || e.reference.slice(0, 8)}</td>
                  <td className="px-5 py-3 text-right font-semibold">{inr(e.amount)}</td>
                  <td className="px-5 py-3 text-right"><Link to={`/receipts/${e.reference}`} className="font-medium text-brand hover:underline">View<span className="sr-only"> receipt for {e.course.title}</span></Link></td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-slate-200"><tr><th scope="row" colSpan={3} className="px-5 py-3 text-left font-semibold">Total</th><td className="px-5 py-3 text-right font-bold">{inr(total)}</td><td /></tr></tfoot>
          </table>
        </Card>
      )}
    </div>
  );
}
