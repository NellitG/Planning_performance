import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Target, BarChart3, ChevronDown, ChevronRight, Boxes } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useComponents, useDeleteOutcome, useOutcomes } from "@/hooks/useProjectsApi";
import type { KRAComponent, Outcome, OutcomeIndicator } from "@/utils/types";

interface OutcomeGroup {
  kraId: string;
  kraTitle: string;
  outcomes: Array<{
    outcome: Outcome;
    indicators: OutcomeIndicator[];
  }>;
}

export default function Outcomes() {
  const { data: outcomes = [] } = useOutcomes();
  const { data: kras = [] } = useComponents();
  const deleteOutcome = useDeleteOutcome();

  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const groups = useMemo<OutcomeGroup[]>(() => {
    const byKra = new Map<string, OutcomeGroup>();

    kras.forEach((kra) => {
      byKra.set(kra.id, {
        kraId: kra.id,
        kraTitle: kra.title,
        outcomes: [],
      });
    });

    outcomes.forEach((outcome) => {
      const existing = byKra.get(outcome.kraId);
      if (existing) {
        existing.outcomes.push({
          outcome,
          indicators: outcome.indicators || [],
        });
      } else {
        byKra.set(outcome.kraId, {
          kraId: outcome.kraId,
          kraTitle: "Unknown KRA",
          outcomes: [{ outcome, indicators: outcome.indicators || [] }],
        });
      }
    });

    return Array.from(byKra.values()).sort((a, b) => a.kraTitle.localeCompare(b.kraTitle));
  }, [kras, outcomes]);

  const filteredGroups = useMemo<OutcomeGroup[]>(() => {
    const query = q.toLowerCase().trim();
    if (!query) return groups;

    return groups.filter((group) => {
      const kraMatches = group.kraTitle.toLowerCase().includes(query);
      const outcomeMatches = group.outcomes.some(({ outcome, indicators }) => {
        const outcomeText = outcome.text.toLowerCase();
        const indicatorText = indicators.some((indicator) => indicator.text.toLowerCase().includes(query));
        return outcomeText.includes(query) || indicatorText;
      });
      return kraMatches || outcomeMatches;
    });
  }, [groups, q]);

  const toggleExpand = (kraId: string) => {
    setExpanded((current) => ({ ...current, [kraId]: !current[kraId] }));
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOutcome.mutateAsync(id);
      toast.success("Outcome deleted");
    } catch {
      toast.error("Failed to delete outcome");
    }
    setDeleteId(null);
  };

  const totalOutcomes = outcomes.length;
  const totalIndicators = outcomes.reduce((sum, item) => sum + (item.indicators?.length || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outcomes"
        description="View outcomes grouped under each Key Result Area with nested indicators and targets."
        actions={
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/projects/outcomes/new">
              <Plus className="mr-2 h-4 w-4" /> Add Outcome
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Outcomes</p>
              <p className="text-2xl font-bold">{totalOutcomes}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Outcome Indicators</p>
              <p className="text-2xl font-bold">{totalIndicators}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search outcomes, indicators, or KRAs..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredGroups.length} KRA{filteredGroups.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="divide-y divide-border">
          {filteredGroups.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              {q ? "No outcomes match your search." : "No outcomes yet. Click 'Add Outcome' to get started."}
            </div>
          )}

          {filteredGroups.map((group) => {
            const isOpen = expanded[group.kraId] ?? true;
            const outcomeCount = group.outcomes.length;
            const indicatorCount = group.outcomes.reduce((sum, item) => sum + item.indicators.length, 0);

            return (
              <div key={group.kraId}>
                <button
                  type="button"
                  onClick={() => toggleExpand(group.kraId)}
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
                >
                  {isOpen ? (
                    <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          <Boxes className="h-3 w-3 shrink-0" />
                          {group.kraTitle}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {outcomeCount} outcome{outcomeCount === 1 ? "" : "s"} • {indicatorCount} indicator{indicatorCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="shrink-0 text-xs"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Link to="/projects/outcomes/new">
                        <Plus className="mr-1 h-3 w-3" /> Add Outcome
                      </Link>
                    </Button>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border/50 bg-muted/20 px-4 py-4">
                    {group.outcomes.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border bg-background/70 px-3 py-4 text-sm text-muted-foreground">
                        No outcomes registered for this KRA yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {group.outcomes.map((entry, index) => {
                          const { outcome, indicators } = entry;
                          return (
                            <div key={outcome.id} className="rounded-xl border border-border/80 bg-background p-4 shadow-sm">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                                      Outcome {index + 1}
                                    </span>
                                    <Target className="h-3.5 w-3.5 text-emerald-700" />
                                  </div>
                                  <p className="mt-2 font-medium text-foreground">{outcome.text}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {indicators.length} indicator{indicators.length === 1 ? "" : "s"} linked to this outcome
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  {deleteId === outcome.id ? (
                                    <>
                                      <span className="mr-1 text-xs text-muted-foreground">Delete?</span>
                                      <Button size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={() => handleDelete(outcome.id)}>
                                        Yes
                                      </Button>
                                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setDeleteId(null)}>
                                        No
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button asChild size="sm" variant="ghost" className="h-7 w-7 p-0">
                                        <Link to={`/projects/outcomes/${outcome.id}/edit`}>
                                          <Pencil className="h-3.5 w-3.5" />
                                        </Link>
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => setDeleteId(outcome.id)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="mt-4 space-y-2">
                                {indicators.length === 0 ? (
                                  <div className="rounded-lg border border-dashed border-border bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                                    No outcome indicators linked yet. Edit this outcome to add one.
                                  </div>
                                ) : (
                                  indicators.map((indicator, indicatorIndex) => (
                                    <div key={indicator.id} className="flex flex-col gap-2 rounded-lg border border-border/70 bg-background/70 px-3 py-2 md:flex-row md:items-center md:justify-between">
                                      <div className="min-w-0">
                                        <p className="font-medium text-sm text-foreground">{indicator.text}</p>
                                        <p className="text-xs text-muted-foreground">Indicator {indicatorIndex + 1}</p>
                                      </div>
                                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                        <span><span className="font-medium text-foreground">Baseline:</span> {indicator.baselineValue}</span>
                                        <span><span className="font-medium text-foreground">Midterm:</span> {indicator.midtermTarget}</span>
                                        <span><span className="font-medium text-foreground">Endterm:</span> {indicator.endtermTarget}</span>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
