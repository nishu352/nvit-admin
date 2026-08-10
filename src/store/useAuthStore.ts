import { create } from "zustand";
import { User } from "@/types";
import { authService, LoginPayload } from "@/services/authService";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

// Safe localStorage wrapper — guards against SecurityError (e.g. browser
// extensions, restricted iframes, or private-browsing restrictions)
function safeLocalStorage(op: "get" | "set" | "remove", key: string, value?: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    if (op === "get") return localStorage.getItem(key);
    if (op === "set" && value !== undefined) { localStorage.setItem(key, value); return null; }
    if (op === "remove") { localStorage.removeItem(key); return null; }
  } catch {
    // SecurityError or QuotaExceededError — gracefully degrade
  }
  return null;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: safeLocalStorage("get", "token"),
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (payload: LoginPayload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(payload);
      const { user, token } = response.data;
      safeLocalStorage("set", "token", token);
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Invalid credentials";
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    safeLocalStorage("remove", "token");
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  checkAuth: async () => {
    const token = safeLocalStorage("get", "token");
    if (!token) {
      set({ isAuthenticated: false, user: null, token: null });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await authService.getMe();
      set({
        user: response.data,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      safeLocalStorage("remove", "token");
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
