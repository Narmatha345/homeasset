import { apiClient } from "./client";
import type { User } from "../types";

export interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>("/auth/login", { email, password }).then((r) => r.data),
  register: (name: string, email: string, password: string) =>
    apiClient.post<AuthResponse>("/auth/register", { name, email, password }).then((r) => r.data),
  me: () => apiClient.get<{ user: User }>("/auth/me").then((r) => r.data),
};
