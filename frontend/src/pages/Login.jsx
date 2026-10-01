import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { useTitle } from "../lib/hooks.js";
import { AuthCard, Field, submitCls } from "../components/AuthForm.jsx";

export default function Login() {
  useTitle("Log in", { noindex: true });
  const { login } = useAuth();
  const nav = useNavigate();
  const from = useLocation().state?.from || "/dashboard";
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError("");
    try { await login(form.email, form.password); nav(from, { replace: true }); }
    catch (err) { setError(err.status === 401 ? "Incorrect email or password." : err.message); }
    finally { setBusy(false); }
  };

  return (
    <AuthCard title="Log in" error={error}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Field label="Password" type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <p className="text-right text-sm"><Link className="font-medium text-brand" to="/forgot-password">Forgot password?</Link></p>
        <button className={submitCls} disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">New here? <Link className="font-medium text-brand" to="/register">Create an account</Link></p>
    </AuthCard>
  );
}
