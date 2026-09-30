const store = {
  get access() { try { return localStorage.getItem("access"); } catch { return null; } },
  get refresh() { try { return localStorage.getItem("refresh"); } catch { return null; } },
  set(tokens) { try { Object.entries(tokens).forEach(([k, v]) => localStorage.setItem(k, v)); } catch {} },
  clear() { try { localStorage.removeItem("access"); localStorage.removeItem("refresh"); } catch {} },
};

export const tokens = store;

async function refreshAccess() {
  if (!store.refresh) return false;
  const r = await fetch("/api/auth/refresh/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: store.refresh }),
  });
  if (!r.ok) { store.clear(); return false; }
  store.set({ access: (await r.json()).access });
  return true;
}

export async function api(path, { method = "GET", body, auth = true } = {}, retry = true) {
  const headers = { "Content-Type": "application/json" };
  if (auth && store.access) headers.Authorization = `Bearer ${store.access}`;
  const res = await fetch(`/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (res.status === 401 && auth && retry && (await refreshAccess())) {
    return api(path, { method, body, auth }, false);
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(errorMessage(data) || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function errorMessage(data) {
  if (!data) return "";
  if (typeof data.detail === "string") return data.detail;
  return Object.entries(data)
    .map(([k, v]) => `${k === "non_field_errors" ? "" : k + ": "}${[].concat(v).join(" ")}`)
    .join(" ");
}

/** Fetch every page of the public course list. */
export async function fetchAllCourses(params = "") {
  const all = [];
  let page = 1;
  for (;;) {
    const d = await api(`/courses/?page=${page}${params}`, { auth: false });
    all.push(...d.results);
    if (!d.next) return all;
    page += 1;
  }
}
