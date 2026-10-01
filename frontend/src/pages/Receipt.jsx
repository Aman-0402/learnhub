import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { useFetch, useTitle } from "../lib/hooks.js";
import { inr } from "../components/CourseCard.jsx";
import { SITE } from "../lib/site.js";
import { DetailSkeleton, ErrorState } from "../components/States.jsx";

export default function Receipt() {
  const { reference } = useParams();
  const { user } = useAuth();
  const { data, error, status, loading, reload } = useFetch(() => api("/my-courses/").then((l) => l.find((e) => e.reference === reference) || Promise.reject(Object.assign(new Error("We could not find that receipt."), { status: 404 }))), [reference]);
  useTitle("Receipt", { noindex: true });
  if (loading) return <DetailSkeleton />;
  if (error) return <ErrorState message={error} status={status} onRetry={reload} />;

  const rows = [
    ["Receipt number", reference.slice(0, 8).toUpperCase()],
    ["Date", data.paid_at ? new Date(data.paid_at).toLocaleDateString("en-IN", { dateStyle: "long" }) : "—"],
    ["Payment reference", data.payment_ref || "—"],
    ["Status", "Paid"],
  ];
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link to="/payments" className="text-sm text-slate-500 hover:text-slate-800">← Payment history</Link>
        <button onClick={() => window.print()} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Print or save as PDF</button>
      </div>
      <article aria-label="Payment receipt" className="rounded-xl border border-slate-200 bg-surface p-8 shadow-sm print:border-0 print:p-0 print:shadow-none">
        <header className="flex items-start justify-between border-b border-slate-200 pb-6">
          <div><p className="text-2xl font-bold text-brand">{SITE.name}</p><p className="mt-1 text-sm text-slate-500">{SITE.address}</p><p className="text-sm text-slate-500">{SITE.email} · {SITE.phone}</p></div>
          <h1 className="text-xl font-bold uppercase tracking-wide">Payment receipt</h1>
        </header>
        <div className="grid gap-6 border-b border-slate-200 py-6 sm:grid-cols-2">
          <div><h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Received from</h2><p className="mt-1 font-medium">{user.full_name}</p><p className="text-sm text-slate-600">{user.email}</p></div>
          <dl className="space-y-1 text-sm">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-slate-500">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl>
        </div>
        <table className="mt-6 w-full text-sm">
          <thead><tr className="text-left text-slate-500"><th scope="col" className="pb-2 font-medium">Description</th><th scope="col" className="pb-2 text-right font-medium">Amount</th></tr></thead>
          <tbody>
            <tr className="border-t border-slate-100"><td className="py-3"><span className="font-medium">{data.course.title}</span><br /><span className="text-slate-500">{data.course.mode_display} · {data.course.duration_weeks} weeks</span></td><td className="py-3 text-right">{inr(data.amount)}</td></tr>
          </tbody>
          <tfoot><tr className="border-t border-slate-200"><th scope="row" className="pt-3 text-left text-base">Total paid</th><td className="pt-3 text-right text-base font-bold">{inr(data.amount)}</td></tr></tfoot>
        </table>
        <p className="mt-8 text-xs text-slate-500">This receipt confirms payment of the course fee. It is not a tax invoice.</p>
      </article>
    </div>
  );
}
