import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Plus, Search, ChevronLeft, ChevronRight, Eye, Pencil, Trash2, Download } from "lucide-react";
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

function cleanPdfText(value: unknown) {
  return String(value ?? "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function downloadProjectPdf(project: Project, status: string) {
  const lines = [
    "KALRO Planning, Performance Management System",
    "Project Summary",
    "",
    `Project: ${project.name}`,
    `Project ID: ${project.id}`,
    `Status: ${status}`,
    `Start Date: ${project.startDate || "N/A"}`,
    `End Date: ${project.endDate || "N/A"}`,
    `Coordinator: ${project.coordinator || "N/A"}`,
    `Budget: ${project.budget ?? "N/A"}`,
    `Background: ${project.background || "N/A"}`,
    `Project Objectives: ${project.projectObjectives || "N/A"}`,
    `Expected Outputs: ${project.expectedOutputs || "N/A"}`,
    `Total Beneficiaries: ${project.totalBeneficiaries ?? "N/A"}`,
    `Women: ${project.women ?? "N/A"}`,
    `Men: ${project.men ?? "N/A"}`,
    `Youth: ${project.youth ?? "N/A"}`,
    `PWDs: ${project.pwds ?? "N/A"}`,
  ].slice(0, 52);
  const stream = [
    "BT",
    "/F1 16 Tf 50 800 Td (KALRO Project Summary) Tj",
    ...lines.map((line, index) => `/F1 ${index < 2 ? 12 : 10} Tf 0 -14 Td (${cleanPdfText(line).slice(0, 112)}) Tj`),
    "ET",
  ].join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${cleanPdfText(project.name || "project").replace(/\\[()]/g, "").replace(/\s+/g, "-").toLowerCase()}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}

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
                          className="h-8 w-8 p-0"
                          title="Download PDF"
                          onClick={() => downloadProjectPdf(p, effectiveStatus(p))}
                        >
                          <Download className="h-4 w-4" />
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
