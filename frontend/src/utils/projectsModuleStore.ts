import type {
  KRAComponent,
  ProjectObjective,
  ProjectStrategy,
  KeyActivity,
  ExpectedOutput,
  OutputIndicator,
  ProjectDocument,
  ProjectMapping,
  Baseline,
  TrackingEntry,
  ProjectTrackingRecord,
} from "./types";

const KEYS = {
  components: "kalro_pm_components",
  objectives: "kalro_pm_objectives",
  strategies: "kalro_pm_strategies",
  keyActivities: "kalro_pm_key_activities",
  expectedOutputs: "kalro_pm_expected_outputs",
  outputIndicators: "kalro_pm_output_indicators",
  projectDocs: "kalro_pm_project_docs",
  projectMappings: "kalro_pm_project_mappings",
  deletedProjects: "kalro_pm_deleted_projects",
  baselines: "kalro_pm_baselines",
  projectTracking: "kalro_pm_project_tracking",
} as const;

function load<T>(key: string, fallback: T): T;
function load<T>(key: string): T[];
function load<T>(key: string, fallback: T[] | T = [] as unknown as T[]): T[] | T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T[] | T;
  } catch {
    return fallback;
  }
}

function save(key: string, data: unknown): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function fmt(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export const componentsStore = {
  getAll: (): KRAComponent[] => load<KRAComponent>(KEYS.components),
  getById: (id: string): KRAComponent | null => load<KRAComponent>(KEYS.components).find((c) => c.id === id) ?? null,
  create: (title: string): KRAComponent => {
    const items = load<KRAComponent>(KEYS.components);
    const item: KRAComponent = { id: uid(), title: title.trim(), createdAt: fmt() };
    save(KEYS.components, [...items, item]);
    return item;
  },
  update: (id: string, title: string): void => {
    const items = load<KRAComponent>(KEYS.components).map((c) =>
      c.id === id ? { ...c, title: title.trim() } : c,
    );
    save(KEYS.components, items);
  },
  delete: (id: string): void => {
    save(KEYS.components, load<KRAComponent>(KEYS.components).filter((c) => c.id !== id));
    save(KEYS.objectives, load<ProjectObjective>(KEYS.objectives).filter((o) => o.componentId !== id));
    const objIds = load<ProjectObjective>(KEYS.objectives).map((o) => o.id);
    save(KEYS.strategies, load<ProjectStrategy>(KEYS.strategies).filter((s) => objIds.includes(s.objectiveId)));
  },
};

export const objectivesStore = {
  getAll: (): ProjectObjective[] => load<ProjectObjective>(KEYS.objectives),
  getById: (id: string): ProjectObjective | null => load<ProjectObjective>(KEYS.objectives).find((o) => o.id === id) ?? null,
  getByComponent: (componentId: string): ProjectObjective[] => load<ProjectObjective>(KEYS.objectives).filter((o) => o.componentId === componentId),
  create: (componentId: string, text: string): ProjectObjective => {
    const items = load<ProjectObjective>(KEYS.objectives);
    const item: ProjectObjective = { id: uid(), componentId, text: text.trim(), createdAt: fmt() };
    save(KEYS.objectives, [...items, item]);
    return item;
  },
  update: (id: string, componentId: string, text: string): void => {
    const items = load<ProjectObjective>(KEYS.objectives).map((o) =>
      o.id === id ? { ...o, componentId, text: text.trim() } : o,
    );
    save(KEYS.objectives, items);
  },
  delete: (id: string): void => {
    save(KEYS.objectives, load<ProjectObjective>(KEYS.objectives).filter((o) => o.id !== id));
    save(KEYS.strategies, load<ProjectStrategy>(KEYS.strategies).filter((s) => s.objectiveId !== id));
  },
};

export const strategiesStore = {
  getAll: (): ProjectStrategy[] => load<ProjectStrategy>(KEYS.strategies),
  getById: (id: string): ProjectStrategy | null => load<ProjectStrategy>(KEYS.strategies).find((s) => s.id === id) ?? null,
  getByObjective: (objectiveId: string): ProjectStrategy[] => load<ProjectStrategy>(KEYS.strategies).filter((s) => s.objectiveId === objectiveId),
  create: (componentId: string, objectiveId: string, text: string): ProjectStrategy => {
    const items = load<ProjectStrategy>(KEYS.strategies);
    const item: ProjectStrategy = { id: uid(), componentId, objectiveId, text: text.trim(), createdAt: fmt() };
    save(KEYS.strategies, [...items, item]);
    return item;
  },
  update: (id: string, componentId: string, objectiveId: string, text: string): void => {
    const items = load<ProjectStrategy>(KEYS.strategies).map((s) =>
      s.id === id ? { ...s, componentId, objectiveId, text: text.trim() } : s,
    );
    save(KEYS.strategies, items);
  },
  delete: (id: string): void => {
    save(KEYS.strategies, load<ProjectStrategy>(KEYS.strategies).filter((s) => s.id !== id));
  },
};

function makeLinkedStore(key: string) {
  return {
    getAll: (): KeyActivity[] => load<KeyActivity>(key),
    getById: (id: string): KeyActivity | null => load<KeyActivity>(key).find((x) => x.id === id) ?? null,
    getByStrategy: (strategyId: string): KeyActivity[] => load<KeyActivity>(key).filter((x) => x.strategyId === strategyId),
    create: (strategyId: string, text: string): KeyActivity => {
      const items = load<KeyActivity>(key);
      const item: KeyActivity = { id: uid(), strategyId, text: text.trim(), createdAt: fmt() };
      save(key, [...items, item]);
      return item;
    },
    update: (id: string, strategyId: string, text: string): void => {
      const items = load<KeyActivity>(key).map((x) =>
        x.id === id ? { ...x, strategyId, text: text.trim() } : x,
      );
      save(key, items);
    },
    delete: (id: string): void => {
      save(key, load<KeyActivity>(key).filter((x) => x.id !== id));
    },
  };
}

export const keyActivitiesStore = makeLinkedStore(KEYS.keyActivities);

export const expectedOutputsStore = {
  getAll: (): ExpectedOutput[] => load<ExpectedOutput>(KEYS.expectedOutputs),
  getById: (id: string): ExpectedOutput | null => load<ExpectedOutput>(KEYS.expectedOutputs).find((x) => x.id === id) ?? null,
  getByStrategy: (strategyId: string): ExpectedOutput[] => load<ExpectedOutput>(KEYS.expectedOutputs).filter((x) => x.strategyId === strategyId),
  create: (strategyId: string, keyActivityId: string, text: string): ExpectedOutput => {
    const items = load<ExpectedOutput>(KEYS.expectedOutputs);
    const item: ExpectedOutput = { id: uid(), strategyId, keyActivityId: keyActivityId || "", text: text.trim(), createdAt: fmt() };
    save(KEYS.expectedOutputs, [...items, item]);
    return item;
  },
  update: (id: string, strategyId: string, keyActivityId: string, text: string): void => {
    const items = load<ExpectedOutput>(KEYS.expectedOutputs).map((x) =>
      x.id === id ? { ...x, strategyId, keyActivityId: keyActivityId || "", text: text.trim() } : x,
    );
    save(KEYS.expectedOutputs, items);
  },
  delete: (id: string): void => {
    save(KEYS.expectedOutputs, load<ExpectedOutput>(KEYS.expectedOutputs).filter((x) => x.id !== id));
  },
};

export const outputIndicatorsStore = {
  getAll: (): OutputIndicator[] => load<OutputIndicator>(KEYS.outputIndicators),
  getById: (id: string): OutputIndicator | null => load<OutputIndicator>(KEYS.outputIndicators).find((x) => x.id === id) ?? null,
  getByStrategy: (strategyId: string): OutputIndicator[] => load<OutputIndicator>(KEYS.outputIndicators).filter((x) => x.strategyId === strategyId),
  create: (strategyId: string, keyActivityId: string, expectedOutputId: string, text: string): OutputIndicator => {
    const items = load<OutputIndicator>(KEYS.outputIndicators);
    const item: OutputIndicator = { id: uid(), strategyId, keyActivityId: keyActivityId || "", expectedOutputId: expectedOutputId || "", text: text.trim(), createdAt: fmt() };
    save(KEYS.outputIndicators, [...items, item]);
    return item;
  },
  update: (id: string, strategyId: string, keyActivityId: string, expectedOutputId: string, text: string): void => {
    const items = load<OutputIndicator>(KEYS.outputIndicators).map((x) =>
      x.id === id ? { ...x, strategyId, keyActivityId: keyActivityId || "", expectedOutputId: expectedOutputId || "", text: text.trim() } : x,
    );
    save(KEYS.outputIndicators, items);
  },
  delete: (id: string): void => {
    save(KEYS.outputIndicators, load<OutputIndicator>(KEYS.outputIndicators).filter((x) => x.id !== id));
  },
};

export const projectDocumentsStore = {
  getForProject: (projectId: string): ProjectDocument[] => {
    const all = load<Record<string, ProjectDocument[]>>(KEYS.projectDocs, {});
    return (all as Record<string, ProjectDocument[]>)[projectId] ?? [];
  },
  addDocument: (projectId: string, { name, size, type = "" }: { name: string; size: number; type?: string }): ProjectDocument => {
    const all = load<Record<string, ProjectDocument[]>>(KEYS.projectDocs, {}) as Record<string, ProjectDocument[]>;
    const doc: ProjectDocument = { id: uid(), name, size, type, uploadedAt: fmt(), createdAt: fmt() };
    all[projectId] = [...(all[projectId] ?? []), doc];
    save(KEYS.projectDocs, all);
    return doc;
  },
  removeDocument: (projectId: string, docId: string): void => {
    const all = load<Record<string, ProjectDocument[]>>(KEYS.projectDocs, {}) as Record<string, ProjectDocument[]>;
    all[projectId] = (all[projectId] ?? []).filter((d) => d.id !== docId);
    save(KEYS.projectDocs, all);
    projectDocumentDataStore.remove(docId);
  },
};

export const projectDocumentDataStore = {
  save: (docId: string, dataUrl: string): void => {
    try {
      localStorage.setItem(`kalro_docdata_${docId}`, dataUrl);
    } catch {
      // Storage quota exceeded — skip silently
    }
  },
  get: (docId: string): string | null => {
    try {
      return localStorage.getItem(`kalro_docdata_${docId}`);
    } catch {
      return null;
    }
  },
  remove: (docId: string): void => {
    try {
      localStorage.removeItem(`kalro_docdata_${docId}`);
    } catch {
      // ignore
    }
  },
};

export const projectMappingsStore = {
  getForProject: (projectId: string): ProjectMapping | null => {
    const all = load<Record<string, ProjectMapping>>(KEYS.projectMappings, {}) as Record<string, ProjectMapping>;
    const m = all[projectId] ?? null;
    if (!m) return null;
    // backward compat: old format used single componentId
    if (!m.kraIds && (m as unknown as Record<string, unknown>)["componentId"]) {
      m.kraIds = [(m as unknown as Record<string, string>)["componentId"]];
    }
    return m;
  },
  save: (
    projectId: string,
    kraIds: string[],
    objectiveIds: string[],
    strategyIds: string[],
    keyActivityIds: string[],
    expectedOutputIds: string[],
    outputIndicatorIds: string[],
  ): void => {
    const all = load<Record<string, ProjectMapping>>(KEYS.projectMappings, {}) as Record<string, ProjectMapping>;
    all[projectId] = {
      kraIds: kraIds ?? [],
      objectiveIds: objectiveIds ?? [],
      strategyIds: strategyIds ?? [],
      keyActivityIds: keyActivityIds ?? [],
      expectedOutputIds: expectedOutputIds ?? [],
      outputIndicatorIds: outputIndicatorIds ?? [],
      savedAt: fmt(),
    };
    save(KEYS.projectMappings, all);
  },
  clear: (projectId: string): void => {
    const all = load<Record<string, ProjectMapping>>(KEYS.projectMappings, {}) as Record<string, ProjectMapping>;
    delete all[projectId];
    save(KEYS.projectMappings, all);
  },
};

export const deletedProjectsStore = {
  getDeleted: (): string[] => load<string>(KEYS.deletedProjects, []),
  delete: (id: string): void => {
    const ids = load<string>(KEYS.deletedProjects, []);
    if (!ids.includes(id)) save(KEYS.deletedProjects, [...ids, id]);
  },
  restore: (id: string): void => {
    save(KEYS.deletedProjects, load<string>(KEYS.deletedProjects, []).filter((x) => x !== id));
  },
};

export const baselinesStore = {
  getAll: (): Baseline[] => load<Baseline>(KEYS.baselines),
  getById: (id: string): Baseline | null =>
    load<Baseline>(KEYS.baselines).find((b) => b.id === id) ?? null,
  getByIndicator: (outputIndicatorId: string): Baseline | null =>
    load<Baseline>(KEYS.baselines).find((b) => b.outputIndicatorId === outputIndicatorId) ?? null,
  create: (
    outputIndicatorId: string,
    year1: number | null,
    year2: number | null,
    year3: number | null,
    year4: number | null,
    year5: number | null,
  ): Baseline => {
    const items = load<Baseline>(KEYS.baselines);
    const item: Baseline = {
      id: uid(),
      outputIndicatorId,
      year1,
      year2,
      year3,
      year4,
      year5,
      createdAt: fmt(),
    };
    save(KEYS.baselines, [...items, item]);
    return item;
  },
  update: (
    id: string,
    outputIndicatorId: string,
    year1: number | null,
    year2: number | null,
    year3: number | null,
    year4: number | null,
    year5: number | null,
  ): void => {
    const items = load<Baseline>(KEYS.baselines).map((b) =>
      b.id === id ? { ...b, outputIndicatorId, year1, year2, year3, year4, year5 } : b,
    );
    save(KEYS.baselines, items);
  },
  delete: (id: string): void => {
    save(KEYS.baselines, load<Baseline>(KEYS.baselines).filter((b) => b.id !== id));
  },
};

function trackingKey(projectId: string, oiId: string): string {
  return `${projectId}::${oiId}`;
}

export const projectTrackingStore = {
  get: (projectId: string, oiId: string): TrackingEntry[] | null => {
    const all = load<Record<string, ProjectTrackingRecord>>(KEYS.projectTracking, {}) as Record<string, ProjectTrackingRecord>;
    const rec = all[trackingKey(projectId, oiId)];
    return rec?.entries ?? null;
  },
  save: (projectId: string, oiId: string, entries: TrackingEntry[]): void => {
    const all = load<Record<string, ProjectTrackingRecord>>(KEYS.projectTracking, {}) as Record<string, ProjectTrackingRecord>;
    all[trackingKey(projectId, oiId)] = { entries, updatedAt: fmt() };
    save(KEYS.projectTracking, all);
  },
  clearForProject: (projectId: string): void => {
    const all = load<Record<string, ProjectTrackingRecord>>(KEYS.projectTracking, {}) as Record<string, ProjectTrackingRecord>;
    const prefix = `${projectId}::`;
    for (const k of Object.keys(all)) {
      if (k.startsWith(prefix)) delete all[k];
    }
    save(KEYS.projectTracking, all);
  },
};

export const trackingEvidenceStore = {
  save: (evidenceId: string, dataUrl: string): void => {
    try {
      localStorage.setItem(`kalro_tevid_${evidenceId}`, dataUrl);
    } catch {
      // Storage quota exceeded — skip silently
    }
  },
  get: (evidenceId: string): string | null => {
    try {
      return localStorage.getItem(`kalro_tevid_${evidenceId}`);
    } catch {
      return null;
    }
  },
  remove: (evidenceId: string): void => {
    try {
      localStorage.removeItem(`kalro_tevid_${evidenceId}`);
    } catch {
      // ignore
    }
  },
};
