import { Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStrategies, useKeyActivities, useExpectedOutputs, useCreateExpectedOutput, useUpdateExpectedOutput } from "@/hooks/useProjectsApi";

interface RowItem {
  _key: string;
  text: string;
  error: string;
}

interface ExpectedOutputFormProps {
  mode?: "create" | "edit";
}

function uid() { return Math.random().toString(36).slice(2, 9); }

export default function ExpectedOutputForm({ mode = "create" }: ExpectedOutputFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: strategies = [] } = useStrategies();
  const { data: allKeyActivities = [] } = useKeyActivities();
  const { data: outputs = [] } = useExpectedOutputs();
  const createOutput = useCreateExpectedOutput();
  const updateOutput = useUpdateExpectedOutput();
  const [strategyId, setStrategyId] = useState("");
  const [strategyError, setStrategyError] = useState("");

  const [keyActivityId, setKeyActivityId] = useState("");

  const [rows, setRows] = useState<RowItem[]>([{ _key: uid(), text: "", error: "" }]);

  const keyActivities = strategyId
    ? allKeyActivities.filter((a) => a.strategyId === strategyId)
    : [];

  useEffect(() => {
    if (mode === "edit" && id && outputs.length) {
      const item = outputs.find((o) => o.id === id);
      if (item) {
        setStrategyId(item.strategyId);
        setKeyActivityId(item.keyActivityId || "");
        setRows([{ _key: uid(), text: item.text, error: "" }]);
      } else {
        toast.error("Expected output not found");
        navigate("/projects/expected-outputs");
      }
    }
  }, [mode, id, outputs, navigate]);

  useEffect(() => {
    if (strategyId) {
      if (!allKeyActivities.some((a) => a.strategyId === strategyId && a.id === keyActivityId)) {
        setKeyActivityId("");
      }
    } else {
      setKeyActivityId("");
    }
  }, [strategyId, allKeyActivities]);

  const addRow = () => setRows((r) => [...r, { _key: uid(), text: "", error: "" }]);
  const removeRow = (key: string) => { if (rows.length > 1) setRows((r) => r.filter((row) => row._key !== key)); };
  const updateRow = (key: string, value: string) => setRows((r) => r.map((row) => row._key === key ? { ...row, text: value, error: "" } : row));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    if (!strategyId) { setStrategyError("Please select a strategy"); valid = false; }
    const validatedRows = rows.map((row) => ({ ...row, error: row.text.trim() ? "" : "Output text is required" }));
    setRows(validatedRows);
    if (validatedRows.some((r) => r.error)) valid = false;
    if (!valid) { toast.error("Please fix the errors before saving"); return; }

    try {
      if (mode === "edit") {
        await updateOutput.mutateAsync({ id: id!, strategyId, keyActivityId, text: rows[0].text });
        toast.success("Expected output updated successfully");
      } else {
        const saved = rows.filter((r) => r.text.trim());
        for (const r of saved) {
          await createOutput.mutateAsync({ strategyId, keyActivityId, text: r.text });
        }
        toast.success(saved.length === 1 ? "Expected output created" : `${saved.length} expected outputs created`);
      }
      navigate("/projects/expected-outputs");
    } catch {
      toast.error("Failed to save expected output");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Add Expected Output" : "Edit Expected Output"}
        description={mode === "create" ? "Select a strategy and add one or more expected outputs." : "Update the expected output details."}
        actions={<Button asChild variant="outline"><Link to="/projects/expected-outputs"><ArrowLeft className="h-4 w-4" /> Back</Link></Button>}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold">Link to Strategy &amp; Key Activity</h2>

          {strategies.length === 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              No strategies available. <Link to="/projects/strategy/new" className="underline font-medium">Create a strategy first</Link>.
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 max-w-2xl">
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
                        ? "No key activities for this strategy"
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
                  No key activities for this strategy.{" "}
                  <Link to="/projects/key-activities/new" className="underline">Add one</Link>.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">{mode === "create" ? "Expected Outputs" : "Expected Output"}</h2>
            {mode === "create" && (
              <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={strategies.length === 0}>
                <Plus className="h-3.5 w-3.5" /> Add Another Output
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {rows.map((row, idx) => (
              <div key={row._key} className="flex items-start gap-2">
                {rows.length > 1 && <span className="mt-2.5 text-xs text-muted-foreground w-5 shrink-0 text-right">{idx + 1}.</span>}
                <div className="flex-1 space-y-1">
                  <Input value={row.text} onChange={(e) => updateRow(row._key, e.target.value)} placeholder="e.g. Increased crop yield by 20%" className={row.error ? "border-red-400" : ""} />
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
          {mode === "create" && rows.length > 1 && <p className="text-xs text-muted-foreground">{rows.length} outputs will be saved under the selected strategy.</p>}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/projects/expected-outputs")}>Cancel</Button>
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={strategies.length === 0}>
            <Save className="h-4 w-4" />
            {mode === "create" ? (rows.length > 1 ? `Save ${rows.length} Outputs` : "Save Output") : "Update Output"}
          </Button>
        </div>
      </form>
    </div>
  );
}
