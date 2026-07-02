import { Fragment, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeleteSubSubActivity, useSubSubActivities } from "@/hooks/useProjectsApi";
import type { SubSubActivity } from "@/utils/types";

const PAGE_SIZE = 10;
const money = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  minimumFractionDigits: 2,
});

interface SubActivityGroup {
  id: string;
  name: string;
  records: SubSubActivity[];
}

export default function SubSubActivities() {
  const { data: items = [] } = useSubSubActivities();
  const deleteItem = useDeleteSubSubActivity();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const groups = useMemo<SubActivityGroup[]>(() => {
    const grouped = new Map<string, SubActivityGroup>();
    items.forEach((item) => {
      const current = grouped.get(item.subActivityId);
      if (current) {
        current.records.push(item);
      } else {
        grouped.set(item.subActivityId, {
          id: item.subActivityId,
          name: item.subActivityName,
          records: [item],
        });
      }
    });
    return Array.from(grouped.values());
  }, [items]);

  const filteredGroups = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return groups;
    return groups
      .map((group) => {
        if (group.name.toLowerCase().includes(term)) return group;
        const records = group.records.filter((item) =>
          [item.category, item.valueChain, item.name].join(" ").toLowerCase().includes(term),
        );
        return records.length > 0 ? { ...group, records } : null;
      })
      .filter((group): group is SubActivityGroup => group !== null);
  }, [groups, query]);

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleGroups = filteredGroups.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const filteredRecordCount = filteredGroups.reduce(
    (total, group) => total + group.records.length,
    0,
  );

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
        description="Manage activities, value-chain relationships, and approved budgets."
        actions={
          <Button asChild>
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
              placeholder="Search Sub-Sub Activities..."
              className="pl-9"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredGroups.length} Sub Activit{filteredGroups.length === 1 ? "y" : "ies"} ·{" "}
            {filteredRecordCount} record{filteredRecordCount === 1 ? "" : "s"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-1050px text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Sub Activity</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Value Chain</th>
                <th className="px-4 py-3">Activity Name</th>
                <th className="px-4 py-3 text-right">Approved Budget</th>
                <th className="px-4 py-3">Created At</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleGroups.map((group) => {
                const isOpen = expanded[group.id] ?? Boolean(query);
                return (
                  <Fragment key={group.id}>
                    <tr className="bg-muted/20 hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          onClick={() =>
                            setExpanded((current) => ({ ...current, [group.id]: !isOpen }))
                          }
                          className="flex w-full items-center gap-2 text-left font-semibold"
                        >
                          <ChevronRight
                            className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`}
                          />
                          <span>{group.name}</span>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {group.records.length}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {group.records[0]?.category}
                      </td>
                      <td colSpan={5} className="px-4 py-3 text-xs text-muted-foreground">
                        Click the Sub Activity to {isOpen ? "hide" : "view"} its records
                      </td>
                    </tr>

                    {isOpen &&
                      group.records.map((item, index) => (
                        <tr key={item.id} className="bg-card hover:bg-muted/30">
                          <td className="px-4 py-3 pl-10 text-muted-foreground">
                            Record {index + 1}
                          </td>
                          <td className="px-4 py-3">{item.category}</td>
                          <td className="px-4 py-3">
                            {item.valueChain || (
                              <span className="text-muted-foreground">Not applicable</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {item.name || (
                              <span className="text-muted-foreground">Not specified</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                            {money.format(Number(item.approvedActivityBudget))}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {new Date(item.createdAt).toLocaleDateString("en-KE")}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              {deleteId === item.id ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(item.id)}
                                  >
                                    Delete
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setDeleteId(null)}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button asChild size="icon" variant="ghost" title="View">
                                    <Link to={`/projects/sub-sub-activities/${item.id}/view`}>
                                      <Eye className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                  <Button asChild size="icon" variant="ghost" title="Edit">
                                    <Link to={`/projects/sub-sub-activities/${item.id}/edit`}>
                                      <Pencil className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    title="Delete"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => setDeleteId(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </Fragment>
                );
              })}
              {visibleGroups.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    {query
                      ? "No Sub-Sub Activities match your search."
                      : "No Sub-Sub Activities yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-border p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted-foreground">
            {filteredGroups.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, filteredGroups.length)} of {filteredGroups.length}{" "}
            Sub Activities
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
