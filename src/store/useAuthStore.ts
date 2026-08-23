import { create } from "zustand";
import { User } from "@/types";
import { authService, LoginPayload } from "@/services/authService";
import { safeStorage } from "@/lib/storage";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (payload: LoginPayload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(payload);
      const { user, token } = response.data;
      if (token) {
        safeStorage.setItem("admin_token", token);
      }
      set({
        user,
        token: token || null,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: unknown) {
      safeStorage.removeItem("admin_token");
      const msg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            "Invalid credentials";
      set({ error: msg, isLoading: false, isAuthenticated: false, user: null });
      throw new Error(msg);
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Swallow logout API errors — client-side cleanup still proceeds
    }
    safeStorage.removeItem("admin_token");
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
    // Fire a clean navigation event rather than hard reload
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("admin:auth:redirect", { detail: { path: "/" } }));
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const response = await authService.getMe();
      if (response && response.data) {
        set({
          user: response.data,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
