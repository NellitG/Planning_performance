import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronRight, LoaderCircle, Plus, X } from "lucide-react";
import type { StepProps } from "./types";
import { PROJECT_TYPES, PROJECT_STATUSES_WIZARD } from "./data";
import { useEffect, useState } from "react";
import { useManagedUsers, useReferenceData } from "@/hooks/useUserManagementApi";

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
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

export default function Step1Identification({ data, onChange, onNext, isSaving }: StepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { data: users = [] } = useManagedUsers();
  const { data: counties = [] } = useReferenceData();
  const institutes = counties.flatMap((county) => county.institutes);
  const byRole = (role: string) => users.filter((user) => user.active && user.roles.includes(role));
  useEffect(() => {
    if (data.coordinatorUserId) return;
    const defaultCoordinator = byRole("project_coordinator").find((user) => user.fullName.toLowerCase() === "dr. michael okoti");
    if (defaultCoordinator) onChange({ coordinatorUserId: defaultCoordinator.id, coordinator: defaultCoordinator.fullName });
  }, [users]);

  const handleNext = () => {
    const e: Record<string, string> = {};
    if (!data.title.trim()) e.title = "Project title is required";
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
          <Field label="Project Titles" required error={errors.title}>
            <div className="space-y-2">
              {[data.title, ...data.additionalTitles].map((title, index) => (
                <div key={index} className="flex gap-2">
                  <Input value={title} onChange={(e) => {
                    if (index === 0) onChange({ title: e.target.value });
                    else { const titles = [...data.additionalTitles]; titles[index - 1] = e.target.value; onChange({ additionalTitles: titles }); }
                    setErrors((p) => ({ ...p, title: "" }));
                  }} placeholder={index === 0 ? "e.g. Climate-Smart Agriculture Initiative" : "Additional project title"} />
                  {index > 0 && <Button type="button" variant="outline" size="icon" aria-label="Remove project title" onClick={() => onChange({ additionalTitles: data.additionalTitles.filter((_, i) => i !== index - 1) })}><X className="h-4 w-4" /></Button>}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => onChange({ additionalTitles: [...data.additionalTitles, ""] })}><Plus className="h-4 w-4" /> Add project title</Button>
              <p className="text-xs text-muted-foreground">Each title is created as a separate project record with its own workflow.</p>
            </div>
          </Field>
          <Field label="Main Project"><Input value={data.mainProject} onChange={(e) => onChange({ mainProject: e.target.value })} placeholder="Parent/main project" /></Field>
          <Field label="Project Coordinator">
            <select value={data.coordinatorUserId} onChange={(e) => { const user = users.find((x) => x.id === e.target.value); onChange({ coordinatorUserId: e.target.value, coordinator: user?.fullName || "" }); }} className="flex h-9 w-full rounded-md border border-input px-3 py-1 text-sm shadow-sm">
              <option value="">— Select coordinator —</option>{byRole("project_coordinator").map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}
            </select>
          </Field>
          <Field label="Principal Investigator"><select multiple value={data.principalInvestigatorIds} onChange={(e) => onChange({ principalInvestigatorIds: Array.from(e.currentTarget.selectedOptions, x => x.value) })} className="min-h-20 w-full rounded-md border border-input px-3 py-1 text-sm">{byRole("principal_investigator").map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}</select></Field>
          <Field label="Co-Principal Investigator"><select multiple value={data.coPrincipalInvestigatorIds} onChange={(e) => onChange({ coPrincipalInvestigatorIds: Array.from(e.currentTarget.selectedOptions, x => x.value) })} className="min-h-20 w-full rounded-md border border-input px-3 py-1 text-sm">{byRole("co_principal_investigator").map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}</select></Field>
          <Field label="PI / Co-PI Institute"><select multiple value={data.investigatorInstituteIds} onChange={(e) => onChange({ investigatorInstituteIds: Array.from(e.currentTarget.selectedOptions, x => x.value) })} className="min-h-20 w-full rounded-md border border-input px-3 py-1 text-sm">{institutes.map((institute) => <option key={institute.id} value={institute.id}>{institute.name}</option>)}</select></Field>
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
              {PROJECT_STATUSES_WIZARD.map((s) => <option key={s} value={s}>{s}</option>)}
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
