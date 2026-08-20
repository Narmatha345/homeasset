import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "../types";
import { authApi } from "../api/authApi";
import { apiErrorMessage } from "../api/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "homeasset_token";
const USER_KEY = "homeasset_user";

export const DEMO_EMAIL = "demo@homeasset.com";
export const DEMO_PASSWORD = "Demo@123";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const applySession = (token: string, nextUser: User) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const login = async (email: string, password: string) => {
    try {
      const { token, user: loggedInUser } = await authApi.login(email, password);
      applySession(token, loggedInUser);
    } catch (err) {
      throw new Error(apiErrorMessage(err, "Unable to sign in"));
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const { token, user: newUser } = await authApi.register(name, email, password);
      applySession(token, newUser);
    } catch (err) {
      throw new Error(apiErrorMessage(err, "Unable to create account"));
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
