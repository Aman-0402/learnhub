import { api } from "./api.js";

let cached = null;

/** Every published course, fetched page by page and kept for the session so filters can run instantly. */
export function fetchAllCourses({ fresh = false } = {}) {
  if (cached && !fresh) return cached;
  cached = (async () => {
    const all = [];
    let page = 1;
    for (;;) {
      const d = await api(`/courses/?page=${page}`, { auth: false });
      all.push(...d.results);
      if (!d.next) break;
      page += 1;
    }
    return all;
  })();
  cached.catch(() => { cached = null; });
  return cached;
}
