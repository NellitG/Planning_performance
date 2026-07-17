import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/apiClient";

export type UserRoleKey =
  | "system_admin"
  | "national_me"
  | "high_level"
  | "business_logic"
  | "project_manager"
  | "department_head"
  | "staff_user";

export interface ManagedUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRoleKey;
  institute: string;
  active: boolean;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export interface ManagedUserInput {
  fullName: string;
  email: string;
  role: UserRoleKey;
  institute: string;
  password?: string;
  active: boolean;
}

export interface ValueChain {
  id: string;
  name: string;
  category: "Crops" | "Fisheries" | "Livestock";
  priority: "High" | "Medium" | "Low";
  projects: number;
  active: boolean;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export interface ValueChainInput {
  name: string;
  category: ValueChain["category"];
  priority: ValueChain["priority"];
  active: boolean;
}

export interface StrategicPlanDocument {
  id: string;
  documentTitle: string;
  fileName: string;
  fileUrl: string | null;
  fileSize: number;
  uploadedBy: string;
  dateUploaded: string;
  updatedAt: string;
}

export interface StrategicPlanInput {
  documentTitle: string;
  uploadedBy?: string;
  file?: File;
}

export interface ReferenceSubCentre { id: string; name: string; county: string; }
export interface ReferenceCentre { id: string; name: string; county: string; subCentres: ReferenceSubCentre[]; }
export interface ReferenceInstitute { id: string; name: string; county: string; centres: ReferenceCentre[]; directSubCentres: ReferenceSubCentre[]; }
export interface ReferenceCounty { id: string; name: string; institutes: ReferenceInstitute[]; }

export const userManagementKeys = {
  users: ["user-management", "users"] as const,
  user: (id: string | undefined) => ["user-management", "users", id] as const,
  valueChains: ["user-management", "value-chains"] as const,
  valueChain: (id: string | undefined) => ["user-management", "value-chains", id] as const,
  strategicPlanDocuments: ["user-management", "strategic-plan-documents"] as const,
  strategicPlanDocument: (id: string | undefined) => ["user-management", "strategic-plan-documents", id] as const,
  referenceData: ["user-management", "reference-data"] as const,
};

const STALE = 30_000;

export function roleLabel(role: UserRoleKey) {
  const labels: Record<UserRoleKey, string> = {
    system_admin: "System Admin",
    national_me: "National M&E",
    high_level: "High Level",
    business_logic: "Business Logic",
    project_manager: "Project Manager",
    department_head: "Department Head",
    staff_user: "Staff User",
  };
  return labels[role] ?? role;
}

export function useReferenceData() {
  return useQuery({
    queryKey: userManagementKeys.referenceData,
    queryFn: () => api.get<ReferenceCounty[]>("/user-management/reference-data/"),
    staleTime: STALE,
  });
}

export function useManagedUsers() {
  return useQuery({
    queryKey: userManagementKeys.users,
    queryFn: () => api.get<ManagedUser[]>("/user-management/users/"),
    staleTime: STALE,
  });
}

export function useManagedUser(id: string | undefined) {
  return useQuery({
    queryKey: userManagementKeys.user(id),
    queryFn: () => api.get<ManagedUser>(`/user-management/users/${id}/`),
    enabled: !!id,
    staleTime: STALE,
  });
}

export function useCreateManagedUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ManagedUserInput) => api.post<ManagedUser>("/user-management/users/", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: userManagementKeys.users }),
  });
}

export function useUpdateManagedUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: ManagedUserInput & { id: string }) =>
      api.patch<ManagedUser>(`/user-management/users/${id}/`, input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: userManagementKeys.users });
      qc.invalidateQueries({ queryKey: userManagementKeys.user(vars.id) });
    },
  });
}

export function useDeleteManagedUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/user-management/users/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: userManagementKeys.users }),
  });
}

export function useValueChains() {
  return useQuery({
    queryKey: userManagementKeys.valueChains,
    queryFn: () => api.get<ValueChain[]>("/user-management/value-chains/"),
    staleTime: STALE,
  });
}

export function useValueChain(id: string | undefined) {
  return useQuery({
    queryKey: userManagementKeys.valueChain(id),
    queryFn: () => api.get<ValueChain>(`/user-management/value-chains/${id}/`),
    enabled: !!id,
    staleTime: STALE,
  });
}

export function useCreateValueChain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ValueChainInput) => api.post<ValueChain>("/user-management/value-chains/", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: userManagementKeys.valueChains }),
  });
}

export function useUpdateValueChain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: ValueChainInput & { id: string }) =>
      api.patch<ValueChain>(`/user-management/value-chains/${id}/`, input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: userManagementKeys.valueChains });
      qc.invalidateQueries({ queryKey: userManagementKeys.valueChain(vars.id) });
    },
  });
}

export function useDeleteValueChain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/user-management/value-chains/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: userManagementKeys.valueChains }),
  });
}

function documentForm(input: StrategicPlanInput) {
  const form = new FormData();
  form.append("documentTitle", input.documentTitle);
  form.append("uploadedBy", input.uploadedBy || "");
  if (input.file) form.append("uploadedFile", input.file);
  return form;
}

export function useStrategicPlanDocuments() {
  return useQuery({
    queryKey: userManagementKeys.strategicPlanDocuments,
    queryFn: () => api.get<StrategicPlanDocument[]>("/user-management/strategic-plan-documents/"),
    staleTime: STALE,
  });
}

export function useStrategicPlanDocument(id: string | undefined) {
  return useQuery({
    queryKey: userManagementKeys.strategicPlanDocument(id),
    queryFn: () => api.get<StrategicPlanDocument>(`/user-management/strategic-plan-documents/${id}/`),
    enabled: !!id,
    staleTime: STALE,
  });
}

export function useCreateStrategicPlanDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StrategicPlanInput) =>
      api.postForm<StrategicPlanDocument>("/user-management/strategic-plan-documents/", documentForm(input)),
    onSuccess: () => qc.invalidateQueries({ queryKey: userManagementKeys.strategicPlanDocuments }),
  });
}

export function useUpdateStrategicPlanDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: StrategicPlanInput & { id: string }) =>
      api.patchForm<StrategicPlanDocument>(`/user-management/strategic-plan-documents/${id}/`, documentForm(input)),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: userManagementKeys.strategicPlanDocuments });
      qc.invalidateQueries({ queryKey: userManagementKeys.strategicPlanDocument(vars.id) });
    },
  });
}

export function useDeleteStrategicPlanDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/user-management/strategic-plan-documents/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: userManagementKeys.strategicPlanDocuments }),
  });
}
