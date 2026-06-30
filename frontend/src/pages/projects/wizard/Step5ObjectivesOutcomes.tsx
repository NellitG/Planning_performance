import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { StepProps } from "./types";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

export default function Step5ObjectivesOutcomes({ data, onChange, onNext, onBack }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
        <h2 className="text-base font-semibold">Objectives & Outcomes</h2>
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
        <Field label="Expected Outcomes">
          <Textarea
            rows={4}
            value={data.expectedOutcomes}
            onChange={(e) => onChange({ expectedOutcomes: e.target.value })}
            placeholder="Describe the expected outcomes and impact"
          />
        </Field>
        <Field label="Sustainability">
          <Textarea
            rows={3}
            value={data.sustainability}
            onChange={(e) => onChange({ sustainability: e.target.value })}
            placeholder="How will the project outcomes be sustained after completion?"
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
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext} className="bg-green-700 text-primary-foreground">
          Save & Continue <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
