import { Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStrategies, useKeyActivities, useCreateKeyActivity, useUpdateKeyActivity } from "@/hooks/useProjectsApi";

interface RowItem {
  _key: string;
  text: string;
  error: string;
}

interface KeyActivityFormProps {
  mode?: "create" | "edit";
}

function uid() { return Math.random().toString(36).slice(2, 9); }

export default function KeyActivityForm({ mode = "create" }: KeyActivityFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: strategies = [] } = useStrategies();
  const { data: keyActivities = [] } = useKeyActivities();
  const createKeyActivity = useCreateKeyActivity();
  const updateKeyActivity = useUpdateKeyActivity();
  const [strategyId, setStrategyId] = useState("");
  const [strategyError, setStrategyError] = useState("");
  const [rows, setRows] = useState<RowItem[]>([{ _key: uid(), text: "", error: "" }]);

  useEffect(() => {
    if (mode === "edit" && id && keyActivities.length) {
      const item = keyActivities.find((a) => a.id === id);
      if (item) {
        setStrategyId(item.strategyId);
        setRows([{ _key: uid(), text: item.text, error: "" }]);
      } else {
        toast.error("Key activity not found");
        navigate("/projects/key-activities");
      }
    }
  }, [mode, id, keyActivities, navigate]);

  const addRow = () => setRows((r) => [...r, { _key: uid(), text: "", error: "" }]);
  const removeRow = (key: string) => { if (rows.length > 1) setRows((r) => r.filter((row) => row._key !== key)); };
  const updateRow = (key: string, value: string) => setRows((r) => r.map((row) => row._key === key ? { ...row, text: value, error: "" } : row));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    if (!strategyId) { setStrategyError("Please select a strategy"); valid = false; }
    const validatedRows = rows.map((row) => ({ ...row, error: row.text.trim() ? "" : "Activity text is required" }));
    setRows(validatedRows);
    if (validatedRows.some((r) => r.error)) valid = false;
    if (!valid) { toast.error("Please fix the errors before saving"); return; }

    try {
      if (mode === "edit") {
        await updateKeyActivity.mutateAsync({ id: id!, strategyId, text: rows[0].text });
        toast.success("Key activity updated successfully");
      } else {
        const saved = rows.filter((r) => r.text.trim());
        for (const r of saved) {
          await createKeyActivity.mutateAsync({ strategyId, text: r.text });
        }
        toast.success(saved.length === 1 ? "Key activity created" : `${saved.length} key activities created`);
      }
      navigate("/projects/key-activities");
    } catch {
      toast.error("Failed to save key activity");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Add Key Activity" : "Edit Key Activity"}
        description={mode === "create" ? "Select a strategy and add one or more key activities." : "Update the key activity details."}
        actions={
          <Button asChild variant="outline">
            <Link to="/projects/key-activities"><ArrowLeft className="h-4 w-4" /> Back</Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold">Strategy</h2>
          {strategies.length === 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              No strategies available.{" "}
              <Link to="/projects/strategy/new" className="underline font-medium">Create a strategy first</Link>.
            </div>
          )}
          <div className="max-w-md space-y-1.5">
            <Label>Strategy <span className="text-red-600">*</span></Label>
            <Select value={strategyId} onValueChange={(v) => { setStrategyId(v); setStrategyError(""); }} disabled={strategies.length === 0}>
              <SelectTrigger><SelectValue placeholder="Select Strategy" /></SelectTrigger>
              <SelectContent>
                {strategies.map((s) => <SelectItem key={s.id} value={s.id}>{s.text}</SelectItem>)}
              </SelectContent>
            </Select>
            {strategyError && <p className="text-xs text-red-600">{strategyError}</p>}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">{mode === "create" ? "Key Activities" : "Key Activity"}</h2>
            {mode === "create" && (
              <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={strategies.length === 0}>
                <Plus className="h-3.5 w-3.5" /> Add Another Activity
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {rows.map((row, idx) => (
              <div key={row._key} className="flex items-start gap-2">
                {rows.length > 1 && <span className="mt-2.5 text-xs text-muted-foreground w-5 shrink-0 text-right">{idx + 1}.</span>}
                <div className="flex-1 space-y-1">
                  <Input value={row.text} onChange={(e) => updateRow(row._key, e.target.value)} placeholder="e.g. Conduct field trials in target regions" className={row.error ? "border-red-400" : ""} />
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
          {mode === "create" && rows.length > 1 && (
            <p className="text-xs text-muted-foreground">{rows.length} activities will be saved under the selected strategy.</p>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/projects/key-activities")}>Cancel</Button>
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={strategies.length === 0}>
            <Save className="h-4 w-4" />
            {mode === "create" ? (rows.length > 1 ? `Save ${rows.length} Activities` : "Save Activity") : "Update Activity"}
          </Button>
        </div>
      </form>
    </div>
  );
}
