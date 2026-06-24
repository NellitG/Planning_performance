import { Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useComponents, useCreateComponent, useUpdateComponent } from "@/hooks/useProjectsApi";

interface ComponentFormProps {
  mode?: "create" | "edit";
}

export default function ComponentForm({ mode = "create" }: ComponentFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: items = [] } = useComponents();
  const createComponent = useCreateComponent();
  const updateComponent = useUpdateComponent();
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "edit" && id && items.length) {
      const item = items.find((c) => c.id === id);
      if (item) setTitle(item.title);
      else { toast.error("Key Result Area not found"); navigate("/projects/components"); }
    }
  }, [mode, id, items, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("KRA title is required"); return; }
    try {
      if (mode === "create") {
        await createComponent.mutateAsync(title);
        toast.success("Key Result Area created successfully");
      } else {
        await updateComponent.mutateAsync({ id: id!, title });
        toast.success("Key Result Area updated successfully");
      }
      navigate("/projects/components");
    } catch {
      toast.error("Failed to save Key Result Area");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Create Key Result Area" : "Edit Key Result Area"}
        description={mode === "create" ? "Add a new KRA to the Projects module." : "Update the KRA details."}
        actions={
          <Button asChild variant="outline">
            <Link to="/projects/components"><ArrowLeft className="h-4 w-4" /> Back</Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold">KRA Details</h2>
          <div className="space-y-1.5 max-w-md">
            <Label htmlFor="title">
              Key Result Area Title <span className="text-red-600">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(""); }}
              placeholder="e.g. Research & Innovation"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/projects/components")}>
            Cancel
          </Button>
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="h-4 w-4" /> {mode === "create" ? "Save KRA" : "Update KRA"}
          </Button>
        </div>
      </form>
    </div>
  );
}
