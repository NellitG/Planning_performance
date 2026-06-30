import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Plus, Trash2, MapPin } from "lucide-react";
import type { StepProps, LocationEntry } from "./types";
import { KENYA_COUNTIES } from "./data";

function LocationRow({
  loc,
  index,
  onChange,
  onRemove,
}: {
  loc: LocationEntry;
  index: number;
  onChange: (updates: Partial<LocationEntry>) => void;
  onRemove: () => void;
}) {
  const countyData = KENYA_COUNTIES.find((c) => c.name === loc.county);
  const subCounties = countyData?.subCounties ?? [];
  const subCountyData = subCounties.find((s) => s.name === loc.subCounty);
  const wards = subCountyData?.wards ?? [];

  return (
    <div className="rounded-lg border border-border bg-background p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" /> Location {index + 1}
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">County</Label>
          <select
            value={loc.county}
            onChange={(e) => onChange({ county: e.target.value, subCounty: "", ward: "" })}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">— Select County —</option>
            {KENYA_COUNTIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Sub-County</Label>
          <select
            value={loc.subCounty}
            onChange={(e) => onChange({ subCounty: e.target.value, ward: "" })}
            disabled={!loc.county}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          >
            <option value="">— Select Sub-County —</option>
            {subCounties.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Ward</Label>
          <select
            value={loc.ward}
            onChange={(e) => onChange({ ward: e.target.value })}
            disabled={!loc.subCounty || wards.length === 0}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          >
            <option value="">— Select Ward —</option>
            {wards.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

export default function Step7ProjectLocations({ data, onChange, onNext, onBack }: StepProps) {
  const addLocation = () => {
    onChange({ locations: [...data.locations, { county: "", subCounty: "", ward: "" }] });
  };

  const updateLocation = (index: number, updates: Partial<LocationEntry>) => {
    const locs = data.locations.map((l, i) => (i === index ? { ...l, ...updates } : l));
    onChange({ locations: locs });
  };

  const removeLocation = (index: number) => {
    onChange({ locations: data.locations.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Project Locations</h2>
          <Button type="button" size="sm" onClick={addLocation} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Add Location
          </Button>
        </div>

        {data.locations.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <MapPin className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No locations added yet. Click "Add Location" to add project coverage areas.</p>
          </div>
        )}

        <div className="space-y-3">
          {data.locations.map((loc, i) => (
            <LocationRow
              key={i}
              loc={loc}
              index={i}
              onChange={(updates) => updateLocation(i, updates)}
              onRemove={() => removeLocation(i)}
            />
          ))}
        </div>
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
