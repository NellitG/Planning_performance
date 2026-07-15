import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { useState } from "react";
import type { StepProps } from "./types";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function Step4TimelineFinance({ data, onChange, onNext, onBack, isSaving }: StepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNext = () => {
    const e: Record<string, string> = {};
    if (data.startDate && data.expectedEndDate && data.expectedEndDate < data.startDate) {
      e.expectedEndDate = "End date must be after start date";
    }
    setErrors(e);
    if (Object.keys(e).length === 0) onNext();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
        <h2 className="text-base font-semibold">Timeline & Finance</h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Start Date">
            <Input
              type="date"
              value={data.startDate}
              onChange={(e) => onChange({ startDate: e.target.value })}
            />
          </Field>
          <Field label="Expected End Date" error={errors.expectedEndDate}>
            <Input
              type="date"
              value={data.expectedEndDate}
              onChange={(e) => { onChange({ expectedEndDate: e.target.value }); setErrors((p) => ({ ...p, expectedEndDate: "" })); }}
            />
          </Field>
          <Field label="Budget (KES)">
            <Input
              type="number"
              min="0"
              value={data.budget}
              onChange={(e) => onChange({ budget: e.target.value })}
              placeholder="0.00"
            />
          </Field>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isSaving}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={handleNext} disabled={isSaving} className="bg-green-700 text-primary-foreground">
          {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" />}
          {isSaving ? "Saving..." : "Save & Continue"} <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
