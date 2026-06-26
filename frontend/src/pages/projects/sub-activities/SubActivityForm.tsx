import { Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useSubActivities,
  useCreateSubActivity,
  useUpdateSubActivity,
} from "@/hooks/useProjectsApi";

interface SubActivityFormProps {
  mode?: "create" | "edit" | "view";
}

export default function SubActivityForm({ mode = "create" }: SubActivityFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: items = [] } = useSubActivities();
  const createItem = useCreateSubActivity();
  const updateItem = useUpdateSubActivity();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if ((mode === "edit" || mode === "view") && id && items.length) {
      const item = items.find((a) => a.id === id);
      if (item) setName(item.name);
      else {
        toast.error("Sub Activity not found");
        navigate("/projects/sub-activities");
      }
    }
  }, [mode, id, items, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Sub Activity name is required"); return; }
    try {
      if (mode === "create") {
        await createItem.mutateAsync(name.trim());
        toast.success("Sub Activity created successfully");
      } else {
        await updateItem.mutateAsync({ id: id!, name: name.trim() });
        toast.success("Sub Activity updated successfully");
      }
      navigate("/projects/sub-activities");
    } catch {
      toast.error("Failed to save Sub Activity");
    }
  };

  const isView = mode === "view";

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          mode === "create"
            ? "Add New Sub Activity"
            : mode === "edit"
            ? "Edit Sub Activity"
            : "View Sub Activity"
        }
        description={
          mode === "create"
            ? "Create a new Sub Activity."
            : mode === "edit"
            ? "Update the Sub Activity details."
            : "Sub Activity details."
        }
        actions={
          <Button asChild variant="outline">
            <Link to="/projects/sub-activities">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold">Sub Activity Details</h2>
          <div className="space-y-1.5 max-w-md">
            <Label htmlFor="name">
              Sub Activity Name {!isView && <span className="text-red-600">*</span>}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="e.g. Sample Processing"
              disabled={isView}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        </div>

        {!isView && (
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate("/projects/sub-activities")}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Save className="h-4 w-4" />
              {mode === "create" ? "Save Sub Activity" : "Update Sub Activity"}
            </Button>
          </div>
        )}

        {isView && (
          <div className="mt-4 flex justify-end gap-2">
            <Button asChild variant="outline">
              <Link to={`/projects/sub-activities/${id}/edit`}>Edit</Link>
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
