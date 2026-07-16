import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, ChevronRight as ChevronRightIcon, Eye, Layers2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeleteProjectSubComponent, useProjectComponents, useProjectSubComponents } from "@/hooks/useProjectsApi";
import type { ProjectComponent, ProjectSubComponent } from "@/utils/types";

const PAGE_SIZE = 8;

interface Group {
  component: ProjectComponent;
  subComponents: ProjectSubComponent[];
}

export default function SubComponents() {
  const { data: components = [] } = useProjectComponents();
  const { data: subComponents = [] } = useProjectSubComponents();
  const deleteItem = useDeleteProjectSubComponent();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: "component" | "subComponent" | "createdAt"; direction: "asc" | "desc" }>({
    key: "component",
    direction: "asc",
  });

  const groups = useMemo<Group[]>(() => {
    const term = q.toLowerCase();
    const grouped = components.map((component) => {
      const children = subComponents.filter((item) => item.componentId === component.id);
      const componentMatches = component.name.toLowerCase().includes(term);
      const matchingChildren = term
        ? children.filter((item) => item.name.toLowerCase().includes(term))
        : children;

      return {
        component,
        subComponents: componentMatches ? children : matchingChildren,
      };
    });

    return grouped
      .filter((group) => !term || group.component.name.toLowerCase().includes(term) || group.subComponents.length > 0)
      .sort((a, b) => {
        let av = a.component.name;
        let bv = b.component.name;
        if (sort.key === "subComponent") {
          av = a.subComponents[0]?.name ?? "";
          bv = b.subComponents[0]?.name ?? "";
        }
        if (sort.key === "createdAt") {
          av = a.subComponents[0]?.createdAt ?? a.component.createdAt;
          bv = b.subComponents[0]?.createdAt ?? b.component.createdAt;
        }
        return sort.direction === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
  }, [components, q, sort, subComponents]);

  const totalPages = Math.max(1, Math.ceil(groups.length / PAGE_SIZE));
  const pageGroups = groups.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const visibleCount = groups.reduce((sum, group) => sum + group.subComponents.length, 0);

  const toggleSort = (key: typeof sort.key) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem.mutateAsync(id);
      toast.success("Sub Component deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete Sub Component");
    }
    setDeleteId(null);
  };

  const SortButton = ({ label, sortKey }: { label: string; sortKey: typeof sort.key }) => (
    <button type="button" onClick={() => toggleSort(sortKey)} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <ArrowUpDown className="h-3.5 w-3.5" />
    </button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sub Components"
        description="Manage Sub Components grouped under their Components."
        actions={
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/projects/sub-components/new">
              <Plus className="h-4 w-4" /> Add New Sub Component
            </Link>
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search components or sub components..." value={q} onChange={(event) => { setQ(event.target.value); setPage(1); }} className="pl-9" />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <SortButton label="Component" sortKey="component" />
            <SortButton label="Sub Component" sortKey="subComponent" />
            <SortButton label="Date Created" sortKey="createdAt" />
            <span className="text-sm text-muted-foreground">{visibleCount} sub component{visibleCount !== 1 ? "s" : ""}</span>
          </div>
        </div>

        <div className="divide-y divide-border">
          {pageGroups.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {q ? "No Sub Components match your search." : "No Components or Sub Components found."}
            </div>
          )}

          {pageGroups.map((group) => {
            const isOpen = expanded[group.component.id] !== false;
            return (
              <div key={group.component.id}>
                <button
                  type="button"
                  onClick={() => setExpanded((current) => ({ ...current, [group.component.id]: !isOpen }))}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/40"
                >
                  {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{group.component.name}</p>
                    <p className="text-xs text-muted-foreground">{group.subComponents.length} Sub Component{group.subComponents.length !== 1 ? "s" : ""}</p>
                  </div>
                  <Button asChild size="sm" variant="outline" onClick={(event) => event.stopPropagation()}>
                    <Link to="/projects/sub-components/new">
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Link>
                  </Button>
                </button>

                {isOpen && (
                  <div className="border-t border-border/50 bg-muted/20">
                    {group.subComponents.length === 0 ? (
                      <div className="px-12 py-4 text-sm text-muted-foreground">No Sub Components under this Component.</div>
                    ) : (
                      group.subComponents.map((item) => (
                        <div key={item.id} className="flex flex-col gap-3 px-12 py-3 sm:flex-row sm:items-center">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Layers2 className="h-3.5 w-3.5 text-primary" />
                              <p className="font-medium text-foreground">{item.name}</p>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">Created {new Date(item.createdAt).toLocaleDateString()}</p>
                          </div>
                          {deleteId === item.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-muted-foreground">Confirm delete?</span>
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>Yes</Button>
                              <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>No</Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1">
                              <Button asChild size="sm" variant="ghost"><Link to={`/projects/sub-components/${item.id}/view`}><Eye className="h-3.5 w-3.5" /></Link></Button>
                              <Button asChild size="sm" variant="ghost"><Link to={`/projects/sub-components/${item.id}/edit`}><Pencil className="h-3.5 w-3.5" /></Link></Button>
                              <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => setDeleteId(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-border p-4 text-sm">
          <span className="text-muted-foreground">{groups.length === 0 ? "0" : `${(page - 1) * PAGE_SIZE + 1}-${(page - 1) * PAGE_SIZE + pageGroups.length}`} of {groups.length} component group{groups.length !== 1 ? "s" : ""}</span>
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
