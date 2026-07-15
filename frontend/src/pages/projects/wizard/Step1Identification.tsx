import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronRight, LoaderCircle } from "lucide-react";
import type { StepProps } from "./types";
import { PROJECT_TYPES, PROJECT_STATUSES_WIZARD } from "./data";
import { useState } from "react";

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
          <Field label="Project Title" required error={errors.title}>
            <Input
              value={data.title}
              onChange={(e) => { onChange({ title: e.target.value }); setErrors((p) => ({ ...p, title: "" })); }}
              placeholder="e.g. Climate-Smart Agriculture Initiative"
            />
          </Field>
          <Field label="Project Coordinator">
            <Input
              value={data.coordinator}
              onChange={(e) => onChange({ coordinator: e.target.value })}
              placeholder="Full name"
            />
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
