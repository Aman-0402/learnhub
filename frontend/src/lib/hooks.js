import { useEffect, useState, useCallback } from "react";

/** Load data with loading / error / retry handling. `fn` re-runs whenever `deps` change. */
export function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: "", status: 0, loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: "" }));
    Promise.resolve()
      .then(fn)
      .then((data) => alive && setState({ data, error: "", status: 200, loading: false }))
      .catch((e) => alive && setState({ data: null, error: e.message || "Something went wrong.", status: e.status || 0, loading: false }));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

/** Sets the browser tab title and announces page changes to screen readers. */
export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | LearnHub` : "LearnHub: Online and Offline Courses";
  }, [title]);
}

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Fades content in as it scrolls into view. Always visible when motion is reduced or IntersectionObserver is missing. */
export function useReveal() {
  const [el, setEl] = useState(null);
  const [state, setState] = useState("idle"); // idle -> hidden -> shown
  useEffect(() => {
    if (!el) return;
    if (reducedMotion() || typeof IntersectionObserver === "undefined") return;
    setState("hidden");
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setState("shown"); io.disconnect(); } }, { rootMargin: "0px 0px -6% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [el]);
  const cls = state === "idle" ? "" : state === "hidden" ? "reveal" : "reveal reveal-in";
  return [setEl, cls];
}

/** Counts up to `target` once visible. Returns the number to display. */
export function useCountUp(target, ms = 900) {
  const [el, setEl] = useState(null);
  const [n, setN] = useState(reducedMotion() ? target : 0);
  useEffect(() => {
    if (!el) return;
    if (reducedMotion() || typeof IntersectionObserver === "undefined") { setN(target); return; }
    let raf;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t) => { const p = Math.min((t - t0) / ms, 1); setN(Math.round(target * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [el, target, ms]);
  return [setEl, n];
}
