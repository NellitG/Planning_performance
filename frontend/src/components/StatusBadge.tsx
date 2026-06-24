import { cn } from "@/lib/utils";

type StatusKey = "Active" | "Completed" | "Delayed" | "Pending" | "Inactive" | "Suspended";

const STATUS_STYLES: Record<StatusKey, string> = {
  Active: "bg-green-100 text-green-800 ring-green-600/20",
  Completed: "bg-blue-100 text-blue-800 ring-blue-600/20",
  Delayed: "bg-amber-100 text-amber-800 ring-amber-600/20",
  Pending: "bg-slate-100 text-slate-700 ring-slate-500/20",
  Inactive: "bg-slate-100 text-slate-700 ring-slate-500/20",
  Suspended: "bg-red-100 text-red-800 ring-red-600/20",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status as StatusKey] ?? "bg-slate-100 text-slate-700 ring-slate-500/20";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", style, className)}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
