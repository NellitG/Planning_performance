import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { StepProps } from "./types";
import {
  KALRO_DIRECTORATES,
  KALRO_INSTITUTES,
  KALRO_CENTRES,
  KALRO_SUB_CENTRES,
  VALUE_CHAINS,
} from "./data";

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
      />
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
}

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <option value="">— {placeholder} —</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export default function Step2ImplementationUnit({ data, onChange, onNext, onBack }: StepProps) {
  const iu = data.implementationUnits;

  const updateIU = (updates: Partial<typeof iu>) => {
    onChange({ implementationUnits: { ...iu, ...updates } });
  };

  const centresForInstitute = iu.instituteName ? (KALRO_CENTRES[iu.instituteName] ?? []) : [];
  const subCentresForCentre = iu.centre ? (KALRO_SUB_CENTRES[iu.centre] ?? []) : [];

  const toggleValueChain = (vc: string) => {
    const current = data.valueChains;
    if (current.includes(vc)) {
      onChange({ valueChains: current.filter((v) => v !== vc) });
    } else {
      onChange({ valueChains: [...current, vc] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
        <h2 className="text-base font-semibold">Implementation Unit</h2>

        <div className="space-y-4">
          <div className="space-y-3">
            <Checkbox
              checked={iu.headquarters}
              onChange={(v) => updateIU({ headquarters: v, directorate: v ? iu.directorate : "" })}
              label="Headquarters"
            />
            {iu.headquarters && (
              <div className="ml-6 max-w-sm">
                <Label className="text-xs text-muted-foreground mb-1.5 block">Directorate</Label>
                <Select
                  value={iu.directorate}
                  onChange={(v) => updateIU({ directorate: v })}
                  options={KALRO_DIRECTORATES}
                  placeholder="Select Directorate"
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Checkbox
              checked={iu.institute}
              onChange={(v) => updateIU({ institute: v, instituteName: v ? iu.instituteName : "", centre: "", subCentre: "" })}
              label="Institute"
            />
            {iu.institute && (
              <div className="ml-6 space-y-3 max-w-sm">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Institute</Label>
                  <Select
                    value={iu.instituteName}
                    onChange={(v) => updateIU({ instituteName: v, centre: "", subCentre: "" })}
                    options={KALRO_INSTITUTES}
                    placeholder="Select Institute"
                  />
                </div>
                {iu.instituteName && centresForInstitute.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Centre</Label>
                    <Select
                      value={iu.centre}
                      onChange={(v) => updateIU({ centre: v, subCentre: "" })}
                      options={centresForInstitute}
                      placeholder="Select Centre"
                    />
                  </div>
                )}
                {iu.centre && subCentresForCentre.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Sub-Centre</Label>
                    <Select
                      value={iu.subCentre}
                      onChange={(v) => updateIU({ subCentre: v })}
                      options={subCentresForCentre}
                      placeholder="Select Sub-Centre"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <Checkbox
            checked={iu.kalroSeeds}
            onChange={(v) => updateIU({ kalroSeeds: v })}
            label="KALRO Seeds"
          />
        </div>

        <hr className="border-border" />

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Value Chain</h3>
          <p className="text-xs text-muted-foreground">Select all value chains relevant to this project.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {VALUE_CHAINS.map((vc) => (
              <label key={vc} className="flex items-center gap-2 cursor-pointer select-none rounded-lg border border-border p-2 hover:bg-accent transition-colors">
                <input
                  type="checkbox"
                  checked={data.valueChains.includes(vc)}
                  onChange={() => toggleValueChain(vc)}
                  className="h-4 w-4 rounded border-gray-300 text-primary"
                />
                <span className="text-sm">{vc}</span>
              </label>
            ))}
          </div>
          {data.valueChains.length > 0 && (
            <p className="text-xs text-primary font-medium">{data.valueChains.length} value chain(s) selected</p>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext} className="bg-primary text-primary-foreground hover:bg-primary/90">
          Save & Continue <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
