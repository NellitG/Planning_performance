import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

export default function Step4TimelineFinance({ data, onChange, onNext, onBack }: StepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNext = () => {
    const e: Record<string, string> = {};
    if (data.startDate && data.expectedEndDate && data.expectedEndDate < data.startDate) {
      e.expectedEndDate = "End date must be after start date";
    }
    if (data.completionRate !== "" && (Number(data.completionRate) < 0 || Number(data.completionRate) > 100)) {
      e.completionRate = "Completion rate must be between 0 and 100";
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
          <Field label="Completion Rate (%)" error={errors.completionRate}>
            <Input
              type="number"
              min="0"
              max="100"
              value={data.completionRate}
              onChange={(e) => { onChange({ completionRate: e.target.value }); setErrors((p) => ({ ...p, completionRate: "" })); }}
              placeholder="0"
            />
          </Field>
          <Field label="Expected Budget (KES)">
            <Input
              type="number"
              min="0"
              value={data.expectedBudget}
              onChange={(e) => onChange({ expectedBudget: e.target.value })}
              placeholder="0.00"
            />
          </Field>
          <Field label="Disbursed Amount (KES)">
            <Input
              type="number"
              min="0"
              value={data.disbursedAmount}
              onChange={(e) => onChange({ disbursedAmount: e.target.value })}
              placeholder="0.00"
            />
          </Field>
          <Field label="Utilized Amount (KES)">
            <Input
              type="number"
              min="0"
              value={data.utilizedAmount}
              onChange={(e) => onChange({ utilizedAmount: e.target.value })}
              placeholder="0.00"
            />
          </Field>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={handleNext} className="bg-primary text-primary-foreground hover:bg-primary/90">
          Save & Continue <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
