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
import { useProjects, useAllMappings, useDeleteProject } from "@/hooks/useProjectsApi";
import type { Project } from "@/utils/types";

const PAGE_SIZE = 6;

export default function Projects() {
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();
  const { data: mappings = [] } = useAllMappings();
  const deleteProject = useDeleteProject();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const mappedIds = useMemo(
    () => new Set(mappings.map((m) => String(m.project))),
    [mappings],
  );

  const effectiveStatus = (p: Project): string => (mappedIds.has(p.id) ? "Active" : "Pending");

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesQ =
        !q ||
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.id.toLowerCase().includes(q.toLowerCase());
      const es = mappedIds.has(p.id) ? "Active" : "Pending";
      const matchesS = status === "All" || es === status;
      return matchesQ && matchesS;
    });
  }, [q, status, projects, mappedIds]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async (id: string) => {
    try {
      await deleteProject.mutateAsync(id);
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Manage KALRO projects and track delivery status."
        actions={
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/projects/new">
              <Plus className="h-4 w-4" /> Add New Project
            </Link>
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by project name or ID..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All statuses</SelectItem>
              {PROJECT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">Logo</TableHead>
                <TableHead>Project Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    No projects match your filters.
                  </TableCell>
                </TableRow>
              )}
              {pageItems.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                      {p.logo}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      to={mappedIds.has(p.id) ? `/projects/${p.id}/view` : `/projects/${p.id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {p.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{p.id}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{p.startDate}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{p.endDate}</TableCell>
                  <TableCell>
                    <StatusBadge status={effectiveStatus(p)} />
                  </TableCell>
                  <TableCell className="text-right">
                    {deleteId === p.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-muted-foreground">Delete project?</span>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>
                          Yes
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>
                          No
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="View project details"
                          onClick={() => navigate(`/projects/${p.id}/view`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="Edit project"
                          onClick={() => navigate(`/projects/${p.id}/edit`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete project"
                          onClick={() => setDeleteId(p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between border-t border-border p-4 text-sm">
          <span className="text-muted-foreground">
            Showing {pageItems.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
            {(page - 1) * PAGE_SIZE + pageItems.length} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <span className="text-muted-foreground">
              Page {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
