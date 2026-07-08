import { Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useMainActivities,
  useCreateMainActivity,
  useUpdateMainActivity,
  useSubActivities,
} from "@/hooks/useProjectsApi";

interface MainActivityFormProps {
  mode?: "create" | "edit" | "view";
}

interface IndicatorRow {
  id: string;
  category: string;
  valueChain: string;
  indicator: string;
  target: string;
}

export default function MainActivityForm({ mode = "create" }: MainActivityFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: items = [] } = useMainActivities();
  const { data: subActivities = [] } = useSubActivities();
  const createItem = useCreateMainActivity();
  const updateItem = useUpdateMainActivity();
  const [name, setName] = useState("");
  const [indicators, setIndicators] = useState<IndicatorRow[]>([
    { id: crypto.randomUUID(), category: "ICT", valueChain: "", indicator: "", target: "" },
  ]);
  const [error, setError] = useState("");

  useEffect(() => {
    if ((mode === "edit" || mode === "view") && id && items.length) {
      const item = items.find((a) => a.id === id);
      if (item) {
        setName(item.name);
        const loaded = (item.indicators ?? []).map((entry) => ({
          id: crypto.randomUUID(),
          category: entry.category,
          valueChain: entry.valueChain ?? "",
          indicator: entry.indicator,
          target: entry.target,
        }));
        setIndicators(loaded.length ? loaded : [{ id: crypto.randomUUID(), category: "ICT", valueChain: "", indicator: "", target: "" }]);
      } else {
        toast.error("Main Activity not found");
        navigate("/projects/main-activities");
      }
    }
  }, [mode, id, items, navigate]);

  const updateIndicator = (index: number, field: keyof IndicatorRow, value: string) => {
    setIndicators((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)));
  };

  const addIndicator = () => {
    setIndicators((current) => [...current, { id: crypto.randomUUID(), category: "ICT", valueChain: "", indicator: "", target: "" }]);
  };

  const removeIndicator = (index: number) => {
    setIndicators((current) => (current.length > 1 ? current.filter((_, rowIndex) => rowIndex !== index) : current));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Activity name is required"); return; }
    const cleanedIndicators = indicators
      .filter((row) => row.indicator.trim())
      .map((row) => ({
        category: row.category,
        valueChain: row.category === "Value Chain" ? row.valueChain : "",
        indicator: row.indicator.trim(),
        target: row.target.trim(),
      }));
    try {
      if (mode === "create") {
        await createItem.mutateAsync({ name: name.trim(), indicators: cleanedIndicators });
        toast.success("Main Activity created successfully");
      } else {
        await updateItem.mutateAsync({ id: id!, name: name.trim(), indicators: cleanedIndicators });
        toast.success("Main Activity updated successfully");
      }
      navigate("/projects/main-activities");
    } catch {
      toast.error("Failed to save Main Activity");
    }
  };

  const isView = mode === "view";
  const activeMainActivityId = mode === "create" ? "" : id ?? "";
  const valueChainOptions = (category: string) => {
    if (category !== "Value Chain" || !activeMainActivityId) {
      return [] as string[];
    }
    const chains = subActivities
      .filter((item) => item.mainActivityId === activeMainActivityId && item.category === "Value Chain")
      .map((item) => item.valueChain)
      .filter(Boolean);
    return Array.from(new Set(chains));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          mode === "create"
            ? "Add New Activity"
            : mode === "edit"
            ? "Edit Main Activity"
            : "View Main Activity"
        }
        description={
          mode === "create"
            ? "Create a new Main Activity."
            : mode === "edit"
            ? "Update the Main Activity details."
            : "Main Activity details."
        }
        actions={
          <Button asChild variant="outline">
            <Link to="/projects/main-activities">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold">Activity Details</h2>
          <div className="space-y-1.5 max-w-md">
            <Label htmlFor="name">
              Activity Name {!isView && <span className="text-red-600">*</span>}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="e.g. Field Data Collection"
              disabled={isView}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Indicators and Targets</h3>
                <p className="text-sm text-muted-foreground">Add one or more activity indicators with their targets.</p>
              </div>
              {!isView && (
                <Button type="button" variant="outline" onClick={addIndicator} className="gap-2">
                  <Plus className="h-4 w-4" /> Add Indicator
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {indicators.map((indicator, index) => (
                <div key={indicator.id} className="rounded-lg border border-border bg-muted/20 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">Indicator {index + 1}</p>
                    {!isView && indicators.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeIndicator(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="space-y-1.5">
                      <Label>Category</Label>
                      <Select value={indicator.category} onValueChange={(value) => updateIndicator(index, "category", value)} disabled={isView}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ICT">ICT</SelectItem>
                          <SelectItem value="Value Chain">Value Chain</SelectItem>
                          <SelectItem value="Project Coordination">Project Coordination</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Value Chain</Label>
                      <Select
                        value={indicator.valueChain}
                        onValueChange={(value) => updateIndicator(index, "valueChain", value)}
                        disabled={isView || indicator.category !== "Value Chain" || valueChainOptions(indicator.category).length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={indicator.category === "Value Chain" ? (valueChainOptions(indicator.category).length ? "Select Value Chain" : "No value chains available") : "Select Category first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {valueChainOptions(indicator.category).map((valueChain) => (
                            <SelectItem key={valueChain} value={valueChain}>{valueChain}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {indicator.category === "Value Chain" && valueChainOptions(indicator.category).length === 0 && !isView && (
                        <p className="text-xs text-muted-foreground">No value chains are available for this main activity and category yet.</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Indicator</Label>
                      <Input
                        value={indicator.indicator}
                        onChange={(e) => updateIndicator(index, "indicator", e.target.value)}
                        placeholder="e.g. Number of trainings completed"
                        disabled={isView}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Target</Label>
                      <Input
                        value={indicator.target}
                        onChange={(e) => updateIndicator(index, "target", e.target.value)}
                        placeholder="e.g. 100 or Quarterly"
                        disabled={isView}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {!isView && (
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate("/projects/main-activities")}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Save className="h-4 w-4" />
              {mode === "create" ? "Save Activity" : "Update Activity"}
            </Button>
          </div>
        )}

        {isView && (
          <div className="mt-4 flex justify-end gap-2">
            <Button asChild variant="outline">
              <Link to={`/projects/main-activities/${id}/edit`}>Edit</Link>
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
