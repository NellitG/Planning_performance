---
name: Projects module API quirks
description: Non-obvious backend field naming and frontend cache-invalidation rules for the KALRO Projects module migration.
---

# Project mapping serializer field name
The Django `project-mappings` serializer outputs the FK as `project` (a PK **number**), NOT `projectId`. The frontend `apiClient` camelCase transform does not rename `project`. So `useAllMappings()` returns `ProjectMapping & { project: number }`, and consumers must compare with `String(m.project)` against `String(project.id)`.

# React Query: two mapping query keys must invalidate together
There are two distinct mapping queries:
- `qk.mapping(projectId)` — single project's mapping (ProjectDetail, ProjectView)
- `["mappings","all"]` — `useAllMappings()` (Projects list "Active" status, dashboard Overview KPIs)

**Rule:** `useSaveMapping.onSuccess` MUST invalidate BOTH keys.
**Why:** Projects.tsx and Overview.tsx derive Active/mapped counts from the "all" query; invalidating only the per-project key leaves those screens stale until a timed refetch.

# Evidence upload flow in ProjectDetail Step2
Evidence files are staged in a ref keyed `oiId:year` (no evidenceId in key). Save order: `useSaveMapping` -> per-OI `useSaveTracking` (returns rows with ids) -> `useUploadEvidence({trackingId})` matching by year.
**Rule:** when user removes evidence in the UI, delete the `evidenceFilesRef` entry too (via an onEvidenceRemove callback), otherwise the staged file is uploaded anyway on save.
