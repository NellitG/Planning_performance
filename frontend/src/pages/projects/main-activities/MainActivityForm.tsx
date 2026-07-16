import { Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useMainActivities,
  useCreateMainActivity,
  useUpdateMainActivity,
  useProjectSubComponents,
} from "@/hooks/useProjectsApi";

interface MainActivityFormProps {
  mode?: "create" | "edit" | "view";
}

export default function MainActivityForm({ mode = "create" }: MainActivityFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: items = [] } = useMainActivities();
  const { data: subComponents = [] } = useProjectSubComponents();
  const createItem = useCreateMainActivity();
  const updateItem = useUpdateMainActivity();
  const [subComponentId, setSubComponentId] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<{ subComponentId?: string; name?: string }>({});

  useEffect(() => {
    if ((mode === "edit" || mode === "view") && id && items.length) {
      const item = items.find((a) => a.id === id);
      if (item) {
        setSubComponentId(item.subComponentId ?? "");
        setName(item.name);
      } else {
        toast.error("Main Activity not found");
        navigate("/projects/main-activities");
      }
    }
  }, [mode, id, items, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!subComponentId) nextErrors.subComponentId = "Please select a Sub Component";
    if (!name.trim()) nextErrors.name = "Main Activity is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      if (mode === "create") {
        await createItem.mutateAsync({ subComponentId, name: name.trim() });
        toast.success("Main Activity created successfully");
      } else {
        await updateItem.mutateAsync({ id: id!, subComponentId, name: name.trim() });
        toast.success("Main Activity updated successfully");
      }
      navigate("/projects/main-activities");
    } catch {
      toast.error("Failed to save Main Activity");
    }
  };

  const isView = mode === "view";

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
            ? "Select a Sub Component, then enter the Main Activity."
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
            <Label htmlFor="subComponent">
              Sub Component {!isView && <span className="text-red-600">*</span>}
            </Label>
            {isView ? (
              <Input
                value={subComponents.find((item) => item.id === subComponentId)?.name ?? ""}
                disabled
              />
            ) : (
              <select
                id="subComponent"
                value={subComponentId}
                onChange={(e) => {
                  setSubComponentId(e.target.value);
                  setErrors((prev) => ({ ...prev, subComponentId: undefined }));
                }}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">- Select Sub Component -</option>
                {subComponents.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.componentName} - {item.name}
                  </option>
                ))}
              </select>
            )}
            {errors.subComponentId && <p className="text-xs text-red-600">{errors.subComponentId}</p>}
            {!isView && subComponents.length === 0 && (
              <p className="text-xs text-amber-600">
                No Sub Components found.{" "}
                <Link to="/projects/sub-components/new" className="font-medium underline">
                  Create one first.
                </Link>
              </p>
            )}
          </div>

          <div className="space-y-1.5 max-w-md">
            <Label htmlFor="name">
              Main Activity {!isView && <span className="text-red-600">*</span>}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="e.g. Field Data Collection"
              disabled={isView}
            />
            {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
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
