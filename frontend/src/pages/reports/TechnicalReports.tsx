import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowDownUp, ChevronLeft, ChevronRight, Download, Edit3, Eye, FileText, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useDeleteTechnicalReport, useTechnicalReports, useTechnicalReportYears } from "@/hooks/useProjectsApi";
import type { TechnicalReport } from "@/utils/types";

const quarterOptions = ["Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4", "Annual"];
const statusTabs = ["All Reports", "Draft", "Submitted", "Under Review", "Approved"];
const statusTone: Record<string, string> = { Approved: "bg-green-100 text-green-800", "Under Review": "bg-amber-100 text-amber-800", Draft: "bg-slate-100 text-slate-700", Submitted: "bg-blue-100 text-blue-800" };
type SortKey = "mainProjectName" | "financialYear" | "quarter" | "createdAt" | "status";

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export default function TechnicalReports() {
  const [financialYear, setFinancialYear] = useState<string | null>(null);
  const [quarterSelected, setQuarterSelected] = useState<string>("Annual");
  const [status, setStatus] = useState("All Reports");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [reportToDelete, setReportToDelete] = useState<TechnicalReport | null>(null);
  const { data: reports = [], isLoading, isError, error } = useTechnicalReports({ financialYear: financialYear ?? undefined, quarter: quarterSelected ?? undefined });
  const { data: availableYears = [] } = useTechnicalReportYears();
  const deleteReport = useDeleteTechnicalReport();

  const filtered = useMemo(() => reports.filter((report) => {
    const quarterDigit = quarterSelected.match(/\d/)?.[0];
    const matchesQuarter = quarterSelected === "Annual" ? (report.quarter || "").toLowerCase().includes("annual") : !quarterDigit || (report.quarter || "").includes(quarterDigit);
    const matchesFY = !financialYear || report.financialYear === financialYear;
    const matchesStatus = status === "All Reports" || report.status === status;
    const text = [report.mainProjectName, report.projectName, report.title, report.financialYear, report.quarter, report.status, report.id].join(" ").toLowerCase();
    return matchesFY && matchesQuarter && matchesStatus && (!search || text.includes(search.toLowerCase()));
  }).sort((a, b) => {
    const result = String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""), undefined, { numeric: true });
    return sortDirection === "asc" ? result : -result;
  }), [reports, financialYear, quarterSelected, status, search, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [financialYear, quarterSelected, status, search, pageSize]);

  // default financial year when available
  useEffect(() => {
    if (!financialYear && availableYears && availableYears.length) {
      setFinancialYear(availableYears[0]);
    }
  }, [availableYears, financialYear]);
  const changeSort = (key: SortKey) => { setSortKey(key); setSortDirection((current) => sortKey === key && current === "asc" ? "desc" : "asc"); };
  const remove = async () => {
    if (!reportToDelete) return;
    try {
      await deleteReport.mutateAsync(reportToDelete.id);
      setReportToDelete(null);
      toast.success("Technical report deleted successfully.");
    } catch {
      toast.error("Failed to delete technical report.");
    }
  };
  const heading = (label: string, key: SortKey) => <th className="py-2.5 pr-3 text-left font-medium"><button type="button" className="inline-flex items-center gap-1" onClick={() => changeSort(key)}>{label}<ArrowDownUp className="h-3 w-3" /></button></th>;

  return <>
    <div className="mb-4 flex items-center gap-1 text-xs text-muted-foreground"><span>Dashboard</span><ChevronRight className="h-3 w-3" /><span className="text-foreground">Technical Reports</span></div>
    <h1 className="mb-5 text-2xl font-semibold">Technical Reports</h1>
    <motion.div key={`${financialYear}-${quarterSelected}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-1">{statusTabs.map((item) => <button key={item} onClick={() => setStatus(item)} className={cn("rounded-md px-2.5 py-1 text-xs font-medium", status === item ? "bg-muted font-semibold" : "text-muted-foreground hover:bg-muted/50")}>{item}</button>)}</div>
        <div className="flex flex-wrap items-center gap-2"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search reports..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-52 pl-9 text-sm" /></div>
          <Select value={financialYear ?? ""} onValueChange={(value) => setFinancialYear(value)}>
            <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{availableYears.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={quarterSelected} onValueChange={(value) => setQuarterSelected(value)}>
            <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{quarterOptions.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}><SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger><SelectContent>{[5, 10, 20].map((size) => <SelectItem key={size} value={String(size)}>{size} / page</SelectItem>)}</SelectContent></Select><Button asChild size="sm" className="gap-1.5 text-white"><Link to="/new-report"><Plus className="h-4 w-4" /> New Report</Link></Button></div>
      </div>
      {isError && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error instanceof Error ? error.message : "Unable to load reports."}</div>}
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">{heading("Main Project", "mainProjectName")}{heading("Financial Year", "financialYear")}{heading("Quarter", "quarter")}{heading("Date Created", "createdAt")}{heading("Status", "status")}<th className="py-2.5 text-left font-medium">Actions</th></tr></thead><tbody>
        {!rows.length && <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">{isLoading ? "Loading reports..." : (financialYear ? `No technical reports found for ${quarterSelected}, Financial Year ${financialYear}.` : "No reports found.")}</td></tr>}
        {rows.map((report) => <tr key={report.id} className="border-b last:border-0 hover:bg-muted/30"><td className="max-w-64 py-3 pr-3"><div className="flex items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-muted-foreground" /><div className="min-w-0"><Link to={report.mainProjectId ? `/technical-reports/main/${report.mainProjectId}` : `/technical-reports/${report.id}`} className="truncate font-medium hover:text-primary hover:underline">{report.mainProjectName || report.projectName || report.title || "N/A"}</Link><div className="text-xs text-muted-foreground">{report.projectName || `TR-${report.id}`}</div></div></div></td><td className="py-3 pr-3 text-muted-foreground">{report.financialYear || "N/A"}</td><td className="py-3 pr-3 text-muted-foreground">{report.quarter || "N/A"}</td><td className="py-3 pr-3 text-muted-foreground">{formatDate(report.createdAt)}</td><td className="py-3 pr-3"><span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", statusTone[report.status || "Draft"])}>{report.status || "Draft"}</span></td><td className="py-3"><div className="flex flex-wrap gap-1"><Button asChild variant="outline" size="sm" className="gap-1"><Link to={`/technical-reports/${report.id}`} aria-label={`View ${report.title}`}><Eye className="h-3.5 w-3.5" /> View</Link></Button><Button asChild variant="outline" size="sm" className="gap-1"><Link to={`/technical-reports/${report.id}/edit`} aria-label={`Edit ${report.title}`}><Edit3 className="h-3.5 w-3.5" /> Edit</Link></Button><Button variant="outline" size="sm" className="gap-1 text-red-700 hover:text-red-800" onClick={() => setReportToDelete(report)} disabled={deleteReport.isPending}><Trash2 className="h-3.5 w-3.5" /> Delete</Button><Button asChild variant="outline" size="sm" className="gap-1"><Link to={`/technical-reports/${report.id}`} state={{ download: true }}><Download className="h-3.5 w-3.5" /> PDF</Link></Button></div></td></tr>)}
      </tbody></table></div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"><span>Showing {rows.length ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, filtered.length)} of {filtered.length} reports</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft className="h-4 w-4" /> Previous</Button><span>Page {page} of {totalPages}</span><Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}>Next <ChevronRight className="h-4 w-4" /></Button></div></div>
    </Card></motion.div>
    <AlertDialog open={Boolean(reportToDelete)} onOpenChange={(open) => !open && !deleteReport.isPending && setReportToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Delete technical report?</AlertDialogTitle><AlertDialogDescription>This will permanently delete <span className="font-medium text-foreground">{reportToDelete?.title}</span>. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel disabled={deleteReport.isPending}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-red-700 hover:bg-red-800" onClick={remove} disabled={deleteReport.isPending}>{deleteReport.isPending ? "Deleting..." : "Delete report"}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}
