import { Link } from "react-router-dom";
import { useState } from "react";
import { Plus, Search, ChevronLeft, ChevronRight, Eye, Pencil, Trash2, Boxes } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useComponents, useDeleteComponent } from "@/hooks/useProjectsApi";

const PAGE_SIZE = 8;

export default function Components() {
  const { data: items = [] } = useComponents();
  const deleteComponent = useDeleteComponent();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = items.filter((c) =>
    !q || c.title.toLowerCase().includes(q.toLowerCase()),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async (id: string) => {
    try {
      await deleteComponent.mutateAsync(id);
      toast.success("Key Result Area deleted");
    } catch {
      toast.error("Failed to delete Key Result Area");
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Key Result Areas"
        description="Manage KRAs. Each KRA can have strategic objectives and strategies."
        actions={
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/projects/components/new">
              <Plus className="h-4 w-4" /> Create KRA
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Boxes className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Key Result Areas</p>
              <p className="text-2xl font-bold text-foreground">{items.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search KRAs..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <span className="text-sm text-muted-foreground">{filtered.length} KRA{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Key Result Area</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                    {q ? "No KRAs match your search." : "No KRAs yet. Click 'Create KRA' to get started."}
                  </TableCell>
                </TableRow>
              )}
              {pageItems.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground text-xs">{(page - 1) * PAGE_SIZE + idx + 1}</TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.createdAt}</TableCell>
                  <TableCell className="text-right">
                    {deleteId === item.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-muted-foreground">Confirm delete?</span>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>Yes</Button>
                        <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>No</Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild size="sm" variant="ghost">
                          <Link to={`/projects/components/${item.id}/view`}>
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="ghost">
                          <Link to={`/projects/components/${item.id}/edit`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteId(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
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
            {filtered.length === 0 ? "0" : `${(page - 1) * PAGE_SIZE + 1}–${(page - 1) * PAGE_SIZE + pageItems.length}`} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <span className="text-muted-foreground">Page {page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
