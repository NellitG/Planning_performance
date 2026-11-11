import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronRight, LoaderCircle, Plus, X } from "lucide-react";
import type { StepProps } from "./types";
import { PROJECT_TYPES, PROJECT_STATUSES_WIZARD } from "./data";
import { useEffect, useState } from "react";
import {
  useManagedUsers,
  useReferenceData,
  useValueChainLeads,
} from "@/hooks/useUserManagementApi";
import { useMainProjects } from "@/hooks/useProjectsApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function Field({ label, error, required, children }:
  { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function Step1Identification({ data, onChange, onNext, isSaving, allowAdditionalTitles = true }: StepProps & { allowAdditionalTitles?: boolean }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { data: users = [] } = useManagedUsers();
  const {
    data: valueChainLeads = [],
    isLoading: isLoadingValueChainLeads,
    isError: hasValueChainLeadError,
    error: valueChainLeadError,
  } = useValueChainLeads();
  const { data: counties = [] } = useReferenceData();
  const { data: mainProjects = [], isLoading: isLoadingMainProjects, isError: mainProjectsError } = useMainProjects();
  const implementedMainProjects = mainProjects.filter((project) => project.implementationComplete);
  const institutes = counties.flatMap((county) => county.institutes);
  const coordinators = users.filter((user) => user.active && user.roles.includes("project_coordinator"));

  useEffect(() => {
    if (data.coordinatorUserId) return;
    const defaultCoordinator = coordinators.find((user) => user.fullName.toLowerCase() === "dr. michael okoti");
    if (defaultCoordinator) onChange({ coordinatorUserId: defaultCoordinator.id, coordinator: defaultCoordinator.fullName });
  }, [coordinators, data.coordinatorUserId, onChange]);

  const handleNext = () => {
    const e: Record<string, string> = {};
    if (!data.title.trim()) e.title = "Project title is required";
    if (!data.mainProjectId || !data.mainProject.trim()) e.mainProject = "Select an implemented Main Project";
    if (!data.projectType) e.projectType = "Please select a project type";
    if (!data.status) e.status = "Please select a status";
    setErrors(e);
    if (Object.keys(e).length === 0) onNext();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border p-6 shadow-sm space-y-5">
        <h2 className="text-base font-semibold text-foreground">Identification</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Main Project" required error={errors.mainProject}>
            <select
              disabled={!allowAdditionalTitles || isLoadingMainProjects || mainProjectsError}
              value={data.mainProjectId || ""}
              onChange={(event) => {
                const parent = implementedMainProjects.find((project) => project.id === event.target.value);
                onChange({ mainProjectId: parent?.id || null, mainProject: parent?.name || "" });
                setErrors((previous) => ({ ...previous, mainProject: "" }));
              }}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                {isLoadingMainProjects ? "Loading Main Projects…" : "— Select implemented Main Project —"}
              </option>
              {implementedMainProjects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            {mainProjectsError && <p className="text-xs text-red-600">Main Projects could not be loaded. Refresh and try again.</p>}
            {!isLoadingMainProjects && !mainProjectsError && implementedMainProjects.length === 0 && (
              <p className="text-xs text-muted-foreground">Complete a Main Project implementation before registering Project Titles.</p>
            )}
          </Field>
          <Field label="Project Titles" required error={errors.title}>
            <div className="space-y-2">
              {[data.title, ...data.additionalTitles].map((title, index) => (
                <div key={index} className="flex gap-2">
                  <Input value={title} onChange={(e) => {
                    if (index === 0) onChange({ title: e.target.value });
                    else { const titles = [...data.additionalTitles]; titles[index - 1] = e.target.value; onChange({ additionalTitles: titles }); }
                    setErrors((p) => ({ ...p, title: "" }));
                  }} placeholder={index === 0 ? "e.g. Climate-Smart Agriculture Initiative" : "Additional project title"} />
                  {allowAdditionalTitles && index > 0 && <Button type="button" variant="outline" size="icon" aria-label="Remove project title"
                    onClick={() => onChange({ additionalTitles: data.additionalTitles.filter((_, i) => i !== index - 1) })}>
                    <X className="h-4 w-4" />
                  </Button>}
                </div>
              ))}
              {allowAdditionalTitles && <><Button type="button" variant="outline" size="sm" className="gap-1.5"
                onClick={() => onChange({ additionalTitles: [...data.additionalTitles, ""] })}>
                <Plus className="h-4 w-4" /> Add project title</Button></>}
            </div>
          </Field>
          <Field label="Project Coordinator">
            <select value={data.coordinatorUserId} onChange={(e) => {
              const user = users.find((x) => x.id === e.target.value);
              onChange({ coordinatorUserId: e.target.value, coordinator: user?.fullName || "" });
            }}
              className="flex h-9 w-full rounded-md border border-input px-3 py-1 text-sm shadow-sm">
              <option value="">— Select coordinator —</option>{coordinators.map((user) =>
                <option key={user.id} value={user.id}>{user.fullName}</option>)}
            </select>
          </Field>
          <Field
            label="Value Chain Lead"
            error={hasValueChainLeadError
              ? valueChainLeadError instanceof Error
                ? valueChainLeadError.message
                : "Unable to load Value Chain Leads."
              : undefined}
          >
            <select
              multiple
              value={data.valueChainLeadIds}
              disabled={isLoadingValueChainLeads || hasValueChainLeadError}
              onChange={(e) => onChange({
                valueChainLeadIds: Array.from(e.currentTarget.selectedOptions, (option) => option.value),
              })}
              className="min-h-20 w-full rounded-md border border-input px-3 py-1 text-sm"
              aria-label="Value Chain Lead"
            >
              {isLoadingValueChainLeads && <option disabled>Loading Value Chain Leads...</option>}
              {!isLoadingValueChainLeads && !hasValueChainLeadError && valueChainLeads.length === 0 && (
                <option disabled>No Value Chain Leads available</option>
              )}
              {valueChainLeads.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName} ({user.email})
                </option>
              ))}
            </select>
            {/* <p className="text-xs text-muted-foreground">
              Select one or more Value Chain Leads. Use Ctrl or Command to select multiple.
            </p> */}
          </Field>
          <Field label="Principal Investigator">
            <select multiple value={data.principalInvestigatorIds} onChange={(e) => onChange({ principalInvestigatorIds: Array.from(e.currentTarget.selectedOptions, x => x.value) })}
              className="min-h-20 w-full rounded-md border border-input px-3 py-1 text-sm">{users.map((user) =>
                <option key={user.id} value={user.id}>{user.fullName}</option>)}
            </select>
          </Field>
          <Field label="Co-Principal Investigator">
            <select multiple value={data.coPrincipalInvestigatorIds} onChange={(e) => onChange({ coPrincipalInvestigatorIds: Array.from(e.currentTarget.selectedOptions, x => x.value) })}
              className="min-h-20 w-full rounded-md border border-input px-3 py-1 text-sm">{users.map((user) =>
                <option key={user.id} value={user.id}>{user.fullName}</option>)}
            </select>
          </Field>
          <Field label="PI / Co-PI Institute"><select multiple value={data.investigatorInstituteIds} onChange={(e) => onChange({ investigatorInstituteIds: Array.from(e.currentTarget.selectedOptions, x => x.value) })}
            className="min-h-20 w-full rounded-md border border-input px-3 py-1 text-sm">{institutes.map((institute) =>
              <option key={institute.id} value={institute.id}>{institute.name}</option>)}
          </select>
          </Field>
          <Field label="Project Type" required error={errors.projectType}>
            <select
              value={data.projectType}
              onChange={(e) => { onChange({ projectType: e.target.value }); setErrors((p) => ({ ...p, projectType: "" })); }}
              className="flex h-9 w-full rounded-md border border-input px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">— Select Project Type —</option>
              {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Project Status" required error={errors.status}>
            <select
              value={data.status}
              onChange={(e) => { onChange({ status: e.target.value }); setErrors((p) => ({ ...p, status: "" })); }}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="">— Select Status —</option>
              {PROJECT_STATUSES_WIZARD.map((s) =>
                <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Project Description">
          <Textarea
            rows={4}
            value={data.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Brief project overview, objectives and scope"
          />
        </Field>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext} disabled={isSaving} className="bg-green-700 text-primary-foreground">
          {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" />}
          {isSaving ? "Saving..." : "Save & Continue"} <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
