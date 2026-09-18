import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, CheckCircle2, Circle, Pencil, PlayCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { useMainProject, useUpdateMainProject } from "@/hooks/useProjectsApi";

function titleState(title: { isDraft: boolean; currentStep: number }) {
  if (!title.isDraft) return { label: "Completed", icon: CheckCircle2, color: "text-green-600" };
  if (title.currentStep > 1) return { label: `Step ${title.currentStep} of 9`, icon: PlayCircle, color: "text-amber-600" };
  return { label: "Not Started", icon: Circle, color: "text-muted-foreground" };
}

export default function MainProjectDetail() {
  const { id } = useParams<{ id: string }>(); const navigate = useNavigate(); const [params] = useSearchParams();
  const { data: project, isLoading, isError } = useMainProject(id); const update = useUpdateMainProject();
  const [editing, setEditing] = useState(params.get("edit") === "1");
  const [form, setForm] = useState({ name: "", description: "", startDate: "", endDate: "", status: "Not Started" });

  useEffect(() => { if (project) setForm({ name: project.name, description: project.description || "", startDate: project.startDate || "", endDate: project.endDate || "", status: project.status }); }, [project]);
  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Loading Main Project…</div>;
  if (isError || !project) return <div className="p-8 text-sm text-red-700">The requested Main Project could not be loaded.</div>;
  const save = async () => { try { await update.mutateAsync({ id: project.id, ...form, startDate: form.startDate || null, endDate: form.endDate || null }); toast.success("Main Project updated."); setEditing(false); } catch { toast.error("Failed to update Main Project."); } };
  return <div className="space-y-6">
    <PageHeader title="Main Project" description="Parent project overview and project-title workflow status." actions={<div className="flex gap-2"><Button asChild variant="outline">
      <Link to="/projects">
        <ArrowLeft className="h-4 w-4" /> Projects List</Link>
    </Button>
      <Button variant="outline" onClick={() => setEditing((value) => !value)}><Pencil className="h-4 w-4" /> {editing ? "Cancel" : "Edit Main Project"}</Button>
    </div>} />
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      {editing ? <div className="grid gap-4 md:grid-cols-2"><label className="space-y-1 text-sm font-medium">Main Project Name<Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label className="space-y-1 text-sm font-medium">Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"><option>Not Started</option>
          <option>Ongoing</option>
          <option>Completed</option>
          <option>Pending</option>
          <option>Delayed</option>
          <option>Suspended</option>
          <option>Terminated</option>
        </select>
        </label>
        <label className="space-y-1 text-sm font-medium">Start Date<Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></label>
        <label className="space-y-1 text-sm font-medium">End Date<Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></label>
        <label className="space-y-1 text-sm font-medium md:col-span-2">Description<Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <div className="md:col-span-2"><Button onClick={save} disabled={update.isPending} className="bg-primary text-primary-foreground"><Save className="h-4 w-4" /> Save Main Project</Button>
        </div>
      </div> : <div className="flex items-start gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">{project.logo}</div><div><div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold">{project.name}</h2>
          <StatusBadge status={project.status} />
        </div>{project.description && <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{project.description}</p>}
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Start: {project.startDate || "—"}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> End: {project.endDate || "—"}</span>
          </div>
        </div>
      </div>}
    </div>
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-4"><h3 className="font-semibold">Project Titles</h3>
        <p className="mt-1 text-xs text-muted-foreground">Each title has its own 9-step implementation data, documents, locations, finance and planning hierarchy.</p>
      </div>
      <div className="divide-y divide-border">{project.projectTitles.map((title, index) => {
        const state = titleState(title); const Icon = state.icon; return <div key={title.id} className="flex flex-wrap items-center gap-4 p-4">
          <span className="w-6 text-sm text-muted-foreground">{index + 1}.</span>
          <div className="min-w-48 flex-1"><Link to={`/projects/${title.id}/view`} className="font-medium hover:text-primary hover:underline">{title.name}</Link>
            <div className={`mt-1 flex items-center gap-1 text-xs ${state.color}`}><Icon className="h-3.5 w-3.5" /> {state.label}</div></div><Button size="sm" variant="outline" onClick={() => navigate(`/projects/${title.id}/${title.isDraft ? "edit" : "view"}`)}>{title.isDraft ? "Continue" : "View"}</Button>
        </div>;
      })}{!project.projectTitles.length && <p className="p-6 text-sm text-muted-foreground">No Project Titles have been created.</p>}</div>
    </div>
  </div>;
}
