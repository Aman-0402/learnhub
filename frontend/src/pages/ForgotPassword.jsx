import { useState } from "react";
import { Link } from "react-router-dom";
import { useTitle } from "../lib/hooks.js";
import { isSample, requestPasswordReset } from "../lib/services.js";
import { AuthCard, Field, submitCls } from "../components/AuthForm.jsx";
import { SampleNote } from "../components/Batches.jsx";
import { Notice } from "../components/PageHeader.jsx";

export default function ForgotPassword() {
  useTitle("Forgot password", { noindex: true });
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError("");
    try { setDone(await requestPasswordReset(email)); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <AuthCard title="Forgot your password?" error={error}>
      {done ? (
        <div className="space-y-4">
          <Notice kind="ok">{done.detail}</Notice>
          <p className="text-sm text-slate-600">Check your inbox and spam folder. The link works for a limited time.</p>
          {isSample("passwordResetApi") && (
            <SampleNote>Sample mode: no email is sent yet. <Link to="/reset-password?uid=sample&token=sample" className="font-semibold underline">Open the reset page</Link> to see the next step.</SampleNote>
          )}
          <Link to="/login" className="link-draw block text-center text-sm font-semibold text-brand-strong">Back to log in</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-slate-600">Enter your account email and we will send you a link to choose a new password.</p>
          <Field label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className={submitCls} disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
          <Link to="/login" className="link-draw block text-center text-sm font-semibold text-brand-strong">Back to log in</Link>
        </form>
      )}
    </AuthCard>
  );
}
