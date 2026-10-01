import { useSyncExternalStore } from "react";

/** A tiny persistent store. Data lives in this browser only (localStorage, or sessionStorage for temporary state). */
function createStore(key, initial, kind = "local") {
  const storage = () => { try { return kind === "session" ? sessionStorage : localStorage; } catch { return null; } };
  const listeners = new Set();
  let cache; // raw string last parsed, and its value
  let raw = null, value = initial;
  const read = () => {
    let next = null;
    try { next = storage()?.getItem(key) ?? null; } catch { /* storage blocked */ }
    if (next !== raw || cache === undefined) {
      raw = next; cache = true;
      try { value = next ? JSON.parse(next) : initial; } catch { value = initial; }
    }
    return value;
  };
  const emit = () => listeners.forEach((l) => l());
  if (typeof window !== "undefined") window.addEventListener("storage", (e) => e.key === key && emit());
  return {
    get: read,
    set(next) { try { storage()?.setItem(key, JSON.stringify(next)); } catch { /* ignore */ } raw = JSON.stringify(next); value = next; cache = true; emit(); },
    subscribe(l) { listeners.add(l); return () => listeners.delete(l); },
  };
}

const wishlist = createStore("saved", []);
const recent = createStore("recent", []);
const progress = createStore("progress", {});
const compare = createStore("compare", [], "session");

const use = (s) => useSyncExternalStore(s.subscribe, s.get, () => s.get());

export function useWishlist() {
  const slugs = use(wishlist);
  return {
    slugs,
    has: (slug) => slugs.includes(slug),
    toggle: (slug) => wishlist.set(slugs.includes(slug) ? slugs.filter((s) => s !== slug) : [slug, ...slugs]),
  };
}

export function useRecent() {
  const slugs = use(recent);
  return { slugs, push: (slug) => { if (recent.get()[0] !== slug) recent.set([slug, ...recent.get().filter((s) => s !== slug)].slice(0, 8)); } };
}

/** Lesson completion, kept on this device only (there is no progress endpoint yet). */
export function useProgress() {
  const all = use(progress);
  return {
    done: (slug) => all[slug] || [],
    toggle: (slug, lessonId) => {
      const cur = progress.get()[slug] || [];
      progress.set({ ...progress.get(), [slug]: cur.includes(lessonId) ? cur.filter((i) => i !== lessonId) : [...cur, lessonId] });
    },
  };
}

export const COMPARE_MAX = 3;
export function useCompare() {
  const slugs = use(compare);
  return {
    slugs,
    has: (slug) => slugs.includes(slug),
    toggle: (slug) => {
      if (slugs.includes(slug)) return compare.set(slugs.filter((s) => s !== slug));
      if (slugs.length < COMPARE_MAX) compare.set([...slugs, slug]);
    },
    clear: () => compare.set([]),
    full: slugs.length >= COMPARE_MAX,
  };
}
