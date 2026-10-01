export const inputCls = "w-full rounded-xl border-2 border-slate-200 bg-surface px-3.5 py-2.5 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600";

export function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input className={inputCls} {...props} />
    </label>
  );
}

export function AuthCard({ title, error, children }) {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-surface p-8 shadow-sm">
      <h1 className="mb-6 text-3xl font-semibold">{title}</h1>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {children}
    </div>
  );
}

export const submitCls = "w-full rounded-xl bg-brand-600 px-4 py-3 font-bold text-white shadow-md shadow-brand-600/25 transition hover:-translate-y-0.5 hover:bg-brand-700 active:translate-y-0 disabled:opacity-60";
