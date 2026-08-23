import { apiClient } from "./apiClient";
import { User } from "@/types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/login", payload);
    return response.data;
  },

  async getMe(): Promise<{ success: boolean; data: User }> {
    const response = await apiClient.get<{ success: boolean; data: User }>("/auth/me");
    return response.data;
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>("/auth/logout");
      return response.data;
    } catch {
      return { success: true, message: "Logged out" };
    }
  },
};
