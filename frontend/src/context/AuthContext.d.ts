import { ReactNode } from "react";

export interface AuthUser {
  email: string;
  name: string;
  role: string;
  initials: string;
}

export interface AuthState {
  user: AuthUser;
  module: "strategic-objectives" | "performance-contracts" | "projects";
  token: string;
  issuedAt: string;
}

export interface AuthContextValue {
  auth: AuthState | null;
  hydrated: boolean;
  login: (params: { email: string; moduleKey: string; role?: string }) => AuthState;
  logout: () => void;
}

export function AuthProvider(props: { children: ReactNode }): JSX.Element;
export function useAuth(): AuthContextValue;
