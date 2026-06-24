import { Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import type { FormEvent, ReactNode } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROJECT_STATUSES } from "@/utils/mockData";
import { useProject, useCreateProject, useUpdateProject } from "@/hooks/useProjectsApi";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

interface ProjectForm {
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  status: string;
  lead: string;
  budget: string;
  description: string;
}

type FormErrors = Partial<Record<keyof ProjectForm, string>>;

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

function Field({ label, error, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label}{required && <span className="ml-0.5 text-red-600">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function NewProject() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { data: existing } = useProject(id);
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const [form, setForm] = useState<ProjectForm>({
    name: "", code: "", startDate: "", endDate: "",
    status: "Pending", lead: "", budget: "", description: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (isEdit && existing) {
      setForm((f) => ({
        ...f,
        name: existing.name ?? "",
        startDate: existing.startDate ?? "",
        endDate: existing.endDate ?? "",
        status: existing.status ?? "Pending",
        description: (existing as { description?: string }).description ?? "",
      }));
    }
  }, [isEdit, existing]);

  const update = (k: keyof ProjectForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = "Project name is required";
    if (!form.code.trim()) errs.code = "Project code is required";
    if (!form.startDate) errs.startDate = "Start date required";
    if (!form.endDate) errs.endDate = "End date required";
    if (form.startDate && form.endDate && form.endDate < form.startDate) errs.endDate = "End date must be after start";
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    const payload = {
      name: form.name.trim(),
      logo: initials(form.name) || "PR",
      description: form.description,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      status: form.status,
    };

    try {
      if (isEdit && id) {
        await updateProject.mutateAsync({ id, ...payload });
        toast.success("Project updated successfully");
      } else {
        await createProject.mutateAsync(payload);
        toast.success("Project created successfully");
      }
      navigate("/projects");
    } catch {
      toast.error(isEdit ? "Failed to update project" : "Failed to create project");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? "Edit Project" : "Add New Project"}
        description={isEdit ? "Update the details of this KALRO project." : "Register a new KALRO project with full details."}
        actions={
          <Button asChild variant="outline">
            <Link to="/projects"><ArrowLeft className="h-4 w-4" /> Back</Link>
          </Button>
        }
      />

      <form onSubmit={submit} className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold">Project Information</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Project Name" error={errors.name} required>
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Climate-Smart Agriculture Initiative" />
            </Field>
            <Field label="Project Code" error={errors.code} required>
              <Input value={form.code} onChange={(e) => update("code", e.target.value)} placeholder="KALRO-2025-XXX" />
            </Field>
            <Field label="Start Date" error={errors.startDate} required>
              <Input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
            </Field>
            <Field label="End Date" error={errors.endDate} required>
              <Input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} />
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => update("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Project Lead">
              <Input value={form.lead} onChange={(e) => update("lead", e.target.value)} placeholder="Full name" />
            </Field>
            <Field label="Approved Budget (KES)">
              <Input type="number" min="0" value={form.budget} onChange={(e) => update("budget", e.target.value)} placeholder="0" />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Description">
              <Textarea rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Brief project overview, objectives and scope" />
            </Field>
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/projects")}>Cancel</Button>
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="h-4 w-4" /> Save Project
          </Button>
        </div>
      </form>
    </div>
  );
}
