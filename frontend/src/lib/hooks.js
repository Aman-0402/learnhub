import { SITE } from "./site.js";
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
const DEFAULT_TITLE = "LearnHub: Online and Offline Courses";
const DEFAULT_DESC = "Join live online and offline classes in programming, English, maths, science and more. Pick a batch, pay the fee and start learning with LearnHub.";

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute("content", content);
}

/**
 * Sets the page title and every search and sharing tag for the current page.
 * opts: description, image (absolute or site-relative URL), noindex (private pages), jsonLd (schema.org object), type ("website" | "article").
 */
export function useTitle(title, opts = {}) {
  const { description = DEFAULT_DESC, image = SITE.image, noindex = false, jsonLd = null, type = "website" } = opts;
  const ld = jsonLd ? JSON.stringify(jsonLd) : "";
  useEffect(() => {
    const full = title ? `${title} | ${SITE.name}` : DEFAULT_TITLE;
    const url = SITE.url + window.location.pathname;
    const img = image.startsWith("http") ? image : SITE.url + image;
    const desc = description.length > 158 ? `${description.slice(0, 155).trimEnd()}...` : description;
    document.title = full;
    upsertMeta("name", "description", desc);
    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    upsertMeta("property", "og:title", full);
    upsertMeta("property", "og:description", desc);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:site_name", SITE.name);
    upsertMeta("property", "og:image", img);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", full);
    upsertMeta("name", "twitter:description", desc);
    upsertMeta("name", "twitter:image", img);
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = url; // query strings (filters, pages) are left out on purpose
    let script = document.getElementById("seo-jsonld");
    if (ld) {
      if (!script) { script = document.createElement("script"); script.id = "seo-jsonld"; script.type = "application/ld+json"; document.head.appendChild(script); }
      script.textContent = ld;
    } else script?.remove();
  }, [title, description, image, noindex, ld, type]);
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
