import { api } from "./api.js";

const qs = (params = {}) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== "" && v != null) p.set(k, v); });
  const s = p.toString();
  return s ? `?${s}` : "";
};

/** Thin wrapper over the staff API (`/api/manage/`). */
export const manage = {
  list: (res, params) => api(`/manage/${res}/${qs(params)}`),
  /** Every row of a resource, following pagination (staff lists are small). */
  async all(res, params = {}) {
    let page = 1, out = [];
    for (;;) {
      const d = await api(`/manage/${res}/${qs({ ...params, page, page_size: 200 })}`);
      out = out.concat(d.results || d);
      if (!d.next) return out;
      page += 1;
    }
  },
  get: (res, id) => api(`/manage/${res}/${id}/`),
  create: (res, body) => api(`/manage/${res}/`, { method: "POST", body }),
  update: (res, id, body) => api(`/manage/${res}/${id}/`, { method: "PATCH", body }),
  remove: (res, id) => api(`/manage/${res}/${id}/`, { method: "DELETE" }),
  action: (res, id, action, body) => api(`/manage/${res}/${id}/${action}/`, { method: "POST", body }),
  uploadFile: (res, id, field, file) => {
    const form = new FormData();
    form.set(field, file);
    return api(`/manage/${res}/${id}/`, { method: "PATCH", body: form });
  },
  summary: (res) => api(`/manage/${res}/summary/`),
  overview: () => api("/manage/overview/"),
};

/** Turns a DRF error body into `{ field: "message" }`; anything not tied to a field goes under `_form`. */
export function fieldErrors(err) {
  const d = err?.data;
  const out = {};
  if (d && typeof d === "object" && !Array.isArray(d) && !d.detail) {
    for (const [k, v] of Object.entries(d)) out[k === "non_field_errors" ? "_form" : k] = [].concat(v).join(" ");
    return out;
  }
  out._form = err?.message || "Something went wrong.";
  return out;
}

/** Plain checks that mirror the backend rules, so mistakes show before a round trip. Returns `{ field: message }`. */
export const check = {
  required: (v, label) => (String(v ?? "").trim() ? "" : `${label} is required.`),
  int: (v, label, { min = 0, optional = false } = {}) => {
    if (v === "" || v == null) return optional ? "" : `${label} is required.`;
    const n = Number(v);
    if (!Number.isInteger(n)) return `${label} must be a whole number.`;
    return n < min ? `${label} must be at least ${min}.` : "";
  },
  money: (v, label) => {
    if (v === "" || v == null) return `${label} is required.`;
    const n = Number(v);
    if (Number.isNaN(n)) return `${label} must be a number.`;
    return n < 0 ? `${label} cannot be negative.` : "";
  },
};

export const compact = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
export const MODES = [["online", "Online"], ["offline", "Offline"], ["hybrid", "Online + Offline"]];
export const KINDS = [["video", "Video"], ["reading", "Reading"], ["live", "Live or in-person class"], ["assignment", "Assignment"]];
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
