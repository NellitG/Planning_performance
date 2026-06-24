import { Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useComponents, useObjectives, useStrategies, useCreateStrategy, useUpdateStrategy } from "@/hooks/useProjectsApi";
import type { ProjectObjective } from "@/utils/types";

interface RowItem {
  _key: string;
  text: string;
  error: string;
}

interface HeaderErrors {
  componentId?: string;
  objectiveId?: string;
}

interface StrategyFormProps {
  mode?: "create" | "edit";
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function StrategyForm({ mode = "create" }: StrategyFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: components = [] } = useComponents();
  const { data: allObjectives = [] } = useObjectives();
  const { data: strategies = [] } = useStrategies();
  const createStrategy = useCreateStrategy();
  const updateStrategy = useUpdateStrategy();
  const [filteredObjectives, setFilteredObjectives] = useState<ProjectObjective[]>([]);
  const [componentId, setComponentId] = useState("");
  const [objectiveId, setObjectiveId] = useState("");
  const [headerErrors, setHeaderErrors] = useState<HeaderErrors>({});

  const [rows, setRows] = useState<RowItem[]>([{ _key: uid(), text: "", error: "" }]);

  useEffect(() => {
    if (mode === "edit" && id && strategies.length) {
      const item = strategies.find((s) => s.id === id);
      if (item) {
        setComponentId(item.componentId);
        setObjectiveId(item.objectiveId);
        setRows([{ _key: uid(), text: item.text, error: "" }]);
      } else {
        toast.error("Strategy not found");
        navigate("/projects/strategy");
      }
    }
  }, [mode, id, strategies, navigate]);

  useEffect(() => {
    if (componentId) {
      const filtered = allObjectives.filter((o) => o.componentId === componentId);
      setFilteredObjectives(filtered);
      if (!filtered.find((o) => o.id === objectiveId)) {
        setObjectiveId("");
      }
    } else {
      setFilteredObjectives([]);
      setObjectiveId("");
    }
  }, [componentId, allObjectives]);

  const addRow = () => setRows((r) => [...r, { _key: uid(), text: "", error: "" }]);

  const removeRow = (key: string) => {
    if (rows.length === 1) return;
    setRows((r) => r.filter((row) => row._key !== key));
  };

  const updateRow = (key: string, value: string) =>
    setRows((r) => r.map((row) => row._key === key ? { ...row, text: value, error: "" } : row));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hErrs: HeaderErrors = {};
    if (!componentId) hErrs.componentId = "Please select a Key Result Area";
    if (!objectiveId) hErrs.objectiveId = "Please select a strategic objective";
    setHeaderErrors(hErrs);

    const validatedRows = rows.map((row) => ({
      ...row,
      error: row.text.trim() ? "" : "Strategy text is required",
    }));
    setRows(validatedRows);

    const hasRowErrors = validatedRows.some((r) => r.error);
    if (Object.keys(hErrs).length || hasRowErrors) {
      toast.error("Please fix the errors before saving");
      return;
    }

    try {
      if (mode === "edit") {
        await updateStrategy.mutateAsync({ id: id!, componentId, objectiveId, text: rows[0].text });
        toast.success("Strategy updated successfully");
      } else {
        const saved = rows.filter((r) => r.text.trim());
        for (const r of saved) {
          await createStrategy.mutateAsync({ componentId, objectiveId, text: r.text });
        }
        toast.success(
          saved.length === 1
            ? "Strategy created successfully"
            : `${saved.length} strategies created successfully`,
        );
      }
      navigate("/projects/strategy");
    } catch {
      toast.error("Failed to save strategy");
    }
  };

  const hasComponents = components.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Create Strategies" : "Edit Strategy"}
        description={
          mode === "create"
            ? "Select a Key Result Area and objective, then add one or more strategies."
            : "Update the strategy details."
        }
        actions={
          <Button asChild variant="outline">
            <Link to="/projects/strategy">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold">Key Result Area &amp; Objective</h2>

          {!hasComponents && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              No Key Result Areas available.{" "}
              <Link to="/projects/components/new" className="underline font-medium">
                Create a KRA
              </Link>{" "}
              and{" "}
              <Link to="/projects/strategic-objectives/new" className="underline font-medium">
                strategic objective
              </Link>{" "}
              first.
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 max-w-2xl">
            <div className="space-y-1.5">
              <Label>
                Key Result Area <span className="text-red-600">*</span>
              </Label>
              <Select
                value={componentId}
                onValueChange={(v) => { setComponentId(v); setHeaderErrors((e) => ({ ...e, componentId: "" })); }}
                disabled={!hasComponents}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Key Result Area" />
                </SelectTrigger>
                <SelectContent>
                  {components.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {headerErrors.componentId && (
                <p className="text-xs text-red-600">{headerErrors.componentId}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>
                Strategic Objective <span className="text-red-600">*</span>
              </Label>
              <Select
                value={objectiveId}
                onValueChange={(v) => { setObjectiveId(v); setHeaderErrors((e) => ({ ...e, objectiveId: "" })); }}
                disabled={!componentId || filteredObjectives.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !componentId
                        ? "Select a KRA first"
                        : filteredObjectives.length === 0
                        ? "No objectives for this KRA"
                        : "Select Strategic Objective"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredObjectives.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.text}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {headerErrors.objectiveId && (
                <p className="text-xs text-red-600">{headerErrors.objectiveId}</p>
              )}
              {componentId && filteredObjectives.length === 0 && (
                <p className="text-xs text-amber-600">
                  No objectives for this KRA.{" "}
                  <Link to="/projects/strategic-objectives/new" className="underline">
                    Add one
                  </Link>
                  .
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">
              {mode === "create" ? "Strategies" : "Strategy"}
            </h2>
            {mode === "create" && (
              <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={!hasComponents}>
                <Plus className="h-3.5 w-3.5" /> Add Another Strategy
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {rows.map((row, idx) => (
              <div key={row._key} className="flex items-start gap-2">
                {rows.length > 1 && (
                  <span className="mt-2.5 text-xs text-muted-foreground w-5 shrink-0 text-right">
                    {idx + 1}.
                  </span>
                )}
                <div className="flex-1 space-y-1">
                  <Input
                    value={row.text}
                    onChange={(e) => updateRow(row._key, e.target.value)}
                    placeholder="e.g. Partner with universities for joint research programs"
                    className={row.error ? "border-red-400 focus-visible:ring-red-400" : ""}
                  />
                  {row.error && <p className="text-xs text-red-600">{row.error}</p>}
                </div>
                {rows.length > 1 && mode === "create" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-0.5 text-red-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => removeRow(row._key)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {mode === "create" && rows.length > 1 && (
            <p className="text-xs text-muted-foreground">
              {rows.length} strategies will be saved under the selected KRA and objective.
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/projects/strategy")}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!hasComponents}
          >
            <Save className="h-4 w-4" />
            {mode === "create"
              ? rows.length > 1
                ? `Save ${rows.length} Strategies`
                : "Save Strategy"
              : "Update Strategy"}
          </Button>
        </div>
      </form>
    </div>
  );
}
