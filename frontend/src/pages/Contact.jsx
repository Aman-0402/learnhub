import { useState } from "react";
import { api } from "../lib/api.js";
import { useTitle } from "../lib/hooks.js";
import PageHeader, { Notice } from "../components/PageHeader.jsx";
import { SITE } from "../lib/site.js";

export default function Contact() {
  useTitle("Contact", { description: "Questions about a course, batch or payment? Send LearnHub a message or find our contact details and opening hours." });
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
      <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <form onSubmit={submit} className="space-y-4">
            {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="mb-1.5 block text-sm font-medium">Your name</span><input className="field" required {...bind("name")} /></label>
              <label className="block"><span className="mb-1.5 block text-sm font-medium">Email</span><input type="email" className="field" required {...bind("email")} /></label>
            </div>
            <label className="block"><span className="mb-1.5 block text-sm font-medium">Message</span><textarea rows={6} maxLength={5000} className="field" required {...bind("message")} /></label>
            <button disabled={busy} className="btn btn-primary">{busy ? "Sending..." : "Send message"}</button>
          </form>
        </div>
        <div>
          <h2 className="mb-5 text-2xl font-semibold">Get in touch</h2>
          <dl className="space-y-5 border-t border-slate-200 pt-5">
            {[["Email", SITE.email], ["Phone", SITE.phone], ["Visit", SITE.address], ["Hours", SITE.hours]].map(([k, v]) => (
              <div key={k}><dt className="text-sm text-slate-600">{k}</dt><dd className="font-medium">{v}</dd></div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
