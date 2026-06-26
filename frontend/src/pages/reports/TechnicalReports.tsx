import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, Download, Edit3, FileText, Plus, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

const primaryTabs = ["Q1 FY2025/26", "Q2 FY2025/26", "Q3 FY2025/26", "Q4 FY2025/26", "Annual"];
const secondaryTabs = ["All Reports", "Draft", "Submitted", "Under Review", "Approved"];

type StatusKey = "Approved" | "Under Review" | "Draft" | "Submitted";

const statusTone: Record<StatusKey, string> = {
  Approved: "bg-green-100 text-green-800",
  "Under Review": "bg-amber-100 text-amber-800",
  Draft: "bg-slate-100 text-slate-700",
  Submitted: "bg-blue-100 text-blue-800",
};

interface TechnicalReport {
  id: string;
  project: string;
  quarter: string;
  submitted: string;
  category: string;
  progress: string;
  status: StatusKey;
}

const reports: TechnicalReport[] = [
  { id: "TR-2025-001", project: "Report 1", quarter: "Q1 FY2025/26", submitted: "Oct 15, 2025", category: "Research", progress: "75%", status: "Approved" },
  { id: "TR-2025-002", project: "Report 2", quarter: "Q1 FY2025/26", submitted: "Oct 18, 2025", category: "Development", progress: "60%", status: "Under Review" },
  { id: "TR-2025-003", project: "Report 3", quarter: "Q2 FY2025/26", submitted: "Jan 12, 2026", category: "Innovation", progress: "88%", status: "Draft" },
  { id: "TR-2025-004", project: "Report 4", quarter: "Q2 FY2025/26", submitted: "Jan 14, 2026", category: "Infrastructure", progress: "92%", status: "Submitted" },
  { id: "TR-2025-005", project: "Report 5", quarter: "Q3 FY2025/26", submitted: "Apr 8, 2026", category: "Research", progress: "45%", status: "Approved" },
  { id: "TR-2025-006", project: "Report 6", quarter: "Q3 FY2025/26", submitted: "Apr 11, 2026", category: "Capacity Building", progress: "68%", status: "Under Review" },
];

export default function TechnicalReports() {
  const [tab, setTab] = useState(primaryTabs[0]);
  const [sub, setSub] = useState("All Reports");
  const [q, setQ] = useState("");

  const filtered = useMemo(() =>
    reports.filter((r) =>
      (tab === "Annual" || r.quarter === tab) &&
      (sub === "All Reports" || r.status === sub) &&
      (!q || r.project.toLowerCase().includes(q.toLowerCase()) || r.id.toLowerCase().includes(q.toLowerCase()))
    ), [tab, sub, q]);

  return (
    <>
      <div className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
        <span>Dashboard</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Technical Reports</span>
      </div>
      <h1 className="mb-5 text-2xl font-semibold">Technical Reports</h1>

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg border p-1 shadow-sm">
        {primaryTabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition",
              tab === t
                ? "bg-[(--brand-green)] text-black shadow-sm"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1">
              {secondaryTabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setSub(t)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition",
                    sub === t ? "bg-muted font-semibold" : "text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-52 pl-9 text-sm"
                />
              </div>
              <Button variant="outline" size="sm" className="gap-1.5">
                <SlidersHorizontal className="h-4 w-4" /> Filter
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-4 w-4" /> Export
              </Button>
              <Button asChild size="sm" className="gap-1.5 text-white">
                <Link to="/new-report"><Plus className="h-4 w-4" /> New Report</Link>
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2.5 text-left font-medium">Report ID</th>
                  <th className="py-2.5 text-left font-medium">Project</th>
                  <th className="py-2.5 text-left font-medium">Category</th>
                  <th className="py-2.5 text-left font-medium">Submitted</th>
                  <th className="py-2.5 text-left font-medium">Progress</th>
                  <th className="py-2.5 text-left font-medium">Status</th>
                  <th className="py-2.5 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">No reports found.</td></tr>
                )}
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-xs">{r.id}</span>
                      </div>
                    </td>
                    <td className="max-w-52 py-3">
                      <div className="truncate font-medium">{r.project}</div>
                      <div className="text-xs text-muted-foreground">{r.quarter}</div>
                    </td>
                    <td className="py-3 text-muted-foreground">{r.category}</td>
                    <td className="py-3 text-muted-foreground">{r.submitted}</td>
                    <td className="py-3 font-semibold text-[(--brand-green)]">{r.progress}</td>
                    <td className="py-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", statusTone[r.status])}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.info("Edit report")}>
                          <Edit3 className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.info("Download triggered")}>
                          <Download className="h-3.5 w-3.5" /> Download
                        </Button>
                        <Button asChild variant="outline" size="sm" className="gap-1">
                          <Link to="/new-report"><Plus className="h-3.5 w-3.5" /> New</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-xs text-muted-foreground">
            Showing {filtered.length} of {reports.length} reports
          </div>
        </Card>
      </motion.div>
    </>
  );
}
