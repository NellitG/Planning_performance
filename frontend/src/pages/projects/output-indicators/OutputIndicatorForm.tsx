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

  const [rows, setRows] = useState<RowItem[]>([{ _key: uid(), text: "", error: "" }]);

  const keyActivities = strategyId ? allKeyActivities.filter((a) => a.strategyId === strategyId) : [];
  const expectedOutputs = strategyId ? allExpectedOutputs.filter((o) => o.strategyId === strategyId) : [];

  useEffect(() => {
    if (mode === "edit" && id && indicators.length) {
      const item = indicators.find((i) => i.id === id);
      if (item) {
        setStrategyId(item.strategyId);
        setKeyActivityId(item.keyActivityId || "");
        setExpectedOutputId(item.expectedOutputId || "");
        setRows([{ _key: uid(), text: item.text, error: "" }]);
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

  const addRow = () => setRows((r) => [...r, { _key: uid(), text: "", error: "" }]);
  const removeRow = (key: string) => { if (rows.length > 1) setRows((r) => r.filter((row) => row._key !== key)); };
  const updateRow = (key: string, value: string) => setRows((r) => r.map((row) => row._key === key ? { ...row, text: value, error: "" } : row));

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
        await updateIndicator.mutateAsync({ id: id!, strategyId, keyActivityId, expectedOutputId, text: rows[0].text });
        toast.success("Output indicator updated successfully");
      } else {
        const saved = rows.filter((r) => r.text.trim());
        for (const r of saved) {
          await createIndicator.mutateAsync({ strategyId, keyActivityId, expectedOutputId, text: r.text });
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
          <div className="space-y-3">
            {rows.map((row, idx) => (
              <div key={row._key} className="flex items-start gap-2">
                {rows.length > 1 && <span className="mt-2.5 text-xs text-muted-foreground w-5 shrink-0 text-right">{idx + 1}.</span>}
                <div className="flex-1 space-y-1">
                  <Input value={row.text} onChange={(e) => updateRow(row._key, e.target.value)} placeholder="e.g. % increase in farmer adoption rate" className={row.error ? "border-red-400" : ""} />
                  {row.error && <p className="text-xs text-red-600">{row.error}</p>}
                </div>
                {rows.length > 1 && mode === "create" && (
                  <Button type="button" variant="ghost" size="sm" className="mt-0.5 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => removeRow(row._key)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
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
