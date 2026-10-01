import { useEffect, useId, useRef } from "react";
import { Warning } from "@phosphor-icons/react";

/** Label above the control, hint and error below. `children` receives props to spread on the control. */
export function FormField({ label, error, hint, children, className = "" }) {
  const id = useId();
  const props = { id, "aria-invalid": error ? "true" : undefined, "aria-describedby": error ? `${id}-e` : hint ? `${id}-h` : undefined };
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      {children(props)}
      {error ? <p id={`${id}-e`} className="mt-1.5 text-sm text-red-700">{error}</p> : hint ? <p id={`${id}-h`} className="mt-1.5 text-xs text-slate-600">{hint}</p> : null}
    </div>
  );
}

/** Switch that reads as a labelled on/off control. */
export function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-150 disabled:opacity-50 ${checked ? "border-transparent bg-[var(--color-accent-fill)]" : "border-slate-300 bg-slate-100"}`}>
      <span aria-hidden="true" className={`block h-5 w-5 rounded-full bg-[var(--color-surface)] border border-slate-300 transition-transform duration-150 [transition-timing-function:var(--ease-out-strong)] ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

export function FormError({ children }) {
  if (!children) return null;
  return <p role="alert" className="flex items-start gap-2 rounded-xl border border-slate-300 bg-red-50 px-4 py-3 text-sm text-red-700"><Warning size={18} aria-hidden="true" className="mt-0.5 shrink-0" />{children}</p>;
}

/** Native modal dialog: focus trap, Escape and inert background come from the browser. */
export function Dialog({ open, onClose, title, children, wide }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} aria-labelledby={titleId} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className={`m-auto w-[calc(100%-2rem)] ${wide ? "max-w-2xl" : "max-w-md"} rounded-[var(--radius-card)] border border-slate-200 bg-[var(--color-surface)] p-0 text-slate-900 backdrop:bg-black/50`}>
      {open && (
        <div className="max-h-[85dvh] overflow-y-auto p-6">
          <h2 id={titleId} className="mb-5 text-2xl font-semibold">{title}</h2>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function ConfirmDialog({ open, title, children, confirmLabel = "Delete", busy, error, onConfirm, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="space-y-4 text-sm text-slate-700">{children}</div>
      <div className="mt-4"><FormError>{error}</FormError></div>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className="btn btn-quiet btn-sm" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-ink btn-sm" disabled={busy} onClick={onConfirm}>{busy ? "Working..." : confirmLabel}</button>
      </div>
    </Dialog>
  );
}

export function StatusTag({ on, yes = "Published", no = "Draft" }) {
  return <span className="tag">{on ? yes : no}</span>;
}
