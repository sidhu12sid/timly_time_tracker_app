import { getToken } from "./auth.js";

// Thin fetch wrapper around the REST API.
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/api${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (!res.ok) {
    let detail;
    try {
      detail = await res.json();
    } catch {
      detail = { error: res.statusText };
    }
    const err = new Error(detail.error ?? `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // --- Auth ---
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  verifyOtp: (body) => request("/auth/verify-otp", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  forgotPassword: (body) =>
    request("/auth/forgot-password", { method: "POST", body: JSON.stringify(body) }),
  verifyResetOtp: (body) =>
    request("/auth/verify-reset-otp", { method: "POST", body: JSON.stringify(body) }),
  resetPassword: (body) =>
    request("/auth/reset-password", { method: "POST", body: JSON.stringify(body) }),

  // --- Reference data ---
  listCurrencies: () => request("/currencies"),

  // --- App data ---
  listClients: () => request("/clients"),
  createClient: (body) => request("/clients", { method: "POST", body: JSON.stringify(body) }),
  updateClient: (id, body) => request(`/clients/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteClient: (id) => request(`/clients/${id}`, { method: "DELETE" }),

  listProjects: () => request("/projects"),
  createProject: (body) => request("/projects", { method: "POST", body: JSON.stringify(body) }),
  updateProject: (id, body) => request(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: "DELETE" }),

  listTimeEntries: () => request("/time-entries"),
  createTimeEntry: (body) => request("/time-entries", { method: "POST", body: JSON.stringify(body) }),
  pauseTimer: (id) => request(`/time-entries/${id}/pause`, { method: "PATCH" }),
  resumeTimer: (id) => request(`/time-entries/${id}/resume`, { method: "PATCH" }),
  stopTimer: (id) => request(`/time-entries/${id}/stop`, { method: "PATCH" }),
  deleteTimeEntry: (id) => request(`/time-entries/${id}`, { method: "DELETE" }),

  getDashboard: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/dashboard${qs ? `?${qs}` : ""}`);
  },
};
