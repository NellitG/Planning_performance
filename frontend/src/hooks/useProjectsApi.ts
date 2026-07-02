import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { api } from "@/utils/apiClient";
import type {
  Project,
  KRAComponent,
  ProjectObjective,
  ProjectStrategy,
  KeyActivity,
  ExpectedOutput,
  OutputIndicator,
  ProjectDocument,
  ProjectMapping,
  MainActivity,
  SubActivity,
} from "@/utils/types";

/* ------------------------------------------------------------------ keys */
export const qk = {
  projects: ["projects"] as const,
  kras: ["kras"] as const,
  objectives: ["objectives"] as const,
  strategies: ["strategies"] as const,
  keyActivities: ["keyActivities"] as const,
  expectedOutputs: ["expectedOutputs"] as const,
  outputIndicators: ["outputIndicators"] as const,
  mainActivities: ["mainActivities"] as const,
  subActivities: ["subActivities"] as const,
  documents: (projectId: string) => ["documents", projectId] as const,
  mapping: (projectId: string) => ["mapping", projectId] as const,
  tracking: (projectId: string) => ["tracking", projectId] as const,
};

const STALE = 30_000;

function nullableId(v: string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  return Number(v);
}

/* --------------------------------------------------------------- projects */
export function useProjects() {
  return useQuery({
    queryKey: qk.projects,
    queryFn: () => api.get<Project[]>("/projects/"),
    staleTime: STALE,
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => api.get<Project>(`/projects/${id}/`),
    enabled: !!id,
    staleTime: STALE,
  });
}

interface ProjectInput {
  name: string;
  logo?: string;
  description?: string;
  startDate?: string | null;
  endDate?: string | null;
  status?: string;
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectInput) => api.post<Project>("/projects/", { ...input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.projects }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: ProjectInput & { id: string }) =>
      api.put<Project>(`/projects/${id}/`, { ...input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.projects }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/projects/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.projects }),
  });
}

/* ---------------------------------------------------------- KRA components */
export function useComponents() {
  return useQuery({
    queryKey: qk.kras,
    queryFn: () => api.get<KRAComponent[]>("/kras/"),
    staleTime: STALE,
  });
}

export function useCreateComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => api.post<KRAComponent>("/kras/", { title }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.kras }),
  });
}

export function useUpdateComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      api.put<KRAComponent>(`/kras/${id}/`, { title }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.kras }),
  });
}

export function useDeleteComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/kras/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.kras });
      qc.invalidateQueries({ queryKey: qk.objectives });
      qc.invalidateQueries({ queryKey: qk.strategies });
    },
  });
}

/* -------------------------------------------------------- strategic objectives */
export function useObjectives() {
  return useQuery({
    queryKey: qk.objectives,
    queryFn: () => api.get<ProjectObjective[]>("/strategic-objectives/"),
    staleTime: STALE,
  });
}

export function useCreateObjective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ componentId, text }: { componentId: string; text: string }) =>
      api.post<ProjectObjective>("/strategic-objectives/", {
        componentId: Number(componentId),
        text,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.objectives }),
  });
}

export function useUpdateObjective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      componentId,
      text,
    }: {
      id: string;
      componentId: string;
      text: string;
    }) =>
      api.put<ProjectObjective>(`/strategic-objectives/${id}/`, {
        componentId: Number(componentId),
        text,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.objectives }),
  });
}

export function useDeleteObjective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/strategic-objectives/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.objectives });
      qc.invalidateQueries({ queryKey: qk.strategies });
    },
  });
}

/* ----------------------------------------------------------------- strategies */
export function useStrategies() {
  return useQuery({
    queryKey: qk.strategies,
    queryFn: () => api.get<ProjectStrategy[]>("/strategies/"),
    staleTime: STALE,
  });
}

export function useCreateStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      objectiveId,
      text,
    }: {
      componentId?: string;
      objectiveId: string;
      text: string;
    }) =>
      api.post<ProjectStrategy>("/strategies/", {
        objectiveId: Number(objectiveId),
        text,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.strategies }),
  });
}

export function useUpdateStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      objectiveId,
      text,
    }: {
      id: string;
      componentId?: string;
      objectiveId: string;
      text: string;
    }) =>
      api.put<ProjectStrategy>(`/strategies/${id}/`, {
        objectiveId: Number(objectiveId),
        text,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.strategies }),
  });
}

export function useDeleteStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/strategies/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.strategies }),
  });
}

/* -------------------------------------------------------------- key activities */
export function useKeyActivities() {
  return useQuery({
    queryKey: qk.keyActivities,
    queryFn: () => api.get<KeyActivity[]>("/key-activities/"),
    staleTime: STALE,
  });
}

export function useCreateKeyActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ strategyId, text }: { strategyId: string; text: string }) =>
      api.post<KeyActivity>("/key-activities/", {
        strategyId: Number(strategyId),
        text,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.keyActivities }),
  });
}

export function useUpdateKeyActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      strategyId,
      text,
    }: {
      id: string;
      strategyId: string;
      text: string;
    }) =>
      api.put<KeyActivity>(`/key-activities/${id}/`, {
        strategyId: Number(strategyId),
        text,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.keyActivities }),
  });
}

export function useDeleteKeyActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/key-activities/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.keyActivities }),
  });
}

/* ------------------------------------------------------------ expected outputs */
export function useExpectedOutputs() {
  return useQuery({
    queryKey: qk.expectedOutputs,
    queryFn: () => api.get<ExpectedOutput[]>("/expected-outputs/"),
    staleTime: STALE,
  });
}

export function useCreateExpectedOutput() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      strategyId,
      keyActivityId,
      text,
    }: {
      strategyId: string;
      keyActivityId: string;
      text: string;
    }) =>
      api.post<ExpectedOutput>("/expected-outputs/", {
        strategyId: Number(strategyId),
        keyActivityId: nullableId(keyActivityId),
        text,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.expectedOutputs }),
  });
}

export function useUpdateExpectedOutput() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      strategyId,
      keyActivityId,
      text,
    }: {
      id: string;
      strategyId: string;
      keyActivityId: string;
      text: string;
    }) =>
      api.put<ExpectedOutput>(`/expected-outputs/${id}/`, {
        strategyId: Number(strategyId),
        keyActivityId: nullableId(keyActivityId),
        text,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.expectedOutputs }),
  });
}

export function useDeleteExpectedOutput() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/expected-outputs/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.expectedOutputs }),
  });
}

/* ----------------------------------------------------------- output indicators */
export function useOutputIndicators() {
  return useQuery({
    queryKey: qk.outputIndicators,
    queryFn: () => api.get<OutputIndicator[]>("/output-indicators/"),
    staleTime: STALE,
  });
}

export function useCreateOutputIndicator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      strategyId,
      keyActivityId,
      expectedOutputId,
      text,
    }: {
      strategyId: string;
      keyActivityId: string;
      expectedOutputId: string;
      text: string;
    }) =>
      api.post<OutputIndicator>("/output-indicators/", {
        strategyId: nullableId(strategyId),
        keyActivityId: nullableId(keyActivityId),
        expectedOutputId: Number(expectedOutputId),
        text,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.outputIndicators }),
  });
}

export function useUpdateOutputIndicator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      strategyId,
      keyActivityId,
      expectedOutputId,
      text,
    }: {
      id: string;
      strategyId: string;
      keyActivityId: string;
      expectedOutputId: string;
      text: string;
    }) =>
      api.put<OutputIndicator>(`/output-indicators/${id}/`, {
        strategyId: nullableId(strategyId),
        keyActivityId: nullableId(keyActivityId),
        expectedOutputId: Number(expectedOutputId),
        text,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.outputIndicators }),
  });
}

export function useDeleteOutputIndicator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/output-indicators/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.outputIndicators }),
  });
}

/* --------------------------------------------------------- project documents */
export function useProjectDocuments(projectId: string | undefined) {
  return useQuery({
    queryKey: qk.documents(projectId ?? ""),
    queryFn: () =>
      api.get<ProjectDocument[]>(`/project-documents/?project=${projectId}`),
    enabled: !!projectId,
    staleTime: STALE,
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      file,
    }: {
      projectId: string;
      file: File;
    }) => {
      const form = new FormData();
      form.append("project", projectId);
      form.append("name", file.name);
      form.append("type", file.type || "");
      form.append("size", String(file.size));
      form.append("file", file);
      return api.postForm<ProjectDocument>("/project-documents/", form);
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: qk.documents(vars.projectId) }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; projectId: string }) =>
      api.del(`/project-documents/${id}/`),
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: qk.documents(vars.projectId) }),
  });
}

/* ---------------------------------------------------------- project mappings */
export function useAllMappings() {
  return useQuery({
    queryKey: ["mappings", "all"],
    queryFn: () => api.get<(ProjectMapping & { project: number })[]>("/project-mappings/"),
    staleTime: STALE,
  });
}

export function useProjectMapping(projectId: string | undefined) {
  return useQuery({
    queryKey: qk.mapping(projectId ?? ""),
    queryFn: async () => {
      const list = await api.get<ProjectMapping[]>(
        `/project-mappings/?project=${projectId}`,
      );
      return list[0] ?? null;
    },
    enabled: !!projectId,
    staleTime: STALE,
  });
}

interface MappingInput {
  projectId: string;
  kraIds: string[];
  objectiveIds: string[];
  strategyIds: string[];
  keyActivityIds: string[];
  expectedOutputIds: string[];
  outputIndicatorIds: string[];
}

export function useSaveMapping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MappingInput) =>
      api.post<ProjectMapping>("/project-mappings/", {
        project: Number(input.projectId),
        kraIds: input.kraIds.map(Number),
        objectiveIds: input.objectiveIds.map(Number),
        strategyIds: input.strategyIds.map(Number),
        keyActivityIds: input.keyActivityIds.map(Number),
        expectedOutputIds: input.expectedOutputIds.map(Number),
        outputIndicatorIds: input.outputIndicatorIds.map(Number),
      }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: qk.mapping(vars.projectId) });
      qc.invalidateQueries({ queryKey: ["mappings", "all"] });
    },
  });
}

/* -------------------------------------------------------- indicator tracking */
export interface TrackingRow {
  id: string;
  project: string;
  outputIndicatorId: string;
  year: number;
  target: number | null;
  achievement: string;
  evidenceName: string;
  evidenceUrl: string | null;
}

export function useProjectTracking(projectId: string | undefined) {
  return useQuery({
    queryKey: qk.tracking(projectId ?? ""),
    queryFn: () =>
      api.get<TrackingRow[]>(`/indicator-tracking/?project=${projectId}`),
    enabled: !!projectId,
    staleTime: STALE,
  });
}

export interface TrackingEntryInput {
  year: number;
  target: number | null;
  achievement: string;
  evidenceName: string;
}

export function useSaveTracking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      outputIndicatorId,
      entries,
    }: {
      projectId: string;
      outputIndicatorId: string;
      entries: TrackingEntryInput[];
    }) =>
      api.post<TrackingRow[]>("/indicator-tracking/bulk-save/", {
        project: Number(projectId),
        outputIndicatorId: Number(outputIndicatorId),
        entries,
      }),
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: qk.tracking(vars.projectId) }),
  });
}

export function useUploadEvidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      trackingId,
      file,
    }: {
      trackingId: string;
      projectId: string;
      file: File;
    }) => {
      const form = new FormData();
      form.append("evidence", file);
      return api.postForm<TrackingRow>(
        `/indicator-tracking/${trackingId}/upload-evidence/`,
        form,
      );
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: qk.tracking(vars.projectId) }),
  });
}

/* ---------------------------------------------------------- main activities */
export function useMainActivities() {
  return useQuery({
    queryKey: qk.mainActivities,
    queryFn: () => api.get<MainActivity[]>("/main-activities/"),
    staleTime: STALE,
  });
}

export function useCreateMainActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post<MainActivity>("/main-activities/", { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.mainActivities }),
  });
}

export function useUpdateMainActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.put<MainActivity>(`/main-activities/${id}/`, { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.mainActivities }),
  });
}

export function useDeleteMainActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/main-activities/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.mainActivities }),
  });
}

/* ----------------------------------------------------------- sub activities */
export function useSubActivities() {
  return useQuery({
    queryKey: qk.subActivities,
    queryFn: () => api.get<SubActivity[]>("/sub-activities/"),
    staleTime: STALE,
  });
}

export function useCreateSubActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      mainActivityId,
      name,
      category,
      valueChain,
    }: {
      mainActivityId: string;
      name: string;
      category: string;
      valueChain: string;
    }) =>
      api.post<SubActivity>("/sub-activities/", {
        mainActivityId: Number(mainActivityId),
        name,
        category,
        valueChain,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.subActivities }),
  });
}

export function useUpdateSubActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      mainActivityId,
      name,
      category,
      valueChain,
    }: {
      id: string;
      mainActivityId: string;
      name: string;
      category: string;
      valueChain: string;
    }) =>
      api.put<SubActivity>(`/sub-activities/${id}/`, {
        mainActivityId: Number(mainActivityId),
        name,
        category,
        valueChain,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.subActivities }),
  });
}

export function useDeleteSubActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/sub-activities/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.subActivities }),
  });
}

export function prefetchAll(qc: QueryClient) {
  qc.invalidateQueries();
}
