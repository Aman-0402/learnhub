import { api } from "./api.js";
import { FEATURES } from "./features.js";
import { sampleBatches } from "./sample.js";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export const isSample = (flag) => !FEATURES[flag];

export async function requestPasswordReset(email) {
  if (FEATURES.passwordResetApi) return api("/auth/password-reset/", { method: "POST", body: { email }, auth: false });
  await wait(400);
  return { detail: "If an account exists for that email, a reset link has been sent." };
}

export async function confirmPasswordReset({ uid, token, new_password }) {
  if (FEATURES.passwordResetApi) return api("/auth/password-reset/confirm/", { method: "POST", body: { uid, token, new_password }, auth: false });
  await wait(400);
  return { detail: "Your password has been reset." };
}

export async function getBatches(course) {
  if (FEATURES.batchesApi) return api(`/courses/${course.slug}/batches/`, { auth: false });
  return sampleBatches(course);
}

// Sample mode remembers a student's chosen batch in this browser only.
const key = (slug) => `batch:${slug}`;
export const chosenBatch = {
  get(slug) { try { return JSON.parse(localStorage.getItem(key(slug))); } catch { return null; } },
  set(slug, batch) { try { localStorage.setItem(key(slug), JSON.stringify(batch)); } catch {} },
};
