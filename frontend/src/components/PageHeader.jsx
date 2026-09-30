export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-slate-600">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Notice({ kind = "error", children }) {
  const cls = kind === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800";
  return <p role={kind === "error" ? "alert" : "status"} className={`rounded-lg px-4 py-2.5 text-sm ${cls}`}>{children}</p>;
}

export const Card = ({ className = "", ...p }) => (
  <div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${className}`} {...p} />
);
