import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { inr } from "../components/CourseCard.jsx";

export default function Checkout() {
  const { slug } = useParams();
  const nav = useNavigate();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { api(`/courses/${slug}/`, { auth: false }).then(setCourse).catch((e) => setError(e.message)); }, [slug]);

  // NOTE: payment is mocked on the backend until a real gateway (e.g. Razorpay) is added.
  const pay = async () => {
    setBusy(true); setError("");
    try {
      const { enrollment, order } = await api("/enroll/", { method: "POST", body: { course: course.id } });
      await api(`/enrollments/${enrollment.reference}/pay/`, { method: "POST", body: { order_id: order.order_id } });
      nav("/dashboard", { replace: true, state: { justEnrolled: course.title } });
    } catch (e) { setError(e.message); setBusy(false); }
  };

  if (!course) return error ? <p className="text-red-600">{error}</p> : <p className="text-slate-500">Loading…</p>;
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>
      <div className="flex justify-between border-b border-slate-200 pb-4">
        <div><p className="font-semibold">{course.title}</p><p className="text-sm text-slate-500">{course.mode_display} · {course.duration_weeks} weeks</p></div>
        <p className="font-bold">{inr(course.fee)}</p>
      </div>
      <div className="flex justify-between py-4 text-lg font-bold"><span>Total</span><span>{inr(course.fee)}</span></div>
      <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Test mode: no real payment is taken yet.</p>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button onClick={pay} disabled={busy} className="w-full rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
        {busy ? "Processing…" : `Pay ${inr(course.fee)}`}
      </button>
      <Link to={`/courses/${course.slug}`} className="mt-3 block text-center text-sm text-slate-500 hover:text-slate-800">Back to course</Link>
    </div>
  );
}
