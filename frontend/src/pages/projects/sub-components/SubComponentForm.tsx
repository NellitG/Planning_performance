import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateProjectSubComponent,
  useProjectComponents,
  useProjectSubComponents,
  useUpdateProjectSubComponent,
} from "@/hooks/useProjectsApi";

interface Props {
  mode?: "create" | "edit" | "view";
}

export default function SubComponentForm({ mode = "create" }: Props) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: components = [] } = useProjectComponents();
  const { data: subComponents = [] } = useProjectSubComponents();
  const createItem = useCreateProjectSubComponent();
  const updateItem = useUpdateProjectSubComponent();
  const [componentId, setComponentId] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<{ componentId?: string; name?: string }>({});

  useEffect(() => {
    if ((mode === "edit" || mode === "view") && id && subComponents.length) {
      const item = subComponents.find((entry) => entry.id === id);
      if (!item) {
        toast.error("Sub Component not found");
        navigate("/projects/sub-components");
        return;
      }
      setComponentId(item.componentId);
      setName(item.name);
    }
  }, [id, mode, navigate, subComponents]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!componentId) nextErrors.componentId = "Please select a Component";
    if (!name.trim()) nextErrors.name = "Sub Component is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      if (mode === "create") {
        await createItem.mutateAsync({ componentId, name: name.trim() });
        toast.success("Sub Component created successfully");
      } else {
        await updateItem.mutateAsync({ id: id!, componentId, name: name.trim() });
        toast.success("Sub Component updated successfully");
      }
      navigate("/projects/sub-components");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save Sub Component");
    }
  };

  const isView = mode === "view";

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Add New Sub Component" : mode === "edit" ? "Edit Sub Component" : "View Sub Component"}
        description="Select a Component, then enter the Sub Component."
        actions={
          <Button asChild variant="outline">
            <Link to="/projects/sub-components">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div className="max-w-md space-y-1.5">
            <Label htmlFor="component">
              Component {!isView && <span className="text-red-600">*</span>}
            </Label>
            {isView ? (
              <Input value={components.find((item) => item.id === componentId)?.name ?? ""} disabled />
            ) : (
              <select
                id="component"
                value={componentId}
                onChange={(event) => {
                  setComponentId(event.target.value);
                  setErrors((prev) => ({ ...prev, componentId: undefined }));
                }}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">- Select Component -</option>
                {components.map((component) => (
                  <option key={component.id} value={component.id}>{component.name}</option>
                ))}
              </select>
            )}
            {errors.componentId && <p className="text-xs text-red-600">{errors.componentId}</p>}
            {!isView && components.length === 0 && (
              <p className="text-xs text-amber-600">
                No Components found.{" "}
                <Link to="/projects/report-components/new" className="font-medium underline">
                  Create one first.
                </Link>
              </p>
            )}
          </div>

          <div className="max-w-md space-y-1.5">
            <Label htmlFor="subComponent">
              Sub Component {!isView && <span className="text-red-600">*</span>}
            </Label>
            <Input
              id="subComponent"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="Enter sub component"
              disabled={isView}
            />
            {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
          </div>
        </div>

        {!isView && (
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate("/projects/sub-components")}>Cancel</Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
        )}

        {isView && (
          <div className="mt-4 flex justify-end">
            <Button asChild variant="outline">
              <Link to={`/projects/sub-components/${id}/edit`}>Edit</Link>
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
