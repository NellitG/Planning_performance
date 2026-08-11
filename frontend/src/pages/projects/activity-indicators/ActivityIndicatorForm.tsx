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
  useProjectSubComponents,
  useMainActivities,
  useProjectOutputs,
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
  const { data: subComponents = [] } = useProjectSubComponents();
  const createItems = useCreateActivityIndicators();
  const updateItem = useUpdateActivityIndicator();

  const [mainActivityId, setMainActivityId] = useState("");
  const [subComponentId, setSubComponentId] = useState("");
  const [projectOutputId, setProjectOutputId] = useState("");

  const { data: mainActivities = [], isLoading: mainActivitiesLoading } = useMainActivities();
  const { data: projectOutputs = [], isLoading: projectOutputsLoading } = useProjectOutputs(subComponentId || undefined);

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
      setMainActivityId(item.mainActivityId ?? "");
      setSubComponentId(item.subComponentId);
      setProjectOutputId(item.projectOutputId ?? "");
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
    if (!subComponentId) nextErrors.subComponentId = "Please select a Sub Component";
    const validatedRows = rows.map((row) => ({
      ...row,
      errors: {
        indicator: row.indicator.trim() ? "" : "Indicator is required",
        target: "",
        unitOfMeasure: "",
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
          mainActivityId,
          subComponentId,
          projectOutputId,
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
          mainActivityId,
          subComponentId,
          projectOutputId,
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
        description={mode === "create" ? "Create one or more Indicators linked to a Main Activity." : "Indicator details linked to a Main Activity."}
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
          <div className="max-w-3xl space-y-1.5 mb-5">
            <Label htmlFor="subComponent">Sub Component {!isView && <span className="text-red-600">*</span>}</Label>
            {isView ? <Input value={subComponents.find((item) => item.id === subComponentId)?.name ?? ""} disabled /> : (
              <select id="subComponent" value={subComponentId} onChange={(event) => { setSubComponentId(event.target.value); setProjectOutputId(""); setMainActivityId(""); setErrors((prev) => ({ ...prev, subComponentId: "" })); }} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">- Select Sub Component -</option>
                {subComponents.map((item) => <option key={item.id} value={item.id}>{item.componentName} - {item.name}</option>)}
              </select>
            )}
            {errors.subComponentId && <p className="text-xs text-red-600">{errors.subComponentId}</p>}
          </div>
          <div className="max-w-3xl space-y-1.5 mb-5">
            <Label htmlFor="projectOutput">Project Output <span className="text-muted-foreground">(Optional)</span></Label>
            {isView ? (
              <Input value={projectOutputs.find((item) => item.id === projectOutputId)?.name ?? ""} disabled />
            ) : (
              <select id="projectOutput" value={projectOutputId} disabled={!subComponentId || projectOutputsLoading} onChange={(event) => { setProjectOutputId(event.target.value); setMainActivityId(""); setErrors((prev) => ({ ...prev, projectOutputId: "" })); }} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">{!subComponentId ? "- Select a Sub Component first -" : projectOutputsLoading ? "Loading Project Outputs..." : "- Select Project Output -"}</option>
                {projectOutputs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            )}
            {!isView && subComponentId && !projectOutputsLoading && projectOutputs.length === 0 && <p className="text-xs text-muted-foreground">No Project Outputs exist for this Sub Component.</p>}
          </div>
          <div className="max-w-3xl space-y-1.5">
            <Label htmlFor="mainActivity">Main Activity <span className="text-muted-foreground">(Optional)</span></Label>
            {isView ? (
              <Input value={mainActivities.find((item) => item.id === mainActivityId)?.name ?? ""} disabled />
            ) : (
              <select
                id="mainActivity"
                value={mainActivityId}
                disabled={mainActivitiesLoading}
                onChange={(event) => {
                  const selectedId = event.target.value;
                  const activity = mainActivities.find((item) => item.id === selectedId);
                  setMainActivityId(selectedId);
                  if (activity) {
                    setSubComponentId(activity.subComponentId);
                    setProjectOutputId(activity.projectOutputId ?? "");
                  }
                  setErrors((prev) => ({ ...prev, mainActivityId: "" }));
                }}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">{mainActivitiesLoading ? "Loading Main Activities..." : "- Select Main Activity -"}</option>
                {mainActivities.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            )}
            {errors.mainActivityId && <p className="text-xs text-red-600">{errors.mainActivityId}</p>}
            {!isView && !mainActivitiesLoading && mainActivities.length === 0 && (
              <p className="text-xs text-amber-600">
                No Main Activities are available.{" "}
                <Link to="/projects/main-activities/new" className="font-medium underline">
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
              <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={mainActivities.length === 0}>
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
                    <Label>Target <span className="text-muted-foreground">(Optional)</span></Label>
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
                    <Label>Unit of Measure <span className="text-muted-foreground">(Optional)</span></Label>
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
            <p className="mt-3 text-xs text-muted-foreground">{rows.length} indicators will be saved under the selected Main Activity.</p>
          )}
        </div>

        {!isView && (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate("/projects/activity-indicators")}>Cancel</Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={subComponents.length === 0}>
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
