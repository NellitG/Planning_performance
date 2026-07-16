import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateProjectComponent,
  useProjectComponents,
  useUpdateProjectComponent,
} from "@/hooks/useProjectsApi";

interface Props {
  mode?: "create" | "edit" | "view";
}

export default function ReportComponentForm({ mode = "create" }: Props) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: items = [] } = useProjectComponents();
  const createItem = useCreateProjectComponent();
  const updateItem = useUpdateProjectComponent();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if ((mode === "edit" || mode === "view") && id && items.length) {
      const item = items.find((entry) => entry.id === id);
      if (!item) {
        toast.error("Component not found");
        navigate("/projects/report-components");
        return;
      }
      setName(item.name);
    }
  }, [id, items, mode, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Component is required");
      return;
    }

    try {
      if (mode === "create") {
        await createItem.mutateAsync({ name: name.trim() });
        toast.success("Component created successfully");
      } else {
        await updateItem.mutateAsync({ id: id!, name: name.trim() });
        toast.success("Component updated successfully");
      }
      navigate("/projects/report-components");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save Component");
    }
  };

  const isView = mode === "view";

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Add New Component" : mode === "edit" ? "Edit Component" : "View Component"}
        description={mode === "create" ? "Create a reporting Component." : "Component details."}
        actions={
          <Button asChild variant="outline">
            <Link to="/projects/report-components">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="max-w-md space-y-1.5">
            <Label htmlFor="component">
              Component {!isView && <span className="text-red-600">*</span>}
            </Label>
            <Input
              id="component"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError("");
              }}
              placeholder="Enter component"
              disabled={isView}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        </div>

        {!isView && (
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate("/projects/report-components")}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
        )}

        {isView && (
          <div className="mt-4 flex justify-end">
            <Button asChild variant="outline">
              <Link to={`/projects/report-components/${id}/edit`}>Edit</Link>
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
