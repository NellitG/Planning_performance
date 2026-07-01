import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { Plus, Search, ChevronDown, ChevronRight, Pencil, Trash2, GitBranch, Target, Boxes } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useStrategies, useComponents, useObjectives, useDeleteStrategy } from "@/hooks/useProjectsApi";
import type { KRAComponent, ProjectObjective, ProjectStrategy } from "@/utils/types";

interface ObjectiveBranch {
  objective: ProjectObjective | null;
  objectiveId: string;
  strategies: ProjectStrategy[];
}

interface StrategyGroup {
  componentId: string;
  objectives: ObjectiveBranch[];
}

export default function Strategy() {
  const { data: strategies = [] } = useStrategies();
  const { data: components = [] } = useComponents();
  const { data: objectives = [] } = useObjectives();
  const deleteStrategy = useDeleteStrategy();
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const componentMap = useMemo(() => {
    const m: Record<string, KRAComponent> = {};
    components.forEach((c) => { m[c.id] = c; });
    return m;
  }, [components]);

  const objectiveMap = useMemo(() => {
    const m: Record<string, ProjectObjective> = {};
    objectives.forEach((o) => { m[o.id] = o; });
    return m;
  }, [objectives]);

  const groups = useMemo<StrategyGroup[]>(() => {
    const byComponent: Record<string, StrategyGroup> = {};

    components.forEach((component) => {
      byComponent[component.id] = { componentId: component.id, objectives: [] };
    });

    objectives.forEach((objective) => {
      if (!byComponent[objective.componentId]) {
        byComponent[objective.componentId] = { componentId: objective.componentId, objectives: [] };
      }
      byComponent[objective.componentId].objectives.push({
        objective,
        objectiveId: objective.id,
        strategies: [],
      });
    });

    strategies.forEach((strategy) => {
      const objective = objectiveMap[strategy.objectiveId] ?? null;
      const componentId = objective?.componentId ?? strategy.componentId;

      if (!byComponent[componentId]) {
        byComponent[componentId] = { componentId, objectives: [] };
      }

      let objectiveBranch = byComponent[componentId].objectives.find(
        (branch) => branch.objectiveId === strategy.objectiveId,
      );
      if (!objectiveBranch) {
        objectiveBranch = {
          objective,
          objectiveId: strategy.objectiveId,
          strategies: [],
        };
        byComponent[componentId].objectives.push(objectiveBranch);
      }
      objectiveBranch.strategies.push(strategy);
    });

    return Object.values(byComponent).filter((group) => group.objectives.length > 0);
  }, [components, objectives, strategies, objectiveMap]);

  const filteredGroups = useMemo<StrategyGroup[]>(() => {
    if (!q) return groups;
    const lower = q.toLowerCase();

    return groups
      .map((group) => {
        const compName = (componentMap[group.componentId]?.title || "").toLowerCase();
        const componentMatches = compName.includes(lower);
        const matchingObjectives = group.objectives
          .map((branch) => {
            const objectiveText = (branch.objective?.text || "").toLowerCase();
            const objectiveMatches = objectiveText.includes(lower);
            const matchingStrategies = branch.strategies.filter((strategy) =>
              strategy.text.toLowerCase().includes(lower),
            );

            if (componentMatches || objectiveMatches) return branch;
            if (matchingStrategies.length > 0) {
              return { ...branch, strategies: matchingStrategies };
            }
            return null;
          })
          .filter((branch): branch is ObjectiveBranch => branch !== null);

        if (!componentMatches && matchingObjectives.length === 0) return null;
        return {
          ...group,
          objectives: componentMatches ? group.objectives : matchingObjectives,
        };
      })
      .filter((group): group is StrategyGroup => group !== null);
  }, [groups, q, componentMap]);

  const toggleExpand = (key: string) =>
    setExpanded((e) => ({ ...e, [key]: !e[key] }));

  const handleDelete = async (id: string) => {
    try {
      await deleteStrategy.mutateAsync(id);
      toast.success("Strategy deleted");
    } catch {
      toast.error("Failed to delete strategy");
    }
    setDeleteId(null);
  };

  const totalStrategies = strategies.length;
  const totalGroups = groups.length;
  const totalObjectives = groups.reduce((sum, group) => sum + group.objectives.length, 0);
  const visibleStrategies = filteredGroups.reduce(
    (sum, group) => sum + group.objectives.reduce((branchSum, branch) => branchSum + branch.strategies.length, 0),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Strategy"
        description="Manage strategies in a KRA, strategic objective, and strategy hierarchy."
        actions={
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/projects/strategy/new">
              <Plus className="h-4 w-4" /> Create Strategy
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
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <GitBranch className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Strategies</p>
              <p className="text-2xl font-bold text-foreground">{totalStrategies}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search strategies, KRAs, objectives..."
              value={q}
              onChange={(e) => { setQ(e.target.value); }}
              className="pl-9"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredGroups.length} KRA{filteredGroups.length !== 1 ? "s" : ""}
            {q ? ` - ${visibleStrategies} strateg${visibleStrategies !== 1 ? "ies" : "y"}` : ""}
          </span>
        </div>

        <div className="divide-y divide-border">
          {filteredGroups.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {q ? "No strategies match your search." : "No KRA hierarchy yet. Create a KRA, strategic objective, and strategy to get started."}
            </div>
          )}

          {filteredGroups.map((group, gIdx) => {
            const comp = componentMap[group.componentId];
            const isOpen = expanded[group.componentId] !== false;
            const strategyCount = group.objectives.reduce((sum, branch) => sum + branch.strategies.length, 0);

            return (
              <div key={group.componentId}>
                <button
                  onClick={() => toggleExpand(group.componentId)}
                  className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors text-left"
                >
                  <span className="text-xs text-muted-foreground w-5 shrink-0 mt-0.5">{gIdx + 1}</span>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  )}
                  <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        <Boxes className="h-3 w-3 shrink-0" />
                        {comp?.title || "Unknown KRA"}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground pl-0.5">
                      {group.objectives.length} objective{group.objectives.length !== 1 ? "s" : ""} - {strategyCount} strateg{strategyCount !== 1 ? "ies" : "y"}
                    </span>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="shrink-0 text-xs self-start"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link to="/projects/strategy/new">
                      <Plus className="h-3 w-3" /> Add Strategy
                    </Link>
                  </Button>
                </button>

                {isOpen && (
                  <div className="bg-muted/20 border-t border-border/50 divide-y divide-border/40">
                    {group.objectives.map((branch, oIdx) => (
                      <div key={branch.objectiveId} className="px-4 py-3 pl-12">
                        <div className="flex items-start gap-3">
                          <span className="text-xs text-muted-foreground w-5 shrink-0 text-right mt-1">
                            {oIdx + 1}.
                          </span>
                          <Target className="h-3.5 w-3.5 shrink-0 text-emerald-700 mt-1" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm text-foreground">
                              {branch.objective?.text || "Unknown Objective"}
                            </div>
                            {branch.strategies.length === 0 ? (
                              <div className="mt-2 rounded-md border border-dashed border-border bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                                No strategies linked to this objective yet.
                              </div>
                            ) : (
                              <div className="mt-2 space-y-1.5">
                                {branch.strategies.map((strat, sIdx) => (
                                  <div
                                    key={strat.id}
                                    className={cn(
                                      "flex items-center gap-3 rounded-lg bg-background px-3 py-2 text-sm shadow-sm",
                                      sIdx !== branch.strategies.length - 1 && "border-b border-border/20",
                                    )}
                                  >
                                    <span className="text-xs text-muted-foreground w-8 shrink-0 text-right">
                                      {oIdx + 1}.{sIdx + 1}
                                    </span>
                                    <GitBranch className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                                    <span className="flex-1 font-medium text-foreground">{strat.text}</span>
                                    <span className="text-xs text-muted-foreground shrink-0">{strat.createdAt}</span>
                                    <div className="flex items-center gap-1 shrink-0">
                                      {deleteId === strat.id ? (
                                        <>
                                          <span className="text-xs text-muted-foreground mr-1">Delete?</span>
                                          <Button size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={() => handleDelete(strat.id)}>Yes</Button>
                                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setDeleteId(null)}>No</Button>
                                        </>
                                      ) : (
                                        <>
                                          <Button asChild size="sm" variant="ghost" className="h-7 w-7 p-0">
                                            <Link to={`/projects/strategy/${strat.id}/edit`}>
                                              <Pencil className="h-3.5 w-3.5" />
                                            </Link>
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => setDeleteId(strat.id)}
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
            {filteredGroups.length} KRA group{filteredGroups.length !== 1 ? "s" : ""} - {filteredGroups.reduce((a, g) => a + g.objectives.length, 0)} objective{filteredGroups.reduce((a, g) => a + g.objectives.length, 0) !== 1 ? "s" : ""} - {visibleStrategies} total strateg{visibleStrategies !== 1 ? "ies" : "y"}
          </div>
        )}
      </div>
    </div>
  );
}
