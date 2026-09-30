import { useState } from "react";
import { api } from "../lib/api.js";
import PageHeader, { Card, Notice } from "../components/PageHeader.jsx";
import { inputCls } from "../components/AuthForm.jsx";
import { SITE } from "../lib/site.js";

export default function Contact() {
  const [f, setF] = useState({ name: "", email: "", message: "" });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const bind = (k) => ({ value: f[k], onChange: (e) => setF({ ...f, [k]: e.target.value }) });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      const r = await api("/contact/", { method: "POST", body: f, auth: false });
      setMsg({ kind: "ok", text: r.detail });
      setF({ name: "", email: "", message: "" });
    } catch (err) {
      setMsg({ kind: "error", text: err.status === 429 ? "You have sent several messages recently. Please try again later." : err.message });
    } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Contact us" subtitle="Questions about a course, fees or timings? Send us a message." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <form onSubmit={submit} className="space-y-4">
            {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="mb-1 block text-sm font-medium">Your name</span><input className={inputCls} required {...bind("name")} /></label>
              <label className="block"><span className="mb-1 block text-sm font-medium">Email</span><input type="email" className={inputCls} required {...bind("email")} /></label>
            </div>
            <label className="block"><span className="mb-1 block text-sm font-medium">Message</span><textarea rows={6} maxLength={5000} className={inputCls} required {...bind("message")} /></label>
            <button disabled={busy} className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">{busy ? "Sending…" : "Send message"}</button>
          </form>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Get in touch</h2>
          <dl className="space-y-4 text-sm">
            {[["Email", SITE.email], ["Phone", SITE.phone], ["Visit", SITE.address], ["Hours", SITE.hours]].map(([k, v]) => (
              <div key={k}><dt className="text-slate-500">{k}</dt><dd className="font-medium">{v}</dd></div>
            ))}
          </dl>
        </Card>
      </div>
    </div>
  );
}
