import { Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStrategies, useKeyActivities, useExpectedOutputs, useOutputIndicators, useCreateOutputIndicator, useUpdateOutputIndicator } from "@/hooks/useProjectsApi";

interface RowItem {
  _key: string;
  text: string;
  cumulativeTarget: string;
  year1Target: string;
  year2Target: string;
  year3Target: string;
  year4Target: string;
  year5Target: string;
  totalBudgetMillions: string;
  budgetYear1: string;
  budgetYear2: string;
  budgetYear3: string;
  budgetYear4: string;
  budgetYear5: string;
  error: string;
}

interface OutputIndicatorFormProps {
  mode?: "create" | "edit";
}

function uid() { return Math.random().toString(36).slice(2, 9); }

export default function OutputIndicatorForm({ mode = "create" }: OutputIndicatorFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: strategies = [] } = useStrategies();
  const { data: allKeyActivities = [] } = useKeyActivities();
  const { data: allExpectedOutputs = [] } = useExpectedOutputs();
  const { data: indicators = [] } = useOutputIndicators();
  const createIndicator = useCreateOutputIndicator();
  const updateIndicator = useUpdateOutputIndicator();

  const [strategyId, setStrategyId] = useState("");
  const [strategyError, setStrategyError] = useState("");
  const [keyActivityId, setKeyActivityId] = useState("");
  const [expectedOutputId, setExpectedOutputId] = useState("");

  const [rows, setRows] = useState<RowItem[]>([{ _key: uid(), text: "", cumulativeTarget: "", year1Target: "", year2Target: "", year3Target: "", year4Target: "", year5Target: "", totalBudgetMillions: "", budgetYear1: "", budgetYear2: "", budgetYear3: "", budgetYear4: "", budgetYear5: "", error: "" }]);

  const keyActivities = strategyId ? allKeyActivities.filter((a) => a.strategyId === strategyId) : [];
  const expectedOutputs = strategyId ? allExpectedOutputs.filter((o) => o.strategyId === strategyId) : [];

  useEffect(() => {
    if (mode === "edit" && id && indicators.length) {
      const item = indicators.find((i) => i.id === id);
      if (item) {
        setStrategyId(item.strategyId);
        setKeyActivityId(item.keyActivityId || "");
        setExpectedOutputId(item.expectedOutputId || "");
        setRows([{ _key: uid(), text: item.text, cumulativeTarget: item.cumulativeTarget ?? "", year1Target: item.year1Target ?? "", year2Target: item.year2Target ?? "", year3Target: item.year3Target ?? "", year4Target: item.year4Target ?? "", year5Target: item.year5Target ?? "", totalBudgetMillions: item.totalBudgetMillions ?? "", budgetYear1: item.budgetYear1 ?? "", budgetYear2: item.budgetYear2 ?? "", budgetYear3: item.budgetYear3 ?? "", budgetYear4: item.budgetYear4 ?? "", budgetYear5: item.budgetYear5 ?? "", error: "" }]);
      } else {
        toast.error("Output indicator not found");
        navigate("/projects/output-indicators");
      }
    }
  }, [mode, id, indicators, navigate]);

  useEffect(() => {
    if (strategyId) {
      if (!allKeyActivities.some((a) => a.strategyId === strategyId && a.id === keyActivityId)) setKeyActivityId("");
      if (!allExpectedOutputs.some((o) => o.strategyId === strategyId && o.id === expectedOutputId)) setExpectedOutputId("");
    } else {
      setKeyActivityId("");
      setExpectedOutputId("");
    }
  }, [strategyId, allKeyActivities, allExpectedOutputs]);

  const addRow = () => setRows((r) => [...r, { _key: uid(), text: "", cumulativeTarget: "", year1Target: "", year2Target: "", year3Target: "", year4Target: "", year5Target: "", totalBudgetMillions: "", budgetYear1: "", budgetYear2: "", budgetYear3: "", budgetYear4: "", budgetYear5: "", error: "" }]);
  const removeRow = (key: string) => { if (rows.length > 1) setRows((r) => r.filter((row) => row._key !== key)); };
  const updateRow = (key: string, field: keyof RowItem, value: string) => setRows((r) => r.map((row) => row._key === key ? { ...row, [field]: value, error: "" } : row));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    if (!strategyId) { setStrategyError("Please select a strategy"); valid = false; }
    const validatedRows = rows.map((row) => ({ ...row, error: row.text.trim() ? "" : "Indicator text is required" }));
    setRows(validatedRows);
    if (validatedRows.some((r) => r.error)) valid = false;
    if (!valid) { toast.error("Please fix the errors before saving"); return; }

    try {
      if (mode === "edit") {
        await updateIndicator.mutateAsync({ id: id!, strategyId, keyActivityId, expectedOutputId, text: rows[0].text, cumulativeTarget: rows[0].cumulativeTarget, year1Target: rows[0].year1Target, year2Target: rows[0].year2Target, year3Target: rows[0].year3Target, year4Target: rows[0].year4Target, year5Target: rows[0].year5Target, totalBudgetMillions: rows[0].totalBudgetMillions, budgetYear1: rows[0].budgetYear1, budgetYear2: rows[0].budgetYear2, budgetYear3: rows[0].budgetYear3, budgetYear4: rows[0].budgetYear4, budgetYear5: rows[0].budgetYear5 });
        toast.success("Output indicator updated successfully");
      } else {
        const saved = rows.filter((r) => r.text.trim());
        for (const r of saved) {
          await createIndicator.mutateAsync({ strategyId, keyActivityId, expectedOutputId, text: r.text, cumulativeTarget: r.cumulativeTarget, year1Target: r.year1Target, year2Target: r.year2Target, year3Target: r.year3Target, year4Target: r.year4Target, year5Target: r.year5Target, totalBudgetMillions: r.totalBudgetMillions, budgetYear1: r.budgetYear1, budgetYear2: r.budgetYear2, budgetYear3: r.budgetYear3, budgetYear4: r.budgetYear4, budgetYear5: r.budgetYear5 });
        }
        toast.success(saved.length === 1 ? "Output indicator created" : `${saved.length} output indicators created`);
      }
      navigate("/projects/output-indicators");
    } catch {
      toast.error("Failed to save output indicator");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Add Output Indicator" : "Edit Output Indicator"}
        description={mode === "create" ? "Select a strategy and add one or more output indicators." : "Update the output indicator details."}
        actions={<Button asChild variant="outline"><Link to="/projects/output-indicators"><ArrowLeft className="h-4 w-4" /> Back</Link></Button>}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold">Link to Strategy, Key Activity &amp; Expected Output</h2>

          {strategies.length === 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              No strategies available. <Link to="/projects/strategy/new" className="underline font-medium">Create a strategy first</Link>.
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 max-w-4xl">
            <div className="space-y-1.5">
              <Label>Strategy <span className="text-red-600">*</span></Label>
              <Select
                value={strategyId}
                onValueChange={(v) => { setStrategyId(v); setStrategyError(""); }}
                disabled={strategies.length === 0}
              >
                <SelectTrigger><SelectValue placeholder="Select Strategy" /></SelectTrigger>
                <SelectContent>
                  {strategies.map((s) => <SelectItem key={s.id} value={s.id}>{s.text}</SelectItem>)}
                </SelectContent>
              </Select>
              {strategyError && <p className="text-xs text-red-600">{strategyError}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Key Activity <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
              <Select
                value={keyActivityId}
                onValueChange={setKeyActivityId}
                disabled={!strategyId || keyActivities.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !strategyId
                        ? "Select a strategy first"
                        : keyActivities.length === 0
                        ? "No key activities"
                        : "Select Key Activity"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— None —</SelectItem>
                  {keyActivities.map((a) => <SelectItem key={a.id} value={a.id}>{a.text}</SelectItem>)}
                </SelectContent>
              </Select>
              {strategyId && keyActivities.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No key activities.{" "}
                  <Link to="/projects/key-activities/new" className="underline">Add one</Link>.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Expected Output <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
              <Select
                value={expectedOutputId}
                onValueChange={setExpectedOutputId}
                disabled={!strategyId || expectedOutputs.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !strategyId
                        ? "Select a strategy first"
                        : expectedOutputs.length === 0
                        ? "No expected outputs"
                        : "Select Expected Output"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— None —</SelectItem>
                  {expectedOutputs.map((o) => <SelectItem key={o.id} value={o.id}>{o.text}</SelectItem>)}
                </SelectContent>
              </Select>
              {strategyId && expectedOutputs.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No expected outputs.{" "}
                  <Link to="/projects/expected-outputs/new" className="underline">Add one</Link>.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">{mode === "create" ? "Output Indicators" : "Output Indicator"}</h2>
            {mode === "create" && (
              <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={strategies.length === 0}>
                <Plus className="h-3.5 w-3.5" /> Add Another Indicator
              </Button>
            )}
          </div>
          <div className="space-y-4">
            {rows.map((row, idx) => (
              <div key={row._key} className="rounded-lg border border-border/70 bg-background/70 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium">Indicator {idx + 1}</p>
                  {rows.length > 1 && mode === "create" && (
                    <Button type="button" variant="ghost" size="sm" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => removeRow(row._key)}>
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Remove
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Indicator Name</Label>
                    <Input value={row.text} onChange={(e) => updateRow(row._key, "text", e.target.value)} placeholder="e.g. % increase in farmer adoption rate" className={row.error ? "border-red-400" : ""} />
                    {row.error && <p className="text-xs text-red-600">{row.error}</p>}
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <div className="space-y-1">
                      <Label>Cumulative Target</Label>
                      <Input type="number" value={row.cumulativeTarget} onChange={(e) => updateRow(row._key, "cumulativeTarget", e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label>Year 1</Label>
                      <Input type="number" value={row.year1Target} onChange={(e) => updateRow(row._key, "year1Target", e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label>Year 2</Label>
                      <Input type="number" value={row.year2Target} onChange={(e) => updateRow(row._key, "year2Target", e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label>Year 3</Label>
                      <Input type="number" value={row.year3Target} onChange={(e) => updateRow(row._key, "year3Target", e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label>Year 4</Label>
                      <Input type="number" value={row.year4Target} onChange={(e) => updateRow(row._key, "year4Target", e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label>Year 5</Label>
                      <Input type="number" value={row.year5Target} onChange={(e) => updateRow(row._key, "year5Target", e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label>Total Budget (Millions)</Label>
                      <Input type="number" value={row.totalBudgetMillions} onChange={(e) => updateRow(row._key, "totalBudgetMillions", e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label>Budget Year 1</Label>
                      <Input type="number" value={row.budgetYear1} onChange={(e) => updateRow(row._key, "budgetYear1", e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label>Budget Year 2</Label>
                      <Input type="number" value={row.budgetYear2} onChange={(e) => updateRow(row._key, "budgetYear2", e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label>Budget Year 3</Label>
                      <Input type="number" value={row.budgetYear3} onChange={(e) => updateRow(row._key, "budgetYear3", e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label>Budget Year 4</Label>
                      <Input type="number" value={row.budgetYear4} onChange={(e) => updateRow(row._key, "budgetYear4", e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label>Budget Year 5</Label>
                      <Input type="number" value={row.budgetYear5} onChange={(e) => updateRow(row._key, "budgetYear5", e.target.value)} placeholder="0" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {mode === "create" && rows.length > 1 && <p className="text-xs text-muted-foreground">{rows.length} indicators will be saved under the selected strategy.</p>}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/projects/output-indicators")}>Cancel</Button>
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={strategies.length === 0}>
            <Save className="h-4 w-4" />
            {mode === "create" ? (rows.length > 1 ? `Save ${rows.length} Indicators` : "Save Indicator") : "Update Indicator"}
          </Button>
        </div>
      </form>
    </div>
  );
}
