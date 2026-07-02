import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateSubSubActivities,
  useMainActivities,
  useSubActivities,
  useSubSubActivities,
  useUpdateSubSubActivity,
} from "@/hooks/useProjectsApi";

interface Props {
  mode?: "create" | "edit" | "view";
}

interface ActivityRow {
  key: number;
  name: string;
}

const money = new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" });
let nextKey = 1;

export default function SubSubActivityForm({ mode = "create" }: Props) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: mainActivities = [] } = useMainActivities();
  const { data: subActivities = [] } = useSubActivities();
  const { data: records = [], isFetched } = useSubSubActivities();
  const createItems = useCreateSubSubActivities();
  const updateItem = useUpdateSubSubActivity();
  const [mainActivityId, setMainActivityId] = useState("");
  const [subActivityId, setSubActivityId] = useState("");
  const [valueChain, setValueChain] = useState("");
  const [approvedBudget, setApprovedBudget] = useState("");
  const [rows, setRows] = useState<ActivityRow[]>([{ key: nextKey++, name: "" }]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedSubActivity = useMemo(
    () => subActivities.find((item) => item.id === subActivityId),
    [subActivities, subActivityId],
  );
  const availableSubActivities = useMemo(
    () => subActivities.filter((item) => item.mainActivityId === mainActivityId),
    [mainActivityId, subActivities],
  );
  const category = selectedSubActivity?.category ?? "";
  const valueChains = useMemo(() => {
    const stored = selectedSubActivity?.valueChain;
    if (!stored) return [];
    return Array.isArray(stored)
      ? stored
      : stored
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
  }, [selectedSubActivity]);
  const isView = mode === "view";
  const hasValidBudget =
    approvedBudget !== "" && Number.isFinite(Number(approvedBudget)) && Number(approvedBudget) >= 0;
  const budgetCanBeEntered =
    Boolean(subActivityId) && (category !== "Value Chain" || Boolean(valueChain));

  useEffect(() => {
    if (mode === "create" || !id || !isFetched) return;
    const item = records.find((record) => record.id === id);
    if (!item) {
      toast.error("Sub-Sub Activity not found");
      navigate("/projects/sub-sub-activities");
      return;
    }
    setMainActivityId(
      item.subActivityId
        ? (subActivities.find((subActivity) => subActivity.id === item.subActivityId)
            ?.mainActivityId ?? "")
        : "",
    );
    setSubActivityId(item.subActivityId);
    setValueChain(item.valueChain);
    setApprovedBudget(item.approvedActivityBudget);
    setRows([{ key: nextKey++, name: item.name }]);
  }, [id, isFetched, mode, navigate, records, subActivities]);

  const updateRow = (key: number, value: string) => {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, name: value } : row)));
    setErrors((current) => ({ ...current, [`name-${key}`]: "" }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!mainActivityId) next.mainActivityId = "Please select a Main Activity.";
    if (!subActivityId) next.subActivityId = "Please select a Sub Activity.";
    if (category === "Value Chain" && !valueChain) next.valueChain = "Please select a Value Chain.";
    if (
      approvedBudget === "" ||
      !Number.isFinite(Number(approvedBudget)) ||
      Number(approvedBudget) < 0
    ) {
      next.approvedBudget = "Enter a valid approved budget of zero or more.";
    }
    rows.forEach((row) => {
      if (category === "Value Chain" && !row.name.trim()) {
        next[`name-${row.key}`] = "Sub-Sub Activity name is required for Value Chain activities.";
      }
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    const payload = rows.map((row) => ({
      subActivityId,
      valueChain: category === "Value Chain" ? valueChain : "",
      name: row.name.trim(),
      approvedActivityBudget: Number(approvedBudget).toFixed(2),
    }));
    try {
      if (mode === "edit") {
        await updateItem.mutateAsync({ id: id!, ...payload[0] });
        toast.success("Sub-Sub Activity updated successfully");
      } else {
        await createItems.mutateAsync(payload);
        toast.success(
          `${payload.length} Sub-Sub Activit${payload.length === 1 ? "y" : "ies"} created successfully`,
        );
      }
      navigate("/projects/sub-sub-activities");
    } catch {
      toast.error("Failed to save Sub-Sub Activity. Please review the fields and try again.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          mode === "create"
            ? "Create Sub-Sub Activity"
            : mode === "edit"
              ? "Edit Sub-Sub Activity"
              : "View Sub-Sub Activity"
        }
        description="Link approved activity budgets to the correct Sub Activity and value chain."
        actions={
          <Button asChild variant="outline">
            <Link to="/projects/sub-sub-activities">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="mainActivity">
                Main Activity {!isView && <span className="text-red-600">*</span>}
              </Label>
              {isView ? (
                <Input
                  value={mainActivities.find((item) => item.id === mainActivityId)?.name ?? ""}
                  disabled
                />
              ) : (
                <select
                  id="mainActivity"
                  value={mainActivityId}
                  disabled={mode === "edit"}
                  onChange={(event) => {
                    setMainActivityId(event.target.value);
                    setSubActivityId("");
                    setValueChain("");
                    setApprovedBudget("");
                    setRows([{ key: nextKey++, name: "" }]);
                    setErrors({});
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select Main Activity</option>
                  {mainActivities.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.mainActivityId && (
                <p className="text-xs text-red-600">{errors.mainActivityId}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subActivity">
                Sub Activity {!isView && <span className="text-red-600">*</span>}
              </Label>
              {isView ? (
                <Input value={selectedSubActivity?.name ?? ""} disabled />
              ) : (
                <select
                  id="subActivity"
                  value={subActivityId}
                  disabled={mode === "edit" || !mainActivityId}
                  onChange={(event) => {
                    setSubActivityId(event.target.value);
                    setValueChain("");
                    setApprovedBudget("");
                    setRows([{ key: nextKey++, name: "" }]);
                    setErrors({});
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select Sub Activity</option>
                  {availableSubActivities.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.subActivityId && (
                <p className="text-xs text-red-600">{errors.subActivityId}</p>
              )}
              {!isView && mainActivityId && availableSubActivities.length === 0 && (
                <p className="text-xs text-amber-600">
                  No Sub Activities are linked to this Main Activity.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                placeholder="Determined by the selected Sub Activity"
                readOnly
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Automatically inherited from the selected Sub Activity.
              </p>
            </div>
          </div>

          {category === "Value Chain" && (
            <div className="max-w-xl space-y-1.5">
              <Label htmlFor="valueChain">
                Value Chain {!isView && <span className="text-red-600">*</span>}
              </Label>
              {isView ? (
                <Input value={valueChain} disabled />
              ) : (
                <select
                  id="valueChain"
                  value={valueChain}
                  onChange={(event) => {
                    setValueChain(event.target.value);
                    setApprovedBudget("");
                    setErrors((current) => ({
                      ...current,
                      valueChain: "",
                      approvedBudget: "",
                    }));
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select Value Chain</option>
                  {valueChains.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              )}
              {errors.valueChain && <p className="text-xs text-red-600">{errors.valueChain}</p>}
              <p className="text-xs text-muted-foreground">
                Only value chains assigned to this Sub Activity are available.
              </p>
            </div>
          )}

          {budgetCanBeEntered && (
            <div className="max-w-xl space-y-1.5">
              <Label htmlFor="approvedBudget">
                Approved Activity Budget {!isView && <span className="text-red-600">*</span>}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  KES
                </span>
                <Input
                  id="approvedBudget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={approvedBudget}
                  disabled={isView}
                  onChange={(event) => {
                    setApprovedBudget(event.target.value);
                    setErrors((current) => ({ ...current, approvedBudget: "" }));
                  }}
                  className="pl-12"
                  placeholder="0.00"
                />
              </div>
              {hasValidBudget && (
                <p className="text-xs text-muted-foreground">
                  {money.format(Number(approvedBudget))}
                </p>
              )}
              {errors.approvedBudget && (
                <p className="text-xs text-red-600">{errors.approvedBudget}</p>
              )}
              <p className="text-xs text-muted-foreground">
                This budget applies to every Sub-Sub Activity added below.
              </p>
            </div>
          )}
        </div>

        {subActivityId && hasValidBudget && (
          <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div>
              <h2 className="font-semibold">Sub-Sub Activities</h2>
              <p className="text-sm text-muted-foreground">
                {category === "Value Chain"
                  ? "Add one or more activities for the selected value chain."
                  : "The activity name is optional for this category."}
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-3 border-b border-border bg-muted/50 px-4 py-3">
                <span className="text-xs font-medium text-muted-foreground">#</span>
                <Label>
                  Sub-Sub Activity Name{" "}
                  {category === "Value Chain" && !isView && <span className="text-red-600">*</span>}
                </Label>
                <span className="sr-only">Actions</span>
              </div>

              <div className="divide-y divide-border">
                {rows.map((row, index) => (
                  <div
                    key={row.key}
                    className="grid grid-cols-[2.5rem_1fr_2.5rem] items-start gap-3 px-4 py-3"
                  >
                    <span className="pt-2 text-sm text-muted-foreground">{index + 1}.</span>
                    <div className="space-y-1.5">
                      <Input
                        id={`name-${row.key}`}
                        aria-label={`Sub-Sub Activity ${index + 1}`}
                        value={row.name}
                        disabled={isView}
                        onChange={(event) => updateRow(row.key, event.target.value)}
                        placeholder="e.g. Land Preparation"
                      />
                      {errors[`name-${row.key}`] && (
                        <p className="text-xs text-red-600">{errors[`name-${row.key}`]}</p>
                      )}
                    </div>
                    {!isView &&
                      mode === "create" &&
                      category === "Value Chain" &&
                      rows.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-red-600"
                          title={`Remove row ${index + 1}`}
                          onClick={() =>
                            setRows((current) => current.filter((item) => item.key !== row.key))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                  </div>
                ))}
              </div>
            </div>

            {!isView && mode === "create" && category === "Value Chain" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setRows((current) => [...current, { key: nextKey++, name: "" }])}
              >
                <Plus className="h-4 w-4" /> Add Another Sub-Sub Activity
              </Button>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          {isView ? (
            <Button asChild>
              <Link to={`/projects/sub-sub-activities/${id}/edit`}>Edit</Link>
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/projects/sub-sub-activities")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createItems.isPending || updateItem.isPending}>
                <Save className="h-4 w-4" /> {mode === "edit" ? "Update" : "Save"}
              </Button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
