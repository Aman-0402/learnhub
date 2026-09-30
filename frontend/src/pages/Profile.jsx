import { useState } from "react";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import PageHeader, { Card, Notice } from "../components/PageHeader.jsx";
import { Field, submitCls } from "../components/AuthForm.jsx";

function PasswordCard() {
  const [f, setF] = useState({ old_password: "", new_password: "" });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      const r = await api("/auth/change-password/", { method: "POST", body: f });
      setMsg({ kind: "ok", text: r.detail });
      setF({ old_password: "", new_password: "" });
    } catch (err) { setMsg({ kind: "error", text: err.message }); }
    finally { setBusy(false); }
  };
  return (
    <Card className="mt-6">
      <h2 className="mb-4 font-semibold">Change password</h2>
      <form onSubmit={submit} className="space-y-4">
        {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
        <Field label="Current password" type="password" required autoComplete="current-password" value={f.old_password} onChange={(e) => setF({ ...f, old_password: e.target.value })} />
        <Field label="New password (min 8 characters)" type="password" required minLength={8} autoComplete="new-password" value={f.new_password} onChange={(e) => setF({ ...f, new_password: e.target.value })} />
        <button className={submitCls} disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
      </form>
    </Card>
  );
}

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ full_name: user.full_name, phone: user.phone || "" });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      setUser(await api("/auth/me/", { method: "PATCH", body: form }));
      setMsg({ kind: "ok", text: "Profile updated." });
    } catch (err) { setMsg({ kind: "error", text: err.message }); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Profile" subtitle="Keep your details up to date." />
      <Card>
        <form onSubmit={save} className="space-y-4">
          {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
          <Field label="Email" value={user.email} disabled readOnly />
          <Field label="Full name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <Field label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <button className={submitCls} disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
        </form>
      </Card>
      <PasswordCard />
    </div>
  );
}
