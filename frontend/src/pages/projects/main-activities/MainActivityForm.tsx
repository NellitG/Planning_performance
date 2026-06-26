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
} from "@/hooks/useProjectsApi";

interface MainActivityFormProps {
  mode?: "create" | "edit" | "view";
}

export default function MainActivityForm({ mode = "create" }: MainActivityFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: items = [] } = useMainActivities();
  const createItem = useCreateMainActivity();
  const updateItem = useUpdateMainActivity();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if ((mode === "edit" || mode === "view") && id && items.length) {
      const item = items.find((a) => a.id === id);
      if (item) setName(item.name);
      else {
        toast.error("Main Activity not found");
        navigate("/projects/main-activities");
      }
    }
  }, [mode, id, items, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Activity name is required"); return; }
    try {
      if (mode === "create") {
        await createItem.mutateAsync(name.trim());
        toast.success("Main Activity created successfully");
      } else {
        await updateItem.mutateAsync({ id: id!, name: name.trim() });
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
