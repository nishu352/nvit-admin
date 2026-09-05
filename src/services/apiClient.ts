import axios from "axios";

const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl) {
    if (
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ) {
      return "http://localhost:5001/api/v1";
    }
    return "https://web-production-676ee.up.railway.app/api/v1";
  }

  const clean = envUrl.trim().replace(/\/+$/, "");
  if (clean.endsWith("/api/v1")) {
    return clean;
  }
  if (clean.endsWith("/api")) {
    return `${clean}/v1`;
  }
  return `${clean}/api/v1`;
};

const API_BASE_URL = getApiBaseUrl();

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
