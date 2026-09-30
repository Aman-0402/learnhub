import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { useFetch, useTitle } from "../lib/hooks.js";
import { getBatches, chosenBatch, isSample } from "../lib/services.js";
import { payWithRazorpay } from "../lib/razorpay.js";
import { inr } from "../components/CourseCard.jsx";
import { dayList, timeRange } from "../components/Batches.jsx";
import { Notice } from "../components/PageHeader.jsx";
import { DetailSkeleton, ErrorState } from "../components/States.jsx";

export default function Checkout() {
  useTitle("Checkout");
  const { slug } = useParams();
  const batchId = useSearchParams()[0].get("batch");
  const nav = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [gateway, setGateway] = useState(null);
  const [batches, setBatches] = useState(null);

  const { data: course, error: loadError, status, loading, reload } = useFetch(() => api(`/courses/${slug}/`, { auth: false }), [slug]);
  useEffect(() => { api("/payments/config/", { auth: false }).then((c) => setGateway(c.gateway)).catch(() => setGateway("mock")); }, []);
  useEffect(() => { if (course) getBatches(course).then(setBatches).catch(() => setBatches([])); }, [course]);

  if (loading) return <DetailSkeleton />;
  if (loadError) return <ErrorState message={loadError} status={status} onRetry={reload} />;

  const batch = batches?.find((b) => b.id === batchId) || null;
  const missingBatch = batches?.length > 0 && !batch;

  // The backend decides the gateway. "mock" confirms instantly (test mode); "razorpay" opens the Razorpay window.
  const pay = async () => {
    setBusy(true); setError("");
    try {
      const { enrollment, order } = await api("/enroll/", { method: "POST", body: { course: course.id, ...(batch && { batch: batch.id }) } });
      const proof = order.gateway === "razorpay" ? await payWithRazorpay({ order, title: course.title, user }) : { order_id: order.order_id };
      await api(`/enrollments/${enrollment.reference}/pay/`, { method: "POST", body: proof });
      if (batch) chosenBatch.set(slug, batch);
      nav("/dashboard", { replace: true, state: { justEnrolled: course.title } });
    } catch (e) { setError(e.message); setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-surface p-8 shadow-sm">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>
      <div className="flex justify-between gap-4 border-b border-slate-200 pb-4">
        <div><p className="font-semibold">{course.title}</p><p className="text-sm text-slate-500">{course.mode_display} · {course.duration_weeks} weeks</p></div>
        <p className="font-bold">{inr(course.fee)}</p>
      </div>
      {batch && (
        <div className="border-b border-slate-200 py-4 text-sm">
          <p className="font-medium">{batch.label}</p>
          <p className="text-slate-600">{dayList(batch)} · {timeRange(batch)}</p>
          <Link to={`/courses/${slug}`} className="text-brand hover:underline">Change batch</Link>
          {isSample("batchesApi") && <p className="mt-2 text-xs text-slate-500">Sample batch: it is remembered in this browser only until batches are saved on the server.</p>}
        </div>
      )}
      <div className="flex justify-between py-4 text-lg font-bold"><span>Total</span><span>{inr(course.fee)}</span></div>
      {gateway === "mock" && <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Test mode: no real payment is taken yet.</p>}
      {missingBatch && <div className="mb-4"><Notice>Please choose a batch on the course page before paying.</Notice></div>}
      {error && <div className="mb-4"><Notice>{error}</Notice></div>}
      <button onClick={pay} disabled={busy || missingBatch} className="w-full rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">
        {busy ? "Processing…" : `Pay ${inr(course.fee)}`}
      </button>
      <Link to={`/courses/${course.slug}`} className="mt-3 block text-center text-sm text-slate-500 hover:text-slate-800">Back to course</Link>
    </div>
  );
}
