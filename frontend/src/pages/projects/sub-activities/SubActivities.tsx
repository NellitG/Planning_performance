import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Eye,
  Pencil,
  Trash2,
  Layers2,
  ListTodo,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useMainActivities, useSubActivities, useDeleteSubActivity } from "@/hooks/useProjectsApi";
import type { MainActivity, SubActivity } from "@/utils/types";

const PAGE_SIZE = 8;

interface SubActivityGroup {
  mainActivityId: string;
  mainActivity: MainActivity | null;
  subActivities: SubActivity[];
}

export default function SubActivities() {
  const { data: items = [] } = useSubActivities();
  const { data: mainActivities = [] } = useMainActivities();
  const deleteItem = useDeleteSubActivity();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const mainActivityMap = useMemo(() => {
    const map: Record<string, MainActivity> = {};
    mainActivities.forEach((activity) => {
      map[String(activity.id)] = activity;
    });
    return map;
  }, [mainActivities]);

  const groups = useMemo<SubActivityGroup[]>(() => {
    const byMainActivity: Record<string, SubActivityGroup> = {};

    mainActivities.forEach((activity) => {
      byMainActivity[String(activity.id)] = {
        mainActivityId: String(activity.id),
        mainActivity: activity,
        subActivities: [],
      };
    });

    items.forEach((item) => {
      const mainActivityId = String(item.mainActivityId);
      if (!byMainActivity[mainActivityId]) {
        byMainActivity[mainActivityId] = {
          mainActivityId,
          mainActivity: mainActivityMap[mainActivityId] ?? null,
          subActivities: [],
        };
      }
      byMainActivity[mainActivityId].subActivities.push(item);
    });

    return Object.values(byMainActivity).filter(
      (group) => group.mainActivity || group.subActivities.length > 0,
    );
  }, [items, mainActivities, mainActivityMap]);

  const filteredGroups = useMemo<SubActivityGroup[]>(() => {
    if (!q) return groups;
    const lower = q.toLowerCase();

    return groups
      .map((group) => {
        const mainName = (
          group.mainActivity?.name ||
          group.subActivities[0]?.mainActivityName ||
          ""
        ).toLowerCase();
        const mainMatches = mainName.includes(lower);
        const matchingSubActivities = group.subActivities.filter((item) =>
          item.name.toLowerCase().includes(lower),
        );

        if (mainMatches) return group;
        if (matchingSubActivities.length > 0) {
          return { ...group, subActivities: matchingSubActivities };
        }
        return null;
      })
      .filter((group): group is SubActivityGroup => group !== null);
  }, [groups, q]);

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / PAGE_SIZE));
  const pageGroups = filteredGroups.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const visibleSubActivityCount = filteredGroups.reduce(
    (sum, group) => sum + group.subActivities.length,
    0,
  );

  const toggleExpand = (mainActivityId: string) => {
    setExpanded((current) => ({
      ...current,
      [mainActivityId]: !current[mainActivityId],
    }));
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem.mutateAsync(id);
      toast.success("Sub Activity deleted");
    } catch {
      toast.error("Failed to delete Sub Activity");
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sub Activity"
        description="Manage Sub Activities grouped under their Main Activities."
        actions={
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/projects/sub-activities/new">
              <Plus className="h-4 w-4" /> Add Sub Activity
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <ListTodo className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Main Activities</p>
              <p className="text-2xl font-bold text-foreground">{groups.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Layers2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Sub Activities</p>
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
              placeholder="Search by sub activity or main activity..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredGroups.length} main activit{filteredGroups.length !== 1 ? "ies" : "y"} -{" "}
            {visibleSubActivityCount} sub activit{visibleSubActivityCount !== 1 ? "ies" : "y"}
          </span>
        </div>

        <div className="divide-y divide-border">
          {pageGroups.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {q
                ? "No sub activities match your search."
                : "No Sub Activities yet. Click 'Add Sub Activity' to get started."}
            </div>
          )}

          {pageGroups.map((group, groupIdx) => {
            const mainName =
              group.mainActivity?.name ||
              group.subActivities[0]?.mainActivityName ||
              "Unknown Main Activity";
            const rowNumber = (page - 1) * PAGE_SIZE + groupIdx + 1;
            const isOpen = expanded[group.mainActivityId] !== false;

            return (
              <div key={group.mainActivityId}>
                <button
                  onClick={() => toggleExpand(group.mainActivityId)}
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
                >
                  <span className="mt-0.5 w-5 shrink-0 text-xs text-muted-foreground">
                    {rowNumber}
                  </span>
                  {isOpen ? (
                    <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRightIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">
                      <ListTodo className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{mainName}</span>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {group.subActivities.length} sub activit
                      {group.subActivities.length !== 1 ? "ies" : "y"}
                    </p>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="shrink-0 text-xs"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Link to="/projects/sub-activities/new">
                      <Plus className="h-3 w-3" /> Add Sub Activity
                    </Link>
                  </Button>
                </button>

                {isOpen && (
                  <div className="border-t border-border/50 bg-muted/20">
                    {group.subActivities.length === 0 ? (
                      <div className="px-12 py-4 text-sm text-muted-foreground">
                        No Sub Activities linked to this Main Activity.
                      </div>
                    ) : (
                      <div className="divide-y divide-border/30">
                        {group.subActivities.map((item, idx) => (
                          <div
                            key={item.id}
                            className={cn(
                              "flex flex-col gap-3 px-4 py-3 pl-12 text-sm sm:flex-row sm:items-center",
                              idx !== group.subActivities.length - 1 && "border-b border-border/20",
                            )}
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">
                                {idx + 1}.
                              </span>
                              <Layers2 className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                              <div className="min-w-0">
                                <p className="font-medium text-foreground">{item.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Created {new Date(item.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-1 sm:shrink-0">
                              {deleteId === item.id ? (
                                <>
                                  <span className="mr-1 text-xs text-muted-foreground">
                                    Confirm delete?
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(item.id)}
                                  >
                                    Yes
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setDeleteId(null)}
                                  >
                                    No
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0">
                                    <Link to={`/projects/sub-activities/${item.id}/view`}>
                                      <Eye className="h-3.5 w-3.5" />
                                    </Link>
                                  </Button>
                                  <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0">
                                    <Link to={`/projects/sub-activities/${item.id}/edit`}>
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

        <div className="flex items-center justify-between border-t border-border p-4 text-sm">
          <span className="text-muted-foreground">
            {filteredGroups.length === 0
              ? "0"
              : `${(page - 1) * PAGE_SIZE + 1}-${(page - 1) * PAGE_SIZE + pageGroups.length}`}{" "}
            of {filteredGroups.length} main activit{filteredGroups.length !== 1 ? "ies" : "y"}
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
