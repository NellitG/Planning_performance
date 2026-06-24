import { Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBaselines, useOutputIndicators, useCreateBaseline, useUpdateBaseline } from "@/hooks/useProjectsApi";

interface BaselineFormProps {
  mode?: "create" | "edit";
}

interface YearField {
  key: 1 | 2 | 3 | 4 | 5;
  label: string;
}

const YEAR_FIELDS: YearField[] = [
  { key: 1, label: "Year 1" },
  { key: 2, label: "Year 2" },
  { key: 3, label: "Year 3" },
  { key: 4, label: "Year 4" },
  { key: 5, label: "Year 5" },
];

type YearValues = Record<1 | 2 | 3 | 4 | 5, string>;

function parseYear(val: string): number | null {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

export default function BaselineForm({ mode = "create" }: BaselineFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: indicators = [] } = useOutputIndicators();
  const { data: baselines = [] } = useBaselines();
  const createBaseline = useCreateBaseline();
  const updateBaseline = useUpdateBaseline();
  const [indicatorId, setIndicatorId] = useState("");
  const [indicatorError, setIndicatorError] = useState("");
  const [years, setYears] = useState<YearValues>({ 1: "", 2: "", 3: "", 4: "", 5: "" });

  useEffect(() => {
    if (mode === "edit" && id && baselines.length) {
      const existing = baselines.find((b) => b.id === id);
      if (existing) {
        setIndicatorId(existing.outputIndicatorId);
        setYears({
          1: existing.year1 !== null ? String(existing.year1) : "",
          2: existing.year2 !== null ? String(existing.year2) : "",
          3: existing.year3 !== null ? String(existing.year3) : "",
          4: existing.year4 !== null ? String(existing.year4) : "",
          5: existing.year5 !== null ? String(existing.year5) : "",
        });
      } else {
        toast.error("Baseline not found");
        navigate("/projects/baseline");
      }
    }
  }, [mode, id, baselines, navigate]);

  const updateYear = (key: 1 | 2 | 3 | 4 | 5, val: string) => {
    setYears((y) => ({ ...y, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!indicatorId) {
      setIndicatorError("Please select an Output Indicator");
      toast.error("Please fix the errors before saving");
      return;
    }
    setIndicatorError("");

    const payload = {
      outputIndicatorId: indicatorId,
      year1: parseYear(years[1]),
      year2: parseYear(years[2]),
      year3: parseYear(years[3]),
      year4: parseYear(years[4]),
      year5: parseYear(years[5]),
    };

    try {
      if (mode === "edit" && id) {
        await updateBaseline.mutateAsync({ id, ...payload });
        toast.success("Baseline updated successfully");
      } else {
        await createBaseline.mutateAsync(payload);
        toast.success("Baseline created successfully");
      }
      navigate("/projects/baseline");
    } catch {
      toast.error("Failed to save baseline");
    }
  };

  const hasIndicators = indicators.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Add New Baseline" : "Edit Baseline"}
        description={
          mode === "create"
            ? "Select an Output Indicator and enter baseline values for Years 1–5."
            : "Update the baseline values for this Output Indicator."
        }
        actions={
          <Button asChild variant="outline">
            <Link to="/projects/baseline">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold">Output Indicator</h2>

          {!hasIndicators && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              No Output Indicators available.{" "}
              <Link to="/projects/output-indicators/new" className="underline font-medium">
                Create an Output Indicator
              </Link>{" "}
              first.
            </div>
          )}

          <div className="max-w-xl space-y-1.5">
            <Label>
              Output Indicator <span className="text-red-600">*</span>
            </Label>
            <Select
              value={indicatorId}
              onValueChange={(v) => { setIndicatorId(v); setIndicatorError(""); }}
              disabled={!hasIndicators}
            >
              <SelectTrigger className={indicatorError ? "border-red-400 focus:ring-red-400" : ""}>
                <SelectValue placeholder="Select Output Indicator" />
              </SelectTrigger>
              <SelectContent>
                {indicators.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    <span className="line-clamp-1">{i.text}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {indicatorError && <p className="text-xs text-red-600">{indicatorError}</p>}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-semibold">Baseline Values</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter numeric baseline values for each year. Leave blank if not applicable.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-5 max-w-2xl">
            {YEAR_FIELDS.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label className="text-sm font-medium">{f.label}</Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={years[f.key]}
                  onChange={(e) => updateYear(f.key, e.target.value)}
                  placeholder="—"
                  className="text-center"
                />
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
            These baseline values will be used in Strategy Mapping to validate Target values entered during project planning.
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/projects/baseline")}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!hasIndicators}
          >
            <Save className="h-4 w-4" />
            {mode === "create" ? "Save Baseline" : "Update Baseline"}
          </Button>
        </div>
      </form>
    </div>
  );
}
