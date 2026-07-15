import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import type { StepProps } from "./types";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

export default function Step5ObjectivesOutcomes({ data, onChange, onNext, onBack, isSaving }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
        <h2 className="text-base font-semibold">Project Objectives</h2>
        <Field label="Background">
          <Textarea
            rows={4}
            value={data.background}
            onChange={(e) => onChange({ background: e.target.value })}
            placeholder="Describe the background and context of this project"
          />
        </Field>
        <Field label="Objectives">
          <Textarea
            rows={4}
            value={data.objectives}
            onChange={(e) => onChange({ objectives: e.target.value })}
            placeholder="List the main objectives of this project"
          />
        </Field>
        <Field label="Expected Outputs">
          <Textarea
            rows={4}
            value={data.expectedOutputs}
            onChange={(e) => onChange({ expectedOutputs: e.target.value })}
            placeholder="Describe the expected outputs and impact"
          />
        </Field>
        <Field label="Collaborators">
          <Textarea
            rows={3}
            value={data.collaborators}
            onChange={(e) => onChange({ collaborators: e.target.value })}
            placeholder="List partner organizations and collaborators"
          />
        </Field>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isSaving}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext} disabled={isSaving} className="bg-green-700 text-primary-foreground">
          {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" />}
          {isSaving ? "Saving..." : "Save & Continue"} <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
