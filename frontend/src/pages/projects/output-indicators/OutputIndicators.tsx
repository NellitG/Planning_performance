import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { Plus, Search, ChevronDown, ChevronRight, Pencil, Trash2, BarChart2, GitBranch } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useOutputIndicators, useStrategies, useDeleteOutputIndicator } from "@/hooks/useProjectsApi";
import type { OutputIndicator, ProjectStrategy } from "@/utils/types";

interface IndicatorGroup {
  strategyId: string;
  items: OutputIndicator[];
}

export default function OutputIndicators() {
  const { data: indicators = [] } = useOutputIndicators();
  const { data: strategies = [] } = useStrategies();
  const deleteOutputIndicator = useDeleteOutputIndicator();
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const strategyMap = useMemo(() => {
    const m: Record<string, ProjectStrategy> = {};
    strategies.forEach((s) => { m[s.id] = s; });
    return m;
  }, [strategies]);

  const groups = useMemo<IndicatorGroup[]>(() => {
    const byStrategy: Record<string, IndicatorGroup> = {};
    indicators.forEach((i) => {
      if (!byStrategy[i.strategyId]) byStrategy[i.strategyId] = { strategyId: i.strategyId, items: [] };
      byStrategy[i.strategyId].items.push(i);
    });
    return Object.values(byStrategy);
  }, [indicators]);

  const filteredGroups = useMemo<IndicatorGroup[]>(() => {
    if (!q) return groups;
    const lower = q.toLowerCase();
    return groups.map((g) => {
      const stratText = (strategyMap[g.strategyId]?.text || "").toLowerCase();
      const matching = g.items.filter((i) => i.text.toLowerCase().includes(lower) || stratText.includes(lower));
      return matching.length ? { ...g, items: matching } : null;
    }).filter((g): g is IndicatorGroup => g !== null);
  }, [groups, q, strategyMap]);

  const toggleExpand = (stratId: string) => setExpanded((e) => ({ ...e, [stratId]: !e[stratId] }));
  const handleDelete = async (id: string) => {
    try {
      await deleteOutputIndicator.mutateAsync(id);
      toast.success("Output indicator deleted");
    } catch {
      toast.error("Failed to delete output indicator");
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Output Indicators"
        description="Manage output indicators grouped by strategy."
        actions={
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/projects/output-indicators/new"><Plus className="h-4 w-4" /> Add Output Indicator</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5"><GitBranch className="h-5 w-5 text-primary" /></div>
            <div><p className="text-xs text-muted-foreground">Strategy Groups</p><p className="text-2xl font-bold">{groups.length}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5"><BarChart2 className="h-5 w-5 text-primary" /></div>
            <div><p className="text-xs text-muted-foreground">Total Output Indicators</p><p className="text-2xl font-bold">{indicators.length}</p></div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search indicators or strategy..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <span className="text-sm text-muted-foreground">{filteredGroups.length} group{filteredGroups.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="divide-y divide-border">
          {filteredGroups.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {q ? "No indicators match your search." : "No output indicators yet. Click 'Add Output Indicator' to get started."}
            </div>
          )}
          {filteredGroups.map((group, gIdx) => {
            const strat = strategyMap[group.strategyId];
            const isOpen = expanded[group.strategyId] !== false;
            return (
              <div key={group.strategyId}>
                <button onClick={() => toggleExpand(group.strategyId)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors text-left">
                  <span className="text-xs text-muted-foreground w-5 shrink-0">{gIdx + 1}</span>
                  {isOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                  <div className="flex flex-1 items-center gap-3 min-w-0">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">
                      <GitBranch className="h-3.5 w-3.5 shrink-0" />{strat?.text || "Unknown Strategy"}
                    </span>
                    <span className="text-xs text-muted-foreground">{group.items.length} indicator{group.items.length !== 1 ? "s" : ""}</span>
                  </div>
                  <Button asChild size="sm" variant="outline" className="shrink-0 text-xs" onClick={(e) => e.stopPropagation()}>
                    <Link to="/projects/output-indicators/new"><Plus className="h-3 w-3" /> Add Indicator</Link>
                  </Button>
                </button>
                {isOpen && (
                  <div className="bg-muted/20 border-t border-border/50">
                    {group.items.map((item, iIdx) => (
                      <div key={item.id} className={cn("flex items-center gap-3 px-4 py-3 pl-12 text-sm", iIdx !== group.items.length - 1 && "border-b border-border/30")}>
                        <span className="text-xs text-muted-foreground w-5 shrink-0 text-right">{iIdx + 1}.</span>
                        <BarChart2 className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                        <span className="flex-1 font-medium text-foreground">{item.text}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{item.createdAt}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {deleteId === item.id ? (
                            <>
                              <span className="text-xs text-muted-foreground mr-1">Delete?</span>
                              <Button size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={() => handleDelete(item.id)}>Yes</Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setDeleteId(null)}>No</Button>
                            </>
                          ) : (
                            <>
                              <Button asChild size="sm" variant="ghost" className="h-7 w-7 p-0">
                                <Link to={`/projects/output-indicators/${item.id}/edit`}><Pencil className="h-3.5 w-3.5" /></Link>
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteId(item.id)}>
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
            {filteredGroups.length} group{filteredGroups.length !== 1 ? "s" : ""} · {filteredGroups.reduce((a, g) => a + g.items.length, 0)} total indicator{filteredGroups.reduce((a, g) => a + g.items.length, 0) !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
