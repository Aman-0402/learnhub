export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-lg text-slate-600">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Notice({ kind = "error", children }) {
  const cls = kind === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800";
  return <p role={kind === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm ${cls}`}>{children}</p>;
}

export const Card = ({ className = "", ...p }) => (
  <div className={`card p-6 ${className}`} {...p} />
);
