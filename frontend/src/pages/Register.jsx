import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { AuthCard, Field, submitCls } from "../components/AuthForm.jsx";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const bind = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError("");
    try { await register(form); nav("/courses", { replace: true }); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <AuthCard title="Create your account" error={error}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" required {...bind("full_name")} />
        <Field label="Email" type="email" required {...bind("email")} />
        <Field label="Phone (optional)" type="tel" {...bind("phone")} />
        <Field label="Password (min 8 characters)" type="password" required minLength={8} {...bind("password")} />
        <button className={submitCls} disabled={busy}>{busy ? "Creating…" : "Sign up"}</button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">Already registered? <Link className="font-medium text-brand-600" to="/login">Log in</Link></p>
    </AuthCard>
  );
}
