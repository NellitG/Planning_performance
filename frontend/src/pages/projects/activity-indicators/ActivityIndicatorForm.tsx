import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useActivityIndicators,
  useCreateActivityIndicators,
  useSubActivities,
  useUpdateActivityIndicator,
} from "@/hooks/useProjectsApi";

interface Props {
  mode?: "create" | "edit" | "view";
}

interface IndicatorRow {
  _key: string;
  indicator: string;
  target: string;
  unitOfMeasure: string;
  errors: {
    indicator?: string;
    target?: string;
    unitOfMeasure?: string;
  };
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function createRow(): IndicatorRow {
  return {
    _key: uid(),
    indicator: "",
    target: "",
    unitOfMeasure: "",
    errors: {},
  };
}

export default function ActivityIndicatorForm({ mode = "create" }: Props) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: items = [] } = useActivityIndicators();
  const { data: subActivities = [] } = useSubActivities();
  const createItems = useCreateActivityIndicators();
  const updateItem = useUpdateActivityIndicator();

  const [subActivityId, setSubActivityId] = useState("");
  const [rows, setRows] = useState<IndicatorRow[]>([createRow()]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if ((mode === "edit" || mode === "view") && id && items.length) {
      const item = items.find((entry) => entry.id === id);
      if (!item) {
        toast.error("Indicator not found");
        navigate("/projects/activity-indicators");
        return;
      }
      setSubActivityId(item.subActivityId);
      setRows([
        {
          _key: uid(),
          indicator: item.indicator,
          target: item.target,
          unitOfMeasure: item.unitOfMeasure,
          errors: {},
        },
      ]);
    }
  }, [id, items, mode, navigate]);

  const addRow = () => setRows((current) => [...current, createRow()]);

  const removeRow = (key: string) => {
    setRows((current) => (current.length > 1 ? current.filter((row) => row._key !== key) : current));
  };

  const updateRow = (key: string, field: "indicator" | "target" | "unitOfMeasure", value: string) => {
    setRows((current) =>
      current.map((row) =>
        row._key === key
          ? {
              ...row,
              [field]: value,
              errors: { ...row.errors, [field]: "" },
            }
          : row,
      ),
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!subActivityId) nextErrors.subActivityId = "Please select a Sub Activity";
    const validatedRows = rows.map((row) => ({
      ...row,
      errors: {
        indicator: row.indicator.trim() ? "" : "Indicator is required",
        target: row.target.trim() ? "" : "Target is required",
        unitOfMeasure: row.unitOfMeasure.trim() ? "" : "Unit of Measure is required",
      },
    }));
    setRows(validatedRows);
    setErrors(nextErrors);
    const hasRowErrors = validatedRows.some((row) => Object.values(row.errors).some(Boolean));
    if (Object.keys(nextErrors).length > 0 || hasRowErrors) {
      toast.error("Please fix the errors before saving.");
      return;
    }

    try {
      if (mode === "create") {
        const payload = validatedRows.map((row) => ({
          subActivityId,
          indicator: row.indicator.trim(),
          target: row.target.trim(),
          unitOfMeasure: row.unitOfMeasure.trim(),
        }));
        await createItems.mutateAsync(payload);
        toast.success(payload.length === 1 ? "Indicator created successfully" : `${payload.length} indicators created successfully`);
      } else {
        const row = validatedRows[0];
        await updateItem.mutateAsync({
          id: id!,
          subActivityId,
          indicator: row.indicator.trim(),
          target: row.target.trim(),
          unitOfMeasure: row.unitOfMeasure.trim(),
        });
        toast.success("Indicator updated successfully");
      }
      navigate("/projects/activity-indicators");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save Indicator");
    }
  };

  const isView = mode === "view";

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Add New Indicators" : mode === "edit" ? "Edit Indicator" : "View Indicator"}
        description={mode === "create" ? "Create one or more Indicators linked to a Sub Activity." : "Indicator details linked to a Sub Activity."}
        actions={
          <Button asChild variant="outline">
            <Link to="/projects/activity-indicators">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="max-w-3xl space-y-1.5">
            <Label htmlFor="subActivity">Sub Activity {!isView && <span className="text-red-600">*</span>}</Label>
            {isView ? (
              <Input value={subActivities.find((item) => item.id === subActivityId)?.name ?? ""} disabled />
            ) : (
              <select
                id="subActivity"
                value={subActivityId}
                onChange={(event) => {
                  setSubActivityId(event.target.value);
                  setErrors((prev) => ({ ...prev, subActivityId: "" }));
                }}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">- Select Sub Activity -</option>
                {subActivities.map((item) => (
                  <option key={item.id} value={item.id}>{item.mainActivityName} - {item.name}</option>
                ))}
              </select>
            )}
            {errors.subActivityId && <p className="text-xs text-red-600">{errors.subActivityId}</p>}
            {!isView && subActivities.length === 0 && (
              <p className="text-xs text-amber-600">
                No Sub Activities found.{" "}
                <Link to="/projects/sub-activities/new" className="font-medium underline">
                  Create one first.
                </Link>
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold">{mode === "create" ? "Indicators" : "Indicator"}</h2>
            {mode === "create" && (
              <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={subActivities.length === 0}>
                <Plus className="h-3.5 w-3.5" /> Add Another Indicator
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {rows.map((row, index) => (
              <div key={row._key} className="rounded-lg border border-border/70 bg-background/70 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">Indicator {index + 1}</p>
                  {mode === "create" && rows.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" className="text-red-400 hover:bg-red-50 hover:text-red-600" onClick={() => removeRow(row._key)}>
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Remove
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1.5 md:col-span-3">
                    <Label>Indicator {!isView && <span className="text-red-600">*</span>}</Label>
                    <Input
                      value={row.indicator}
                      onChange={(event) => updateRow(row._key, "indicator", event.target.value)}
                      placeholder="e.g. Farmers trained on climate-smart agriculture"
                      disabled={isView}
                      className={row.errors.indicator ? "border-red-400" : ""}
                    />
                    {row.errors.indicator && <p className="text-xs text-red-600">{row.errors.indicator}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label>Target {!isView && <span className="text-red-600">*</span>}</Label>
                    <Input
                      value={row.target}
                      onChange={(event) => updateRow(row._key, "target", event.target.value)}
                      placeholder="e.g. 100 or Quarterly"
                      disabled={isView}
                      className={row.errors.target ? "border-red-400" : ""}
                    />
                    {row.errors.target && <p className="text-xs text-red-600">{row.errors.target}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label>Unit of Measure {!isView && <span className="text-red-600">*</span>}</Label>
                    <Input
                      value={row.unitOfMeasure}
                      onChange={(event) => updateRow(row._key, "unitOfMeasure", event.target.value)}
                      placeholder="e.g. Number, %, KES"
                      disabled={isView}
                      className={row.errors.unitOfMeasure ? "border-red-400" : ""}
                    />
                    {row.errors.unitOfMeasure && <p className="text-xs text-red-600">{row.errors.unitOfMeasure}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {mode === "create" && rows.length > 1 && (
            <p className="mt-3 text-xs text-muted-foreground">{rows.length} indicators will be saved under the selected Sub Activity.</p>
          )}
        </div>

        {!isView && (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate("/projects/activity-indicators")}>Cancel</Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={subActivities.length === 0}>
              <Save className="h-4 w-4" /> {mode === "create" ? (rows.length > 1 ? `Save ${rows.length} Indicators` : "Save Indicator") : "Update Indicator"}
            </Button>
          </div>
        )}

        {isView && (
          <div className="mt-4 flex justify-end">
            <Button asChild variant="outline">
              <Link to={`/projects/activity-indicators/${id}/edit`}>Edit</Link>
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
