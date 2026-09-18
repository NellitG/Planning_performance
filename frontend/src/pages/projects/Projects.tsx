import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Plus, Search, ChevronLeft, ChevronRight, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PROJECT_STATUSES } from "@/utils/mockData";
import { useDeleteMainProject, useMainProjects } from "@/hooks/useProjectsApi";
import type { MainProject } from "@/utils/types";

const PAGE_SIZE = 6;
function displayStatus(project: MainProject) {
  const titles = project.projectTitles;
  if (titles.length && titles.every((title) => !title.isDraft)) return "Completed";
  if (titles.some((title) => title.currentStep > 1 || !title.isDraft)) return "Ongoing";
  return project.status || "Not Started";
}

export default function Projects() {
  const navigate = useNavigate();
  const { data: projects = [] } = useMainProjects();
  const deletion = useDeleteMainProject();
  const [q, setQ] = useState(""); const [status, setStatus] = useState("All"); const [page, setPage] = useState(1); const [deleteId, setDeleteId] = useState<string | null>(null);
  const filtered = useMemo(() => projects.filter((project) => (!q || project.name.toLowerCase().includes(q.toLowerCase()) || project.id.includes(q)) && (status === "All" || displayStatus(project) === status)), [projects, q, status]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)); const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const remove = async (id: string) => { try { await deletion.mutateAsync(id); toast.success("Main Project and its titles were deleted."); } catch { toast.error("Failed to delete Main Project."); } setDeleteId(null); };
  return <div className="space-y-6">
    <PageHeader title="Projects" description="Manage Main Projects and their independent project-title workflows." actions={<Button asChild className="bg-green-700 text-primary-foreground"><Link to="/projects/new"><Plus className="h-4 w-4" /> Add New Project</Link></Button>} />
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search Main Project..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="pl-9" /></div><Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}><SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All statuses</SelectItem>{PROJECT_STATUSES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
      <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="w-14">Logo</TableHead><TableHead>Main Project</TableHead><TableHead>Start Date</TableHead><TableHead>End Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
        {!pageItems.length && <TableRow><TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">No Main Projects match your filters.</TableCell></TableRow>}
        {pageItems.map((project) => <TableRow key={project.id}><TableCell><div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{project.logo}</div></TableCell><TableCell><Link to={`/projects/main/${project.id}`} className="font-medium text-foreground hover:text-primary hover:underline">{project.name}</Link><div className="text-xs text-muted-foreground">{project.projectTitles.length} project title{project.projectTitles.length === 1 ? "" : "s"}</div></TableCell><TableCell className="whitespace-nowrap text-sm">{project.startDate || "—"}</TableCell><TableCell className="whitespace-nowrap text-sm">{project.endDate || "—"}</TableCell><TableCell><StatusBadge status={displayStatus(project)} /></TableCell><TableCell className="text-right">{deleteId === project.id ? <div className="flex items-center justify-end gap-2"><span className="text-xs text-muted-foreground">Delete Main Project?</span><Button size="sm" variant="destructive" onClick={() => remove(project.id)}>Yes</Button><Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>No</Button></div> : <div className="flex items-center justify-end gap-1"><Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="View Main Project" onClick={() => navigate(`/projects/main/${project.id}`)}><Eye className="h-4 w-4" /></Button><Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Edit Main Project" onClick={() => navigate(`/projects/main/${project.id}?edit=1`)}><Pencil className="h-4 w-4" /></Button><Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:bg-red-50 hover:text-red-600" title="Delete Main Project" onClick={() => setDeleteId(project.id)}><Trash2 className="h-4 w-4" /></Button></div>}</TableCell></TableRow>)}
      </TableBody></Table></div>
      <div className="flex items-center justify-between border-t border-border p-4 text-sm"><span className="text-muted-foreground">Showing {pageItems.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{(page - 1) * PAGE_SIZE + pageItems.length} of {filtered.length}</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft className="h-4 w-4" /> Prev</Button><span className="text-muted-foreground">Page {page} / {totalPages}</span><Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}>Next <ChevronRight className="h-4 w-4" /></Button></div></div>
    </div>
  </div>;
}
