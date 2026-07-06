import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useComponents, useCreateOutcome, useOutcomes, useUpdateOutcome } from "@/hooks/useProjectsApi";

interface IndicatorRow {
  _key: string;
  text: string;
  baselineValue: string;
  midtermTarget: string;
  endtermTarget: string;
  error: string;
}

interface OutcomeRow {
  _key: string;
  text: string;
  error: string;
  indicators: IndicatorRow[];
}

interface OutcomeFormProps {
  mode?: "create" | "edit";
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function createIndicatorRow(): IndicatorRow {
  return { _key: uid(), text: "", baselineValue: "", midtermTarget: "", endtermTarget: "", error: "" };
}

export default function OutcomeForm({ mode = "create" }: OutcomeFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: kras = [] } = useComponents();
  const { data: outcomes = [] } = useOutcomes();
  const createOutcome = useCreateOutcome();
  const updateOutcome = useUpdateOutcome();

  const [kraId, setKraId] = useState("");
  const [kraError, setKraError] = useState("");
  const [outcomeRows, setOutcomeRows] = useState<OutcomeRow[]>([{ _key: uid(), text: "", error: "", indicators: [createIndicatorRow()] }]);

  useEffect(() => {
    if (mode === "edit" && id && outcomes.length) {
      const item = outcomes.find((o) => o.id === id);
      if (item) {
        setKraId(item.kraId);
        setOutcomeRows([
          {
            _key: uid(),
            text: item.text,
            error: "",
            indicators: (item.indicators || []).map((indicator) => ({
              _key: uid(),
              text: indicator.text,
              baselineValue: indicator.baselineValue,
              midtermTarget: indicator.midtermTarget,
              endtermTarget: indicator.endtermTarget,
              error: "",
            })),
          },
        ]);
      } else {
        toast.error("Outcome not found");
        navigate("/projects/outcomes");
      }
    }
  }, [mode, id, outcomes, navigate]);

  const updateOutcomeText = (key: string, value: string) => {
    setOutcomeRows((current) => current.map((row) => (row._key === key ? { ...row, text: value, error: "" } : row)));
  };

  const addOutcomeRow = () => setOutcomeRows((current) => [...current, { _key: uid(), text: "", error: "", indicators: [createIndicatorRow()] }]);
  const removeOutcomeRow = (key: string) => {
    if (outcomeRows.length > 1) {
      setOutcomeRows((current) => current.filter((row) => row._key !== key));
    }
  };

  const addIndicatorRow = (outcomeKey: string) => {
    setOutcomeRows((current) => current.map((row) => (row._key === outcomeKey ? { ...row, indicators: [...row.indicators, createIndicatorRow()] } : row)));
  };

  const removeIndicatorRow = (outcomeKey: string, indicatorKey: string) => {
    setOutcomeRows((current) => current.map((row) => {
      if (row._key !== outcomeKey) return row;
      if (row.indicators.length > 1) {
        return { ...row, indicators: row.indicators.filter((indicator) => indicator._key !== indicatorKey) };
      }
      return row;
    }));
  };

  const updateIndicatorValue = (outcomeKey: string, indicatorKey: string, field: keyof IndicatorRow, value: string) => {
    setOutcomeRows((current) => current.map((row) => {
      if (row._key !== outcomeKey) return row;
      return {
        ...row,
        indicators: row.indicators.map((indicator) => (indicator._key === indicatorKey ? { ...indicator, [field]: value, error: "" } : indicator)),
      };
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let valid = true;
    if (!kraId) {
      setKraError("Please select a Key Result Area");
      valid = false;
    }

    const validatedOutcomes = outcomeRows.map((row) => ({
      ...row,
      error: row.text.trim() ? "" : "Outcome text is required",
      indicators: row.indicators.map((indicator) => ({
        ...indicator,
        error: indicator.text.trim() && indicator.baselineValue !== "" && indicator.midtermTarget !== "" && indicator.endtermTarget !== ""
          ? ""
          : "Please complete the indicator row",
      })),
    }));
    setOutcomeRows(validatedOutcomes);

    if (validatedOutcomes.some((row) => row.error || row.indicators.some((indicator) => indicator.error))) {
      valid = false;
    }

    if (!valid) {
      toast.error("Please fix the errors before saving");
      return;
    }

    try {
      if (mode === "edit") {
        const [row] = validatedOutcomes;
        await updateOutcome.mutateAsync({
          id: id!,
          kraId,
          text: row.text.trim(),
          indicators: row.indicators.map((indicator) => ({
            text: indicator.text.trim(),
            baselineValue: indicator.baselineValue,
            midtermTarget: indicator.midtermTarget,
            endtermTarget: indicator.endtermTarget,
          })),
        });
        toast.success("Outcome updated successfully");
      } else {
        for (const row of validatedOutcomes) {
          await createOutcome.mutateAsync({
            kraId,
            text: row.text.trim(),
            indicators: row.indicators.map((indicator) => ({
              text: indicator.text.trim(),
              baselineValue: indicator.baselineValue,
              midtermTarget: indicator.midtermTarget,
              endtermTarget: indicator.endtermTarget,
            })),
          });
        }
        toast.success(validatedOutcomes.length === 1 ? "Outcome created successfully" : `${validatedOutcomes.length} outcomes created successfully`);
      }
      navigate("/projects/outcomes");
    } catch {
      toast.error("Failed to save outcome");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Add Outcome" : "Edit Outcome"}
        description="Create or update a result statement and its indicators under a KRA."
        actions={
          <Button asChild variant="outline">
            <Link to="/projects/outcomes">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div className="space-y-1.5">
            <Label>
              Key Result Area <span className="text-red-600">*</span>
            </Label>
            <Select value={kraId} onValueChange={(value) => { setKraId(value); setKraError(""); }} disabled={kras.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder="Select Key Result Area" />
              </SelectTrigger>
              <SelectContent>
                {kras.map((kra) => (
                  <SelectItem key={kra.id} value={kra.id}>
                    {kra.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {kraError ? <p className="text-xs text-red-600">{kraError}</p> : null}
          </div>
          <p className="text-sm text-muted-foreground">Add one or more outcomes below. Each outcome can contain multiple indicators with baseline and target values.</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Outcomes</h2>
            <Button type="button" variant="outline" size="sm" onClick={addOutcomeRow}>
              <Plus className="mr-2 h-3.5 w-3.5" /> Add Another Outcome
            </Button>
          </div>

          <div className="space-y-5">
            {outcomeRows.map((outcome, outcomeIndex) => (
              <div key={outcome._key} className="rounded-lg border border-border/70 bg-background/70 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Outcome {outcomeIndex + 1}</p>
                  {outcomeRows.length > 1 ? (
                    <Button type="button" variant="ghost" size="sm" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => removeOutcomeRow(outcome._key)}>
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Remove
                    </Button>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label>Outcome</Label>
                  <Input value={outcome.text} onChange={(e) => updateOutcomeText(outcome._key, e.target.value)} placeholder="e.g. Improved livestock productivity" />
                  {outcome.error ? <p className="text-xs text-red-600">{outcome.error}</p> : null}
                </div>

                <div className="rounded-lg border border-border/60 bg-background/60 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Outcome Indicators</h3>
                    <Button type="button" variant="outline" size="sm" onClick={() => addIndicatorRow(outcome._key)}>
                      <Plus className="mr-2 h-3.5 w-3.5" /> Add Another Outcome Indicator
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {outcome.indicators.map((indicator, indicatorIndex) => (
                      <div key={indicator._key} className="rounded-md border border-border/70 bg-background p-3">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-medium">Indicator {indicatorIndex + 1}</p>
                          {outcome.indicators.length > 1 ? (
                            <Button type="button" variant="ghost" size="sm" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => removeIndicatorRow(outcome._key, indicator._key)}>
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Remove
                            </Button>
                          ) : null}
                        </div>
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
                          <div className="space-y-1.5">
                            <Label>Outcome Indicator</Label>
                            <Input value={indicator.text} onChange={(e) => updateIndicatorValue(outcome._key, indicator._key, "text", e.target.value)} placeholder="e.g. Number of farmers reached" />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Baseline Value</Label>
                            <Input type="number" value={indicator.baselineValue} onChange={(e) => updateIndicatorValue(outcome._key, indicator._key, "baselineValue", e.target.value)} placeholder="0" />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Midterm Target</Label>
                            <Input type="number" value={indicator.midtermTarget} onChange={(e) => updateIndicatorValue(outcome._key, indicator._key, "midtermTarget", e.target.value)} placeholder="0" />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Endterm Target</Label>
                            <Input type="number" value={indicator.endtermTarget} onChange={(e) => updateIndicatorValue(outcome._key, indicator._key, "endtermTarget", e.target.value)} placeholder="0" />
                          </div>
                        </div>
                        {indicator.error ? <p className="mt-2 text-xs text-red-600">{indicator.error}</p> : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/projects/outcomes")}>Cancel</Button>
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="mr-2 h-4 w-4" />
            {mode === "create" ? "Save Outcome" : "Update Outcome"}
          </Button>
        </div>
      </form>
    </div>
  );
}
