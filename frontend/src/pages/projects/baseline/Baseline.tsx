import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, BarChart2, LineChart } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBaselines, useOutputIndicators, useDeleteBaseline } from "@/hooks/useProjectsApi";
import type { OutputIndicator } from "@/utils/types";

const PAGE_SIZE = 10;

function fmt(v: number | null): string {
  return v === null || v === undefined ? "—" : String(v);
}

export default function Baseline() {
  const { data: baselines = [] } = useBaselines();
  const { data: indicators = [] } = useOutputIndicators();
  const deleteBaseline = useDeleteBaseline();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const indicatorMap = useMemo(() => {
    const m: Record<string, OutputIndicator> = {};
    indicators.forEach((i) => { m[i.id] = i; });
    return m;
  }, [indicators]);

  const filtered = useMemo(() => {
    if (!q) return baselines;
    const lower = q.toLowerCase();
    return baselines.filter((b) => {
      const indText = (indicatorMap[b.outputIndicatorId]?.text || "").toLowerCase();
      return indText.includes(lower);
    });
  }, [baselines, q, indicatorMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async (id: string) => {
    try {
      await deleteBaseline.mutateAsync(id);
      toast.success("Baseline deleted");
    } catch {
      toast.error("Failed to delete baseline");
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Baseline"
        description="Manage baseline values (Years 1–5) linked to Output Indicators."
        actions={
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/projects/baseline/new">
              <Plus className="h-4 w-4" /> Add New Baseline
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5"><LineChart className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Baselines</p>
              <p className="text-2xl font-bold">{baselines.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5"><BarChart2 className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Linked Indicators</p>
              <p className="text-2xl font-bold">{new Set(baselines.map((b) => b.outputIndicatorId)).size}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by output indicator..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 text-left font-semibold">#</th>
                <th className="px-4 py-3 text-left font-semibold">Output Indicator</th>
                <th className="px-4 py-3 text-center font-semibold">Year 1</th>
                <th className="px-4 py-3 text-center font-semibold">Year 2</th>
                <th className="px-4 py-3 text-center font-semibold">Year 3</th>
                <th className="px-4 py-3 text-center font-semibold">Year 4</th>
                <th className="px-4 py-3 text-center font-semibold">Year 5</th>
                <th className="px-4 py-3 text-left font-semibold">Date Created</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    {q ? "No baselines match your search." : "No baselines yet. Click 'Add New Baseline' to get started."}
                  </td>
                </tr>
              )}
              {paginated.map((b, idx) => {
                const indicator = indicatorMap[b.outputIndicatorId];
                const rowNum = (page - 1) * PAGE_SIZE + idx + 1;
                return (
                  <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground text-xs">{rowNum}</td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex items-start gap-2">
                        <BarChart2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary/60" />
                        <span className="font-medium text-foreground line-clamp-2">
                          {indicator?.text || <span className="text-muted-foreground italic">Unknown indicator</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-sm">{fmt(b.year1)}</td>
                    <td className="px-4 py-3 text-center font-mono text-sm">{fmt(b.year2)}</td>
                    <td className="px-4 py-3 text-center font-mono text-sm">{fmt(b.year3)}</td>
                    <td className="px-4 py-3 text-center font-mono text-sm">{fmt(b.year4)}</td>
                    <td className="px-4 py-3 text-center font-mono text-sm">{fmt(b.year5)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{b.createdAt}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {deleteId === b.id ? (
                          <>
                            <span className="text-xs text-muted-foreground mr-1">Delete?</span>
                            <Button size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={() => handleDelete(b.id)}>Yes</Button>
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setDeleteId(null)}>No</Button>
                          </>
                        ) : (
                          <>
                            <Button asChild size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <Link to={`/projects/baseline/${b.id}/edit`}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setDeleteId(b.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages} · {filtered.length} records
            </span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-7 px-3 text-xs"
              >
                Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-7 px-3 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {totalPages <= 1 && filtered.length > 0 && (
          <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
            {filtered.length} baseline{filtered.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
