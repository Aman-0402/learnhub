import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTitle } from "../lib/hooks.js";
import { confirmPasswordReset, isSample } from "../lib/services.js";
import { AuthCard, Field, submitCls } from "../components/AuthForm.jsx";
import { SampleNote } from "../components/Batches.jsx";
import { Notice } from "../components/PageHeader.jsx";

export default function ResetPassword() {
  useTitle("Reset password");
  const [params] = useSearchParams();
  const uid = params.get("uid"), token = params.get("token");
  const [f, setF] = useState({ password: "", confirm: "" });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!uid || !token) {
    return (
      <AuthCard title="This link is not valid">
        <p className="text-sm text-slate-600">The reset link is missing or incomplete. Request a new one and try again.</p>
        <Link to="/forgot-password" className={`${submitCls} mt-5 block text-center`}>Request a new link</Link>
      </AuthCard>
    );
  }

  const submit = async (e) => {
    e.preventDefault(); setError("");
    if (f.password !== f.confirm) return setError("The two passwords do not match.");
    setBusy(true);
    try { await confirmPasswordReset({ uid, token, new_password: f.password }); setDone(true); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  if (done) {
    return (
      <AuthCard title="Password updated">
        <Notice kind="ok">Your password has been reset. You can now log in.</Notice>
        <Link to="/login" className={`${submitCls} mt-5 block text-center`}>Log in</Link>
      </AuthCard>
    );
  }
  return (
    <AuthCard title="Choose a new password" error={error}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="New password (min 8 characters)" type="password" required minLength={8} autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <Field label="Confirm new password" type="password" required minLength={8} autoComplete="new-password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} />
        <button className={submitCls} disabled={busy}>{busy ? "Saving…" : "Reset password"}</button>
        {isSample("passwordResetApi") && <SampleNote>Sample mode: nothing is changed on the server yet.</SampleNote>}
      </form>
    </AuthCard>
  );
}
