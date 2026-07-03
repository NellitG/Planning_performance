import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers3,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  useDeleteSubSubActivity,
  useMainActivities,
  useSubActivities,
  useSubSubActivities,
} from "@/hooks/useProjectsApi";
import type { MainActivity, SubActivity, SubSubActivity } from "@/utils/types";

const PAGE_SIZE = 8;

interface MainActivityNode {
  mainActivity: MainActivity;
  subActivities: Array<{
    subActivity: SubActivity;
    subSubActivities: SubSubActivity[];
  }>;
}

export default function SubSubActivities() {
  const { data: items = [] } = useSubSubActivities();
  const { data: mainActivities = [] } = useMainActivities();
  const { data: subActivities = [] } = useSubActivities();
  const deleteItem = useDeleteSubSubActivity();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const treeData = useMemo<MainActivityNode[]>(() => {
    const mainActivityMap = new Map<string, MainActivity>();
    mainActivities.forEach((activity) => {
      mainActivityMap.set(String(activity.id), activity);
    });

    const byMainActivity = new Map<string, MainActivityNode>();

    mainActivities.forEach((activity) => {
      byMainActivity.set(String(activity.id), {
        mainActivity: activity,
        subActivities: [],
      });
    });

    subActivities.forEach((subActivity) => {
      const mainActivityId = String(subActivity.mainActivityId);
      const parent = byMainActivity.get(mainActivityId);
      if (!parent) {
        const fallbackMainActivity = mainActivityMap.get(mainActivityId) ?? {
          id: mainActivityId,
          name: subActivity.mainActivityName,
          createdAt: subActivity.createdAt,
        };
        byMainActivity.set(mainActivityId, {
          mainActivity: fallbackMainActivity,
          subActivities: [],
        });
      }
      byMainActivity.get(mainActivityId)?.subActivities.push({
        subActivity,
        subSubActivities: [],
      });
    });

    items.forEach((item) => {
      const parent = Array.from(byMainActivity.values()).find((group) =>
        group.subActivities.some((child) => String(child.subActivity.id) === String(item.subActivityId)),
      );
      if (parent) {
        const child = parent.subActivities.find(
          (entry) => String(entry.subActivity.id) === String(item.subActivityId),
        );
        if (child) {
          child.subSubActivities.push(item);
        }
      }
    });

    return Array.from(byMainActivity.values()).filter(
      (node) => node.mainActivity || node.subActivities.length > 0,
    );
  }, [items, mainActivities, subActivities]);

  const filteredTree = useMemo<MainActivityNode[]>(() => {
    const term = query.trim().toLowerCase();
    if (!term) return treeData;

    return treeData
      .map((node) => {
        const mainMatches = node.mainActivity.name.toLowerCase().includes(term);
        const filteredSubActivities = node.subActivities
          .map((child) => {
            const subMatches = [
              child.subActivity.name,
              child.subActivity.category,
              child.subActivity.valueChain,
            ]
              .join(" ")
              .toLowerCase()
              .includes(term);

            const matchingSubSubActivities = (mainMatches ? child.subSubActivities : child.subSubActivities.filter((item) =>
              [item.name, item.category, item.valueChain].join(" ").toLowerCase().includes(term),
            ));

            if (mainMatches || subMatches || matchingSubSubActivities.length > 0) {
              return {
                ...child,
                subSubActivities: mainMatches ? child.subSubActivities : matchingSubSubActivities,
              };
            }
            return null;
          })
          .filter((child): child is (typeof node.subActivities)[number] => child !== null);

        if (mainMatches || filteredSubActivities.length > 0) {
          return {
            ...node,
            subActivities: filteredSubActivities,
          };
        }
        return null;
      })
      .filter((node): node is MainActivityNode => node !== null);
  }, [query, treeData]);

  const totalPages = Math.max(1, Math.ceil(filteredTree.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleTree = filteredTree.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const filteredSubSubCount = filteredTree.reduce(
    (total, node) => total + node.subActivities.reduce((sum, child) => sum + child.subSubActivities.length, 0),
    0,
  );

  const toggleExpand = (id: string) => {
    setExpanded((current) => ({ ...current, [id]: !current[id] }));
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem.mutateAsync(id);
      toast.success("Sub-Sub Activity deleted successfully");
    } catch {
      toast.error("Failed to delete Sub-Sub Activity");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sub-Sub Activity"
        description="Explore the hierarchy of main activities, sub activities, and sub-sub activities."
        actions={
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/projects/sub-sub-activities/new">
              <Plus className="h-4 w-4" /> Add New Sub-Sub Activity
            </Link>
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search main activities, sub activities, or sub-sub activities..."
              className="pl-9"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredTree.length} main activit{filteredTree.length === 1 ? "y" : "ies"} · {filteredSubSubCount} record
            {filteredSubSubCount === 1 ? "" : "s"}
          </span>
        </div>

        <div className="divide-y divide-border">
          {visibleTree.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              {query
                ? "No sub-sub activity hierarchy matches your search."
                : "No Sub-Sub Activities yet. Click 'Add New Sub-Sub Activity' to get started."}
            </div>
          )}

          {visibleTree.map((node, nodeIndex) => {
            const mainId = `main-${node.mainActivity.id}`;
            const isMainOpen = expanded[mainId] ?? Boolean(query);
            const categories = Array.from(
              new Set(
                node.subActivities.flatMap((child) => [child.subActivity.category, ...child.subSubActivities.map((item) => item.category)]),
              ),
            ).filter(Boolean);
            const subSubCount = node.subActivities.reduce(
              (sum, child) => sum + child.subSubActivities.length,
              0,
            );

            return (
              <div key={node.mainActivity.id}>
                <button
                  type="button"
                  onClick={() => toggleExpand(mainId)}
                  className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/40"
                >
                  <span className="mt-0.5 w-6 shrink-0 text-xs font-medium text-muted-foreground">
                    {(currentPage - 1) * PAGE_SIZE + nodeIndex + 1}
                  </span>
                  {isMainOpen ? (
                    <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        Main Activity
                      </span>
                      <span className="text-sm font-semibold text-foreground">{node.mainActivity.name}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Category: {categories.length > 0 ? categories.join(", ") : "Not specified"}
                    </p>
                  </div>
                  <div className="hidden items-center gap-3 text-sm text-muted-foreground sm:flex">
                    <span>{node.subActivities.length} sub activit{node.subActivities.length === 1 ? "y" : "ies"}</span>
                    <span>{subSubCount} sub-sub activit{subSubCount === 1 ? "y" : "ies"}</span>
                  </div>
                </button>

                {isMainOpen && (
                  <div className="border-t border-border/50 bg-muted/20 px-4 py-3">
                    {node.subActivities.length === 0 ? (
                      <div className="px-4 py-4 text-sm text-muted-foreground">
                        No sub activities linked to this main activity yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {node.subActivities.map((child, childIndex) => {
                          const subId = `sub-${child.subActivity.id}`;
                          const isSubOpen = expanded[subId] ?? Boolean(query);
                          return (
                            <div key={child.subActivity.id} className="rounded-lg border border-border/60 bg-card/80">
                              <button
                                type="button"
                                onClick={() => toggleExpand(subId)}
                                className="flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/30"
                              >
                                <span className="mt-0.5 w-6 shrink-0 text-xs font-medium text-muted-foreground">
                                  {childIndex + 1}
                                </span>
                                {isSubOpen ? (
                                  <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                      Sub Activity
                                    </span>
                                    <span className="text-sm font-medium text-foreground">
                                      {child.subActivity.name}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    Category: {child.subActivity.category || "Not specified"}
                                  </p>
                                </div>
                                <div className="hidden items-center gap-3 text-sm text-muted-foreground sm:flex">
                                  <span>{child.subSubActivities.length} sub-sub activit{child.subSubActivities.length === 1 ? "y" : "ies"}</span>
                                </div>
                              </button>

                              {isSubOpen && (
                                <div className="border-t border-border/50 bg-muted/20 px-4 py-3">
                                  {child.subSubActivities.length === 0 ? (
                                    <div className="px-4 py-3 text-sm text-muted-foreground">
                                      No sub-sub activities linked to this sub activity yet.
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {child.subSubActivities.map((item) => (
                                        <div
                                          key={item.id}
                                          className="flex flex-col gap-3 rounded-lg border border-border/50 bg-card/70 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                          <div className="flex min-w-0 items-start gap-3">
                                            <Layers3 className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
                                            <div className="min-w-0">
                                              <p className="text-sm font-medium text-foreground">
                                                {item.name || "Untitled sub-sub activity"}
                                              </p>
                                              <p className="mt-1 text-xs text-muted-foreground">
                                                Category: {item.category || "Not specified"} • Value chain: {item.valueChain || "Not applicable"}
                                              </p>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-1 sm:shrink-0">
                                            {deleteId === item.id ? (
                                              <>
                                                <span className="mr-1 text-xs text-muted-foreground">
                                                  Confirm delete?
                                                </span>
                                                <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                                                  Yes
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>
                                                  No
                                                </Button>
                                              </>
                                            ) : (
                                              <>
                                                <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                  <Link to={`/projects/sub-sub-activities/${item.id}/view`}>
                                                    <Eye className="h-3.5 w-3.5" />
                                                  </Link>
                                                </Button>
                                                <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                  <Link to={`/projects/sub-sub-activities/${item.id}/edit`}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                  </Link>
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                                                  onClick={() => setDeleteId(item.id)}
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
                              )}
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

        <div className="flex flex-col gap-3 border-t border-border p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted-foreground">
            {filteredTree.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, filteredTree.length)} of {filteredTree.length} main activit
            {filteredTree.length === 1 ? "y" : "ies"}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setPage((value) => value - 1)}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <span className="text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
