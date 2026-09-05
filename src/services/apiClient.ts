import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Dedicated lightweight client for health checks — short timeout, never blocks on busy server
export const healthClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 5000,
});

// Dedicated client for file uploads — much longer timeout for large Excel imports
export const importApiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 600000, // 10 minutes — needed for 70,000+ row imports
});

import { safeStorage } from "@/lib/storage";

// Request interceptors — automatically attach Bearer token if available
apiClient.interceptors.request.use((config) => {
  const token = safeStorage.getItem("admin_token");
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

importApiClient.interceptors.request.use((config) => {
  const token = safeStorage.getItem("admin_token");
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Utility: dispatch a custom event to trigger client-side redirect cleanly
// (avoids window.location.href hard reload — preserves React Query cache)
function triggerAuthRedirect(path: string): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname === path) return;
  // Dispatch a custom event that AuthGuard listens to
  window.dispatchEvent(new CustomEvent("admin:auth:redirect", { detail: { path } }));
}

// Response interceptors — gracefully redirect on 401 unauthenticated
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      triggerAuthRedirect("/");
    }
    return Promise.reject(error);
  }
);

importApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      triggerAuthRedirect("/");
    }
    return Promise.reject(error);
  }
);
