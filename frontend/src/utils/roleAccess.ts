import type { AuthState } from "@/utils/types";

export function hasAnyRole(auth: AuthState | null, ...roles: string[]): boolean {
  if (!auth) return false;
  const assignedRoles = auth.user.roles ?? [auth.user.role];
  return roles.some((role) => assignedRoles.includes(role));
}

export function canManageProjects(auth: AuthState | null): boolean {
  return hasAnyRole(auth, "system_admin");
}

export function canManageTechnicalReports(auth: AuthState | null): boolean {
  return hasAnyRole(auth, "system_admin", "value_chain_lead");
}

export function canReviewTechnicalReports(auth: AuthState | null): boolean {
  return hasAnyRole(auth, "accountant", "project_coordinator", "me");
}
