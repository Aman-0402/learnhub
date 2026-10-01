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
  const isFormData = body instanceof FormData;
  const headers = isFormData ? {} : { "Content-Type": "application/json" };
  if (auth && store.access) headers.Authorization = `Bearer ${store.access}`;
  const res = await fetch(`/api${path}`, { method, headers, body: isFormData ? body : body ? JSON.stringify(body) : undefined });
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

const FIELD_LABELS = { password: "", new_password: "", old_password: "Current password", email: "Email", full_name: "Name", phone: "Phone", message: "Message", name: "Name" };

function errorMessage(data) {
  if (!data) return "";
  if (typeof data.detail === "string") return data.detail;
  return Object.entries(data)
    .map(([k, v]) => {
      const label = k in FIELD_LABELS ? FIELD_LABELS[k] : k === "non_field_errors" ? "" : k;
      return `${label ? label + ": " : ""}${[].concat(v).join(" ")}`;
    })
    .join(" ");
}
