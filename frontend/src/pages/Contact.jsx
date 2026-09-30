import { useState } from "react";
import PageHeader, { Card } from "../components/PageHeader.jsx";
import { inputCls } from "../components/AuthForm.jsx";
import { SITE } from "../lib/site.js";

export default function Contact() {
  const [f, setF] = useState({ name: "", email: "", message: "" });
  const bind = (k) => ({ value: f[k], onChange: (e) => setF({ ...f, [k]: e.target.value }) });

  // No backend endpoint yet: the form opens the visitor's email app with the message filled in.
  const submit = (e) => {
    e.preventDefault();
    const body = `${f.message}\n\nFrom: ${f.name} (${f.email})`;
    window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent("Enquiry from " + f.name)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div>
      <PageHeader title="Contact us" subtitle="Questions about a course, fees or timings? Send us a message." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="mb-1 block text-sm font-medium">Your name</span><input className={inputCls} required {...bind("name")} /></label>
              <label className="block"><span className="mb-1 block text-sm font-medium">Email</span><input type="email" className={inputCls} required {...bind("email")} /></label>
            </div>
            <label className="block"><span className="mb-1 block text-sm font-medium">Message</span><textarea rows={6} className={inputCls} required {...bind("message")} /></label>
            <button className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700">Send message</button>
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
