import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronLeft, ChevronRight, LoaderCircle, MapPin, X } from "lucide-react";
import { api } from "@/utils/apiClient";
import type { StepProps, LocationEntry } from "./types";

type CountyPath = { id: string; name: string };
type Ward = { id: string; name: string };
type SubCounty = { id: string; name: string; wards: Ward[] };
type County = { id: string; name: string; svgId: string; subCounties: SubCounty[] };
const SVG_URL = "http://127.0.0.1:8000/api/kenya-counties/";

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

function countyPaths(root: SVGSVGElement): CountyPath[] {
  return Array.from(root.querySelectorAll<SVGPathElement>("path[id][title], path[id][name]"))
    .map((path) => ({ id: path.id, name: path.getAttribute("title") || path.getAttribute("name") || "" }))
    .filter((county) => county.name);
}

export default function Step7ProjectLocations({ data, onChange, onNext, onBack, isSaving }: StepProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [counties, setCounties] = useState<CountyPath[]>([]);
  const [geography, setGeography] = useState<County[]>([]);
  const [hoveredCounty, setHoveredCounty] = useState<CountyPath | null>(null);
  const [mapError, setMapError] = useState(false);
  const [expandedCounties, setExpandedCounties] = useState<Set<string>>(new Set());
  const [expandedSubCounties, setExpandedSubCounties] = useState<Set<string>>(new Set());
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    api.get<County[]>("/geography/").then(setGeography).catch(() => setValidationError("Geographic data could not be loaded."));
  }, []);

  const selectedCountyIds = new Set(data.locations.map((location) => location.countyId).filter(Boolean));
  const selectedSubCountyIds = new Set(data.locations.map((location) => location.subCountyId).filter(Boolean));
  const selectedWardIds = new Set(data.locations.map((location) => location.wardId).filter(Boolean));

  const countyForPath = (path: CountyPath) => geography.find((county) => normalize(county.name) === normalize(path.name) || county.svgId === path.id);

  useEffect(() => {
    if (geography.length === 0 || data.locations.length === 0) return;
    const normalizedLocations = data.locations.map((location) => {
      const county = geography.find((item) => item.id === location.countyId || normalize(item.name) === normalize(location.county));
      if (!county) return location;
      const subCounty = geography
        .find((item) => item.id === county.id)
        ?.subCounties.find((item) => item.id === location.subCountyId || normalize(item.name) === normalize(location.subCounty));
      const ward = subCounty?.wards.find((item) => item.id === location.wardId || normalize(item.name) === normalize(location.ward));
      return {
        ...location,
        county: county.name,
        countyId: county.id,
        svgId: location.svgId || county.svgId,
        subCounty: subCounty?.name || "",
        subCountyId: subCounty?.id,
        ward: ward?.name || "",
        wardId: ward?.id,
      };
    });
    if (JSON.stringify(normalizedLocations) !== JSON.stringify(data.locations)) {
      onChange({ locations: normalizedLocations });
    }
  }, [geography, data.locations, onChange]);

  const updateLocations = (locations: LocationEntry[]) => {
    setValidationError("");
    onChange({ locations });
  };

  const toggleCounty = (county: County, svgId = county.svgId) => {
    const selected = selectedCountyIds.has(county.id);
    updateLocations(selected
      ? data.locations.filter((location) => location.countyId !== county.id)
      : [...data.locations, { county: county.name, countyId: county.id, svgId, subCounty: "", ward: "" }]);
    setExpandedCounties((current) => new Set(current).add(county.id));
  };

  const toggleSubCounty = (county: County, subCounty: SubCounty) => {
    const selected = selectedSubCountyIds.has(subCounty.id);
    updateLocations(selected
      ? data.locations.filter((location) => location.subCountyId !== subCounty.id)
      : [...data.locations, { county: county.name, countyId: county.id, subCounty: subCounty.name, subCountyId: subCounty.id, ward: "" }]);
    setExpandedSubCounties((current) => new Set(current).add(subCounty.id));
  };

  const toggleWard = (county: County, subCounty: SubCounty, ward: Ward) => {
    const selected = selectedWardIds.has(ward.id);
    updateLocations(selected
      ? data.locations.filter((location) => location.wardId !== ward.id)
      : [...data.locations, { county: county.name, countyId: county.id, subCounty: subCounty.name, subCountyId: subCounty.id, ward: ward.name, wardId: ward.id }]);
  };

  useEffect(() => {
    let active = true;
    fetch(SVG_URL)
      .then((response) => {
        if (!response.ok) throw new Error("Map asset could not be loaded");
        return response.text();
      })
      .then((svg) => {
        if (!active || !mapRef.current) return;
        mapRef.current.innerHTML = svg;
        const root = mapRef.current.querySelector("svg");
        if (!root) throw new Error("Map asset is not an SVG");
        const paths = countyPaths(root);
        setCounties(paths);
        root.querySelectorAll<SVGPathElement>("path[id][title], path[id][name]").forEach((path) => path.classList.add("ppm-county-path"));
      })
      .catch(() => active && setMapError(true));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const root = mapRef.current?.querySelector("svg");
    if (!root) return;
    const onClick = (event: Event) => {
      const path = (event.target as Element).closest<SVGPathElement>("path[id][title], path[id][name]");
      if (!path) return;
      const countyPath = { id: path.id, name: path.getAttribute("title") || path.getAttribute("name") || "" };
      const county = countyForPath(countyPath);
      if (county) toggleCounty(county, countyPath.id);
    };
    const onOver = (event: Event) => {
      const path = (event.target as Element).closest<SVGPathElement>("path[id][title], path[id][name]");
      if (path) setHoveredCounty({ id: path.id, name: path.getAttribute("title") || path.getAttribute("name") || "" });
    };
    const onOut = (event: MouseEvent) => {
      const nextTarget = event.relatedTarget instanceof Element ? event.relatedTarget.closest<SVGPathElement>("path[id][title], path[id][name]") : null;
      if (!nextTarget) {
        setHoveredCounty(null);
      }
    };
    root.addEventListener("click", onClick);
    root.addEventListener("mouseover", onOver);
    root.addEventListener("mouseout", onOut);
    return () => {
      root.removeEventListener("click", onClick);
      root.removeEventListener("mouseover", onOver);
      root.removeEventListener("mouseout", onOut);
    };
  }, [data.locations, onChange, geography]);

  useEffect(() => {
    const root = mapRef.current?.querySelector("svg");
    if (!root) return;
    root.querySelectorAll<SVGPathElement>("path[id][title], path[id][name]").forEach((path) => {
      const county = countyForPath({ id: path.id, name: path.getAttribute("title") || path.getAttribute("name") || "" });
      path.classList.toggle("ppm-county-selected", !!county && selectedCountyIds.has(county.id));
    });
  }, [data.locations, counties, geography]);

  const removeLocation = (county: County) => updateLocations(data.locations.filter((location) => location.countyId !== county.id));
  const handleNext = () => {
    if (selectedCountyIds.size === 0) {
      setValidationError("Select at least one county before continuing.");
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div><h2 className="text-base font-semibold">Project Locations</h2><p className="mt-1 text-sm text-muted-foreground">Select counties on the map, then refine them by sub-county and ward.</p></div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)]">
          <div className="relative min-h-[420px] rounded-lg border border-border bg-emerald-50/40 p-3">
            <div ref={mapRef} className="ppm-kenya-map h-full min-h-[390px] w-full" aria-label="Interactive Kenya county map" />
            {hoveredCounty && <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow-lg">{hoveredCounty.name}</div>}
            {mapError && <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-red-700">The Kenya county map could not be loaded. Please refresh and try again.</p>}
          </div>
          <aside className="rounded-lg border border-border bg-background p-4">
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3"><h3 className="font-semibold">Selected Locations</h3><span className="text-xs text-muted-foreground">{data.locations.length} selected</span></div>
            {geography.length === 0 ? <div className="py-10 text-center text-sm text-muted-foreground"><MapPin className="mx-auto mb-2 h-7 w-7 opacity-40" />Loading counties...</div> : <div className="max-h-[520px] overflow-y-auto pr-1">{geography.map((county) => {
              const countySelected = selectedCountyIds.has(county.id);
              const countyExpanded = expandedCounties.has(county.id) || countySelected;
              return <div key={county.id} className="border-b border-border py-2 last:border-0">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox checked={countySelected} onCheckedChange={() => toggleCounty(county)} aria-label={`Select ${county.name}`} />
                  <button type="button" className="flex min-w-0 flex-1 items-center gap-1 text-left" onClick={() => setExpandedCounties((current) => { const next = new Set(current); next.has(county.id) ? next.delete(county.id) : next.add(county.id); return next; })}>
                    <span className="truncate">{county.name}</span><ChevronDown className={`h-3.5 w-3.5 transition-transform ${countyExpanded ? "rotate-180" : ""}`} />
                  </button>
                  {countySelected && <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${county.name}`} onClick={() => removeLocation(county)}><X className="h-4 w-4" /></Button>}
                </div>
                {countySelected && countyExpanded && <div className="ml-6 mt-1 space-y-1 border-l border-emerald-200 pl-3">{county.subCounties.map((subCounty) => {
                  const subSelected = selectedSubCountyIds.has(subCounty.id);
                  const subExpanded = expandedSubCounties.has(subCounty.id) || subSelected;
                  return <div key={subCounty.id}>
                    <div className="flex items-center gap-2 py-1 text-sm">
                      <Checkbox checked={subSelected} onCheckedChange={() => toggleSubCounty(county, subCounty)} aria-label={`Select ${subCounty.name}`} />
                      <button type="button" className="flex items-center gap-1 text-left" onClick={() => setExpandedSubCounties((current) => { const next = new Set(current); next.has(subCounty.id) ? next.delete(subCounty.id) : next.add(subCounty.id); return next; })}>{subCounty.name}<ChevronDown className={`h-3.5 w-3.5 ${subExpanded ? "rotate-180" : ""}`} /></button>
                    </div>
                    {subSelected && subExpanded && <div className="ml-6 space-y-1 border-l border-emerald-100 pl-3">{subCounty.wards.map((ward) => <label key={ward.id} className="flex items-center gap-2 py-1 text-xs text-muted-foreground"><Checkbox checked={selectedWardIds.has(ward.id)} onCheckedChange={() => toggleWard(county, subCounty, ward)} />{ward.name}</label>)}</div>}
                  </div>;
                })}</div>}
              </div>;
            })}</div>}
            {validationError && <p className="mt-3 text-xs font-medium text-red-700">{validationError}</p>}
            {counties.length > 0 && <p className="mt-4 text-xs text-muted-foreground">{counties.length} counties available</p>}
          </aside>
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
