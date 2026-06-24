import { Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useComponents, useObjectives, useCreateObjective, useUpdateObjective } from "@/hooks/useProjectsApi";

interface ProjectObjectiveFormProps {
  mode?: "create" | "edit";
}

interface FormState {
  componentId: string;
  text: string;
}

export default function ProjectObjectiveForm({ mode = "create" }: ProjectObjectiveFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: components = [] } = useComponents();
  const { data: objectives = [] } = useObjectives();
  const createObjective = useCreateObjective();
  const updateObjective = useUpdateObjective();
  const [form, setForm] = useState<FormState>({ componentId: "", text: "" });
  const [errors, setErrors] = useState<Partial<FormState>>({});

  useEffect(() => {
    if (mode === "edit" && id && objectives.length) {
      const item = objectives.find((o) => o.id === id);
      if (item) setForm({ componentId: item.componentId, text: item.text });
      else { toast.error("Objective not found"); navigate("/projects/strategic-objectives"); }
    }
  }, [mode, id, objectives, navigate]);

  const update = (k: keyof FormState, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Partial<FormState> = {};
    if (!form.componentId) errs.componentId = "Please select a Key Result Area";
    if (!form.text.trim()) errs.text = "Strategic objective text is required";
    setErrors(errs);
    if (Object.keys(errs).length) { toast.error("Please fix the errors"); return; }

    try {
      if (mode === "create") {
        await createObjective.mutateAsync({ componentId: form.componentId, text: form.text });
        toast.success("Strategic objective created successfully");
      } else {
        await updateObjective.mutateAsync({ id: id!, componentId: form.componentId, text: form.text });
        toast.success("Strategic objective updated successfully");
      }
      navigate("/projects/strategic-objectives");
    } catch {
      toast.error("Failed to save strategic objective");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Create Strategic Objective" : "Edit Strategic Objective"}
        description={mode === "create" ? "Add a new strategic objective linked to a Key Result Area." : "Update the strategic objective details."}
        actions={
          <Button asChild variant="outline">
            <Link to="/projects/strategic-objectives"><ArrowLeft className="h-4 w-4" /> Back</Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold">Objective Details</h2>

          {components.length === 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              No Key Result Areas available.{" "}
              <Link to="/projects/components/new" className="underline font-medium">Create a KRA first</Link>{" "}
              before adding objectives.
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 max-w-lg">
            <div className="space-y-1.5">
              <Label>
                Key Result Area <span className="text-red-600">*</span>
              </Label>
              <Select value={form.componentId} onValueChange={(v) => update("componentId", v)} disabled={components.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Key Result Area" />
                </SelectTrigger>
                <SelectContent>
                  {components.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.componentId && <p className="text-xs text-red-600">{errors.componentId}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="text">
                Strategic Objective <span className="text-red-600">*</span>
              </Label>
              <Input
                id="text"
                value={form.text}
                onChange={(e) => update("text", e.target.value)}
                placeholder="e.g. Increase research output by 30%"
              />
              {errors.text && <p className="text-xs text-red-600">{errors.text}</p>}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/projects/strategic-objectives")}>
            Cancel
          </Button>
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={components.length === 0}>
            <Save className="h-4 w-4" /> {mode === "create" ? "Save Objective" : "Update Objective"}
          </Button>
        </div>
      </form>
    </div>
  );
}
