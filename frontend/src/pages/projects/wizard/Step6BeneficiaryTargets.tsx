import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { useState } from "react";
import type { StepProps } from "./types";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  );
}

export default function Step6BeneficiaryTargets({ data, onChange, onNext, onBack }: StepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const total = Number(data.totalBeneficiaries) || 0;

  const validate = () => {
    const e: Record<string, string> = {};
    if (total > 0) {
      if (data.women !== "" && Number(data.women) > total) e.women = "Cannot exceed Total Beneficiaries";
      if (data.youth !== "" && Number(data.youth) > total) e.youth = "Cannot exceed Total Beneficiaries";
      if (data.vmgs !== "" && Number(data.vmgs) > total) e.vmgs = "Cannot exceed Total Beneficiaries";
      if (data.pwds !== "" && Number(data.pwds) > total) e.pwds = "Cannot exceed Total Beneficiaries";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  const numericField = (key: keyof typeof data, val: string) => {
    onChange({ [key]: val });
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
        <h2 className="text-base font-semibold">Beneficiary Targets</h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
          <Field label="Total Beneficiaries">
            <Input
              type="number"
              min="0"
              value={data.totalBeneficiaries}
              onChange={(e) => numericField("totalBeneficiaries", e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Women" error={errors.women}>
            <Input
              type="number"
              min="0"
              value={data.women}
              onChange={(e) => numericField("women", e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Youth" error={errors.youth}>
            <Input
              type="number"
              min="0"
              value={data.youth}
              onChange={(e) => numericField("youth", e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="VMGs (Vulnerable & Marginalised Groups)" error={errors.vmgs}>
            <Input
              type="number"
              min="0"
              value={data.vmgs}
              onChange={(e) => numericField("vmgs", e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="PWDs (Persons with Disabilities)" error={errors.pwds}>
            <Input
              type="number"
              min="0"
              value={data.pwds}
              onChange={(e) => numericField("pwds", e.target.value)}
              placeholder="0"
            />
          </Field>
        </div>

        {total > 0 && (
          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            Sub-group totals may overlap (a beneficiary can be both a woman and a youth). Each sub-group must not individually exceed the total of <strong>{total.toLocaleString()}</strong>.
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={handleNext} className="bg-green-700 text-primary-foreground">
          Save & Continue <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
