import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { StepProps } from "./types";
import { useValueChains } from "@/hooks/useUserManagementApi";
import {
  PROJECT_COORDINATION_OPTIONS,
  KALRO_INSTITUTES,
  KALRO_CENTRES,
  KALRO_SUB_CENTRES,
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

export default function Step2ImplementationUnit({ data, onChange, onNext, onBack, isSaving }: StepProps) {
  const iu = data.implementationUnits;
  const { data: valueChains = [], isLoading, isError } = useValueChains();
  const activeValueChains = valueChains.filter((vc) => vc.active);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Re-open categories that contain values already saved on an existing project.
  useEffect(() => {
    if (valueChains.length === 0 || data.valueChains.length === 0) return;

    const categoriesWithSelections = valueChains
      .filter((vc) => data.valueChains.includes(vc.name) && (vc.category === "Crops" || vc.category === "Livestock"))
      .map((vc) => vc.category);

    if (categoriesWithSelections.length > 0) {
      setSelectedCategories((current) => [...new Set([...current, ...categoriesWithSelections])]);
    }
  }, [data.valueChains, valueChains]);

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

  const toggleCategory = (category: "Crops" | "Livestock", checked: boolean) => {
    setSelectedCategories((current) =>
      checked ? [...new Set([...current, category])] : current.filter((item) => item !== category),
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
        <h2 className="text-base font-semibold">Project Implementation Centres</h2>

        <div className="space-y-4">
          <div className="space-y-3">
            <Checkbox
              checked={iu.headquarters}
              onChange={(v) => updateIU({ headquarters: v, coordination: v ? iu.coordination : "", coordinationOther: v ? iu.coordinationOther : "" })}
              label="Headquarters"
            />
            {iu.headquarters && (
              <div className="ml-6 max-w-sm space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Project Coordination</Label>
                  <Select
                    value={iu.coordination}
                    onChange={(v) => updateIU({ coordination: v, coordinationOther: v === "Other" ? iu.coordinationOther : "" })}
                    options={PROJECT_COORDINATION_OPTIONS}
                    placeholder="Select Project Coordination"
                  />
                </div>
                {iu.coordination === "Other" && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Specify Project Coordination</Label>
                    <Input
                      value={iu.coordinationOther}
                      onChange={(e) => updateIU({ coordinationOther: e.target.value })}
                      placeholder="Enter project coordination"
                    />
                  </div>
                )}
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
        </div>

        <hr className="border-border" />

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Value Chain Category</h3>
          <p className="text-xs text-muted-foreground">Choose a category to see its available value chains.</p>
          {isLoading && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Loading value chains...
            </p>
          )}
          {isError && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              Unable to load value chains. Please try again before continuing.
            </p>
          )}
          {!isLoading && !isError && activeValueChains.length === 0 && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              No active value chains are configured in User Management.
            </p>
          )}
          {!isLoading && !isError && activeValueChains.length > 0 && (
            <>
              <div className="flex flex-wrap gap-4 rounded-lg border border-border bg-muted/20 p-3">
                {(["Crops", "Livestock"] as const).map((category) => (
                  <Checkbox
                    key={category}
                    checked={selectedCategories.includes(category)}
                    onChange={(checked) => toggleCategory(category, checked)}
                    label={category}
                  />
                ))}
              </div>

              {(["Crops", "Livestock"] as const).map((category) => {
                if (!selectedCategories.includes(category)) return null;
                const categoryValueChains = activeValueChains.filter((vc) => vc.category === category);

                return (
                  <div key={category} className="space-y-2 rounded-lg border border-border p-3">
                    <h4 className="text-sm font-semibold text-primary">{category} Value Chains</h4>
                    {categoryValueChains.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                        {categoryValueChains.map((vc) => (
                          <label key={vc.id} className="flex items-center gap-2 cursor-pointer select-none rounded-lg border border-border p-2 hover:bg-accent transition-colors">
                            <input
                              type="checkbox"
                              checked={data.valueChains.includes(vc.name)}
                              onChange={() => toggleValueChain(vc.name)}
                              className="h-4 w-4 rounded border-gray-300 text-primary"
                            />
                            <span className="text-sm">{vc.name}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No active {category.toLowerCase()} value chains are configured.</p>
                    )}
                  </div>
                );
              })}
            </>
          )}
          {data.valueChains.length > 0 && (
            <p className="text-xs text-primary font-medium">{data.valueChains.length} value chain(s) selected</p>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext} disabled={isSaving} className="bg-green-700 text-primary-foreground ">
          {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" />}
          {isSaving ? "Saving..." : "Save & Continue"} <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
