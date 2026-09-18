import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { AuthState, AuthContextValue, LoginParams } from "@/utils/types";
import { api, setAuthToken } from "@/utils/apiClient";

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "kalro_auth_state";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setAuth(JSON.parse(raw) as AuthState);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const login = useCallback(async ({ email, password, moduleKey }: LoginParams): Promise<AuthState> => {
    const response = await api.post<{ token: string; user: { email: string; name: string; roles: string[] } }>("/auth/login/", { email, password });
    const next: AuthState = { user: { email: response.user.email, name: response.user.name, role: response.user.roles[0] || "", initials: response.user.name.split(/\s+/).map(x => x[0]).join("").slice(0, 2).toUpperCase() }, module: moduleKey, token: response.token, issuedAt: new Date().toISOString() };
    setAuthToken(next.token);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setAuth(next); return next;
  }, []);

  const logout = useCallback(() => {
    if (auth) api.post("/auth/logout/").catch(() => undefined);
    setAuthToken(null); sessionStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  }, [auth]);

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
