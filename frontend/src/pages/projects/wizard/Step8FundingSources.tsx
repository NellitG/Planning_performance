import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, LoaderCircle, Plus, Trash2, Banknote } from "lucide-react";
import type { StepProps, FundingSourceEntry } from "./types";
import { FUNDING_AGENCIES, FUNDING_TYPES } from "./data";

function FundingRow({
  source,
  index,
  onChange,
  onRemove,
}: {
  source: FundingSourceEntry;
  index: number;
  onChange: (updates: Partial<FundingSourceEntry>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          <Banknote className="h-3.5 w-3.5" /> Funding Source {index + 1}
        </span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 px-2"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Source Name</Label>
          <Input
            value={source.sourceName}
            onChange={(e) => onChange({ sourceName: e.target.value })}
            placeholder="e.g. USAID Grant 2025"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Funding Agency</Label>
          <select
            value={source.fundingAgency}
            onChange={(e) => onChange({ fundingAgency: e.target.value, fundingAgencyOther: e.target.value === "Other" ? source.fundingAgencyOther : "" })}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">— Select Funding Agency —</option>
            {FUNDING_AGENCIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {source.fundingAgency === "Other" && (
          <div className="space-y-1.5">
            <Label className="text-xs">Specify Funding Agency</Label>
            <Input
              value={source.fundingAgencyOther}
              onChange={(e) => onChange({ fundingAgencyOther: e.target.value })}
              placeholder="Enter funding agency"
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label className="text-xs">Type</Label>
          <select
            value={source.type}
            onChange={(e) => onChange({ type: e.target.value })}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">— Select Type —</option>
            {FUNDING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Amount (KES)</Label>
          <Input
            type="number"
            min="0"
            value={source.amount}
            onChange={(e) => onChange({ amount: e.target.value })}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Disbursed (KES)</Label>
          <Input
            type="number"
            min="0"
            value={source.disbursed}
            onChange={(e) => onChange({ disbursed: e.target.value })}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Utilized (KES)</Label>
          <Input
            type="number"
            min="0"
            value={source.utilized}
            onChange={(e) => onChange({ utilized: e.target.value })}
            placeholder="0.00"
          />
        </div>
      </div>
    </div>
  );
}

export default function Step8FundingSources({ data, onChange, onNext, onBack, isSaving }: StepProps) {
  const addSource = () => {
    onChange({
      fundingSources: [
        ...data.fundingSources,
        { sourceName: "", fundingAgency: "", fundingAgencyOther: "", type: "", amount: "", disbursed: "", utilized: "" },
      ],
    });
  };

  const updateSource = (index: number, updates: Partial<FundingSourceEntry>) => {
    const sources = data.fundingSources.map((s, i) => (i === index ? { ...s, ...updates } : s));
    onChange({ fundingSources: sources });
  };

  const removeSource = (index: number) => {
    onChange({ fundingSources: data.fundingSources.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Funding Sources</h2>
          <Button type="button" size="sm" onClick={addSource} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Add Funding Source
          </Button>
        </div>

        {data.fundingSources.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <Banknote className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No funding sources added yet. Click "Add Funding Source" to begin.</p>
          </div>
        )}

        <div className="space-y-3">
          {data.fundingSources.map((source, i) => (
            <FundingRow
              key={i}
              source={source}
              index={i}
              onChange={(updates) => updateSource(i, updates)}
              onRemove={() => removeSource(i)}
            />
          ))}
        </div>
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
