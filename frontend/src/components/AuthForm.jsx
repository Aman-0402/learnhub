export const inputCls = "field";

export function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <input className={inputCls} {...props} />
    </label>
  );
}

export function AuthCard({ title, error, children }) {
  return (
    <div className="mx-auto max-w-md card p-8">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">{title}</h1>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {children}
    </div>
  );
}

export const submitCls = "btn btn-primary w-full";
