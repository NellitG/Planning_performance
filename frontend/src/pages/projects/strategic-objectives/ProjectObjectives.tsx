import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { Plus, Search, ChevronDown, ChevronRight, Pencil, Trash2, Target, Boxes } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useObjectives, useComponents, useDeleteObjective } from "@/hooks/useProjectsApi";
import type { KRAComponent, ProjectObjective } from "@/utils/types";

interface ObjectiveGroup {
  componentId: string;
  objectives: ProjectObjective[];
}

export default function ProjectObjectives() {
  const { data: objectives = [] } = useObjectives();
  const { data: components = [] } = useComponents();
  const deleteObjective = useDeleteObjective();
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const componentMap = useMemo(() => {
    const m: Record<string, KRAComponent> = {};
    components.forEach((c) => { m[c.id] = c; });
    return m;
  }, [components]);

  const groups = useMemo<ObjectiveGroup[]>(() => {
    const byComponent: Record<string, ObjectiveGroup> = {};
    objectives.forEach((obj) => {
      if (!byComponent[obj.componentId]) {
        byComponent[obj.componentId] = { componentId: obj.componentId, objectives: [] };
      }
      byComponent[obj.componentId].objectives.push(obj);
    });
    return Object.values(byComponent);
  }, [objectives]);

  const filteredGroups = useMemo<ObjectiveGroup[]>(() => {
    if (!q) return groups;
    const lower = q.toLowerCase();
    return groups
      .map((g) => {
        const compName = (componentMap[g.componentId]?.title || "").toLowerCase();
        const matchingObjs = g.objectives.filter(
          (o) => o.text.toLowerCase().includes(lower) || compName.includes(lower),
        );
        if (matchingObjs.length === 0) return null;
        return { ...g, objectives: matchingObjs };
      })
      .filter((g): g is ObjectiveGroup => g !== null);
  }, [groups, q, componentMap]);

  const toggleExpand = (compId: string) =>
    setExpanded((e) => ({ ...e, [compId]: !e[compId] }));

  const handleDelete = async (id: string) => {
    try {
      await deleteObjective.mutateAsync(id);
      toast.success("Strategic objective deleted");
    } catch {
      toast.error("Failed to delete strategic objective");
    }
    setDeleteId(null);
  };

  const totalObjectives = objectives.length;
  const totalGroups = groups.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Strategic Objectives"
        description="Manage strategic objectives grouped by Key Result Area."
        actions={
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/projects/strategic-objectives/new">
              <Plus className="h-4 w-4" /> Create Strategic Objective
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
              <p className="text-xs text-muted-foreground">KRAs with Objectives</p>
              <p className="text-2xl font-bold text-foreground">{totalGroups}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Objectives</p>
              <p className="text-2xl font-bold text-foreground">{totalObjectives}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search objectives or component..."
              value={q}
              onChange={(e) => { setQ(e.target.value); }}
              className="pl-9"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredGroups.length} KRA{filteredGroups.length !== 1 ? "s" : ""}
            {q ? ` · ${filteredGroups.reduce((a, g) => a + g.objectives.length, 0)} objective${filteredGroups.reduce((a, g) => a + g.objectives.length, 0) !== 1 ? "s" : ""}` : ""}
          </span>
        </div>

        <div className="divide-y divide-border">
          {filteredGroups.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {q ? "No objectives match your search." : "No strategic objectives yet. Click 'Create Strategic Objective' to get started."}
            </div>
          )}

          {filteredGroups.map((group, gIdx) => {
            const comp = componentMap[group.componentId];
            const isOpen = expanded[group.componentId] !== false;

            return (
              <div key={group.componentId}>
                <button
                  onClick={() => toggleExpand(group.componentId)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors text-left"
                >
                  <span className="text-xs text-muted-foreground w-5 shrink-0">{gIdx + 1}</span>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="flex flex-1 items-center gap-3 min-w-0">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">
                      <Boxes className="h-3.5 w-3.5 shrink-0" />
                      {comp?.title || "Unknown KRA"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {group.objectives.length} objective{group.objectives.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="shrink-0 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link to="/projects/strategic-objectives/new">
                      <Plus className="h-3 w-3" /> Add Objective
                    </Link>
                  </Button>
                </button>

                {isOpen && (
                  <div className="bg-muted/20 border-t border-border/50">
                    {group.objectives.map((obj, oIdx) => (
                      <div
                        key={obj.id}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 pl-12 text-sm",
                          oIdx !== group.objectives.length - 1 && "border-b border-border/30",
                        )}
                      >
                        <span className="text-xs text-muted-foreground w-5 shrink-0 text-right">
                          {oIdx + 1}.
                        </span>
                        <Target className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                        <span className="flex-1 font-medium text-foreground">{obj.text}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{obj.createdAt}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {deleteId === obj.id ? (
                            <>
                              <span className="text-xs text-muted-foreground mr-1">Delete?</span>
                              <Button size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={() => handleDelete(obj.id)}>Yes</Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setDeleteId(null)}>No</Button>
                            </>
                          ) : (
                            <>
                              <Button asChild size="sm" variant="ghost" className="h-7 w-7 p-0">
                                <Link to={`/projects/strategic-objectives/${obj.id}/edit`}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => setDeleteId(obj.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredGroups.length > 0 && (
          <div className="border-t border-border p-4 text-sm text-muted-foreground">
            {filteredGroups.length} KRA group{filteredGroups.length !== 1 ? "s" : ""} · {filteredGroups.reduce((a, g) => a + g.objectives.length, 0)} total objective{filteredGroups.reduce((a, g) => a + g.objectives.length, 0) !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
