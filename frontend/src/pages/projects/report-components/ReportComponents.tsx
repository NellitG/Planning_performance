import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Eye, Pencil, Plus, Search, Trash2, Boxes } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDeleteProjectComponent, useProjectComponents } from "@/hooks/useProjectsApi";

const PAGE_SIZE = 8;

export default function ReportComponents() {
  const { data: items = [] } = useProjectComponents();
  const deleteItem = useDeleteProjectComponent();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: "name" | "createdAt"; direction: "asc" | "desc" }>({
    key: "createdAt",
    direction: "desc",
  });

  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    return items
      .filter((item) => !term || item.name.toLowerCase().includes(term))
      .sort((a, b) => {
        const av = String(a[sort.key] ?? "");
        const bv = String(b[sort.key] ?? "");
        return sort.direction === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
  }, [items, q, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key: typeof sort.key) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem.mutateAsync(id);
      toast.success("Component deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete Component");
    }
    setDeleteId(null);
  };

  const SortButton = ({ label, sortKey }: { label: string; sortKey: typeof sort.key }) => (
    <button type="button" onClick={() => toggleSort(sortKey)} className="inline-flex items-center gap-1">
      {label}
      <ArrowUpDown className="h-3.5 w-3.5" />
    </button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Components"
        description="Manage project reporting Components."
        actions={
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/projects/report-components/new">
              <Plus className="h-4 w-4" /> Add New Component
            </Link>
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:max-w-xs">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Boxes className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Components</p>
            <p className="text-2xl font-bold text-foreground">{items.length}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search components..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <span className="text-sm text-muted-foreground">{filtered.length} component{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortButton label="Component" sortKey="name" /></TableHead>
                <TableHead><SortButton label="Date Created" sortKey="createdAt" /></TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-12 text-center text-sm text-muted-foreground">
                    {q ? "No components match your search." : "No Components yet. Click 'Add New Component' to get started."}
                  </TableCell>
                </TableRow>
              )}
              {pageItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    {deleteId === item.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-muted-foreground">Confirm delete?</span>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>Yes</Button>
                        <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>No</Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Button asChild size="sm" variant="ghost"><Link to={`/projects/report-components/${item.id}/view`}><Eye className="h-3.5 w-3.5" /></Link></Button>
                        <Button asChild size="sm" variant="ghost"><Link to={`/projects/report-components/${item.id}/edit`}><Pencil className="h-3.5 w-3.5" /></Link></Button>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => setDeleteId(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between border-t border-border p-4 text-sm">
          <span className="text-muted-foreground">{filtered.length === 0 ? "0" : `${(page - 1) * PAGE_SIZE + 1}-${(page - 1) * PAGE_SIZE + pageItems.length}`} of {filtered.length}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /> Prev</Button>
            <span className="text-muted-foreground">Page {page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
