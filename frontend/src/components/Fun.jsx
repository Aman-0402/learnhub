import { useEffect, useState } from "react";
import { useCountUp, useReveal } from "../lib/hooks.js";

export function Reveal({ as: Tag = "div", delay = 0, className = "", children, ...rest }) {
  const [ref, cls] = useReveal();
  return <Tag ref={ref} style={{ "--reveal-delay": `${delay}ms` }} className={`${cls} ${className}`} {...rest}>{children}</Tag>;
}

export function CountUp({ value, suffix = "" }) {
  const [ref, n] = useCountUp(value);
  return <span ref={ref}><span aria-hidden="true">{n}{suffix}</span><span className="sr-only">{value}{suffix}</span></span>;
}

export function ProgressBar({ value, label, className = "" }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={className}>
      <div role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-coral transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function HeartButton({ active, onClick, title, className = "" }) {
  const [pop, setPop] = useState(false);
  return (
    <button type="button" aria-pressed={active} aria-label={active ? `Remove ${title} from saved` : `Save ${title}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPop(true); onClick(); }} onAnimationEnd={() => setPop(false)}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-sm transition hover:scale-110 dark:bg-slate-900/90 ${className}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className={pop ? "animate-pop" : ""}
        fill={active ? "#ff5d73" : "none"} stroke={active ? "#ff5d73" : "currentColor"} strokeWidth="2" strokeLinejoin="round">
        <path d="M12 20.5C6 16.3 3 13 3 9.2 3 6.7 5 5 7.2 5c1.9 0 3.5 1 4.8 2.9C13.300 6 14.900 5 16.800 5 19 5 21 6.700 21 9.200c0 3.800-3 7.100-9 11.300z" />
      </svg>
    </button>
  );
}

const COLORS = ["#6c3ce9", "#ff5d73", "#ffb703", "#19c79a", "#35b8f0"];

/** A short burst of confetti. Renders nothing when the visitor prefers reduced motion. */
export function Confetti({ pieces = 44 }) {
  const [show, setShow] = useState(() => !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => { const t = setTimeout(() => setShow(false), 3200); return () => clearTimeout(t); }, []);
  if (!show) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {Array.from({ length: pieces }, (_, i) => (
        <span key={i} className="absolute top-0 block animate-confetti rounded-sm"
          style={{ left: `${(i * 97) % 100}%`, width: 8 + (i % 4) * 3, height: 12 + (i % 3) * 4, background: COLORS[i % COLORS.length],
            animationDelay: `${(i % 11) * 90}ms`, "--dx": `${((i * 53) % 160) - 80}px`, "--rot": `${360 + ((i * 37) % 540)}deg` }} />
      ))}
    </div>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="mx-auto max-w-md rounded-3xl border-2 border-dashed border-slate-300 bg-surface px-8 py-12 text-center">
      <svg aria-hidden="true" width="64" height="64" viewBox="0 0 64 64" className="mx-auto mb-4 animate-float-slow">
        <circle cx="32" cy="32" r="28" fill="#e7dfff" /><circle cx="24" cy="28" r="4" fill="#6c3ce9" /><circle cx="40" cy="28" r="4" fill="#6c3ce9" />
        <path d="M22 42 Q32 34 42 42" stroke="#6c3ce9" strokeWidth="4" fill="none" strokeLinecap="round" />
      </svg>
      <p className="font-display text-xl font-semibold">{title}</p>
      <div className="mt-2 text-sm text-slate-600">{children}</div>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
