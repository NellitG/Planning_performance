import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { AuthState, AuthContextValue, LoginParams } from "@/utils/types";

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "kalro_auth_v1";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setAuth(JSON.parse(raw) as AuthState);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const login = useCallback(({ email, moduleKey, role = "Administrator" }: LoginParams): AuthState => {
    const next: AuthState = {
      user: {
        email,
        name: email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        role,
        initials: email.slice(0, 2).toUpperCase(),
      },
      module: moduleKey,
      token: "mock-" + Math.random().toString(36).slice(2),
      issuedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setAuth(next);
    return next;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  }, []);

  return (
    <AuthContext.Provider value={{ auth, hydrated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
