import { motion, useReducedMotion } from "motion/react";
import { Heart, Check, BookOpen } from "@phosphor-icons/react";

export const EASE = [0.23, 1, 0.32, 1];

/** Fades and lifts content once as it enters the viewport. Used on marketing sections only. */
export function Reveal({ as = "div", delay = 0, className = "", children, ...rest }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;
  return (
    <Tag className={className} initial={reduce ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }} transition={{ duration: 0.55, ease: EASE, delay: delay / 1000 }} {...rest}>
      {children}
    </Tag>
  );
}

/** Progress track that fills with a transform, not a width change. */
export function ProgressBar({ value, label, className = "" }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={className}>
      <div role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="h-1.5 overflow-hidden rounded-full bg-slate-200">
        <motion.div className="h-full w-full origin-left rounded-full bg-brand-600" initial={{ scaleX: 0 }} animate={{ scaleX: pct / 100 }} transition={{ duration: 0.7, ease: EASE }} />
      </div>
    </div>
  );
}

export function HeartButton({ active, onClick, title, className = "" }) {
  return (
    <motion.button type="button" aria-pressed={active} aria-label={active ? `Remove ${title} from saved` : `Save ${title}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      whileTap={{ scale: 0.88 }} transition={{ type: "spring", stiffness: 500, damping: 22 }}
      className={`flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100 ${className}`}>
      <motion.span key={String(active)} initial={{ scale: active ? 0.7 : 1 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 420, damping: 16 }} className="flex">
        <Heart size={20} weight={active ? "fill" : "regular"} aria-hidden="true" className={active ? "text-brand" : ""} />
      </motion.span>
    </motion.button>
  );
}

/** A check that draws itself. The success moment after enrolling. */
export function DrawnCheck({ size = 56 }) {
  return (
    <span aria-hidden="true" className="inline-flex items-center justify-center rounded-full bg-brand-100 text-brand" style={{ width: size, height: size }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, ease: EASE, delay: 0.15 }} />
      </svg>
    </span>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="mx-auto max-w-md rounded-[var(--radius-card)] border border-dashed border-slate-300 px-8 py-12 text-center">
      <BookOpen size={32} aria-hidden="true" className="mx-auto mb-4 text-slate-500" />
      <p className="font-display text-xl font-semibold">{title}</p>
      <div className="mt-2 text-sm text-slate-600">{children}</div>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export { Check };
