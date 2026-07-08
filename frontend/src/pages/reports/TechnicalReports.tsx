import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownUp, ChevronLeft, ChevronRight, Download, Edit3, Eye, FileText, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
  useMainActivities,
  useMainActivityIndicators,
  useSubActivities,
  useSubSubActivities,
  useTechnicalReports,
  useUpdateTechnicalReport,
} from "@/hooks/useProjectsApi";
import type { MainActivityIndicator, SubSubActivity, TechnicalReport } from "@/utils/types";

const primaryTabs = ["Q1 FY2025/26", "Q2 FY2025/26", "Q3 FY2025/26", "Q4 FY2025/26", "Annual"];
const secondaryTabs = ["All Reports", "Draft", "Submitted", "Under Review", "Approved"];
const pageSizes = [5, 10, 20];

type StatusKey = "Approved" | "Under Review" | "Draft" | "Submitted";
type SortKey = "title" | "mainActivityName" | "subActivityName" | "reportingPeriod" | "createdAt" | "status";

interface EditForm {
  title: string;
  mainActivityId: string;
  subActivityId: string;
  reportingPeriod: string;
  startDate: string;
  endDate: string;
  disbursedAmount: string;
  utilizedAmount: string;
  status: string;
  achievement: string;
  remarks: string;
  supportingInformation: string;
}

const statusTone: Record<StatusKey, string> = {
  Approved: "bg-green-100 text-green-800",
  "Under Review": "bg-amber-100 text-amber-800",
  Draft: "bg-slate-100 text-slate-700",
  Submitted: "bg-blue-100 text-blue-800",
};

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function utilization(disbursed: string | number | null | undefined, utilized: string | number | null | undefined) {
  const base = Number(disbursed || 0);
  return base > 0 ? ((Number(utilized || 0) / base) * 100).toFixed(2) : "0.00";
}

function cleanPdfText(value: unknown) {
  return String(value ?? "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function toEditForm(report: TechnicalReport): EditForm {
  return {
    title: report.title || "",
    mainActivityId: report.mainActivityId || "",
    subActivityId: report.subActivityId || "",
    reportingPeriod: report.reportingPeriod || "",
    startDate: report.startDate || "",
    endDate: report.endDate || "",
    disbursedAmount: String(report.disbursedAmount ?? 0),
    utilizedAmount: String(report.utilizedAmount ?? 0),
    status: report.status || "Draft",
    achievement: report.achievement || "",
    remarks: report.remarks || "",
    supportingInformation: report.supportingInformation || "",
  };
}

export default function TechnicalReports() {
  const [tab, setTab] = useState(primaryTabs[0]);
  const [sub, setSub] = useState("All Reports");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedReport, setSelectedReport] = useState<TechnicalReport | null>(null);
  const [editReport, setEditReport] = useState<TechnicalReport | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editError, setEditError] = useState("");
  const { data: reports = [], isLoading, isError, error } = useTechnicalReports();
  const { data: mainActivities = [] } = useMainActivities();
  const { data: subActivities = [] } = useSubActivities();
  const { data: subSubActivities = [] } = useSubSubActivities();
  const { data: mainIndicators = [] } = useMainActivityIndicators();
  const updateReport = useUpdateTechnicalReport();

  const filtered = useMemo(() =>
    reports
      .filter((r) =>
        (tab === "Annual" || (r.reportingPeriod || "").includes(tab.split(" ")[0])) &&
        (sub === "All Reports" || r.status === sub) &&
        (!q || [r.title, r.id, r.mainActivityName, r.subActivityName, r.reportingPeriod, r.status]
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase()))
      )
      .sort((a, b) => {
        const av = String(a[sortKey] ?? "").toLowerCase();
        const bv = String(b[sortKey] ?? "").toLowerCase();
        const result = av.localeCompare(bv, undefined, { numeric: true });
        return sortDirection === "asc" ? result : -result;
      }), [tab, sub, q, reports, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedReports = filtered.slice((page - 1) * pageSize, page * pageSize);
  const editSubActivities = subActivities.filter((item) => item.mainActivityId === editForm?.mainActivityId);
  const editSubSubActivities = subSubActivities.filter((item) => item.subActivityId === editForm?.subActivityId);
  const editIndicators = mainIndicators.filter((item) => item.mainActivityId === editForm?.mainActivityId);

  useEffect(() => {
    setPage(1);
  }, [tab, sub, q, pageSize]);

  const changeSort = (key: SortKey) => {
    setSortKey(key);
    setSortDirection((current) => (sortKey === key && current === "asc" ? "desc" : "asc"));
  };

  const openDetails = (report: TechnicalReport) => setSelectedReport(report);
  const openEdit = (report: TechnicalReport) => {
    setEditReport(report);
    setEditForm(toEditForm(report));
    setEditError("");
  };

  const saveEdit = async () => {
    if (!editReport || !editForm) return;
    if (!editForm.title.trim() || !editForm.mainActivityId || !editForm.subActivityId || !editForm.reportingPeriod.trim()) {
      setEditError("Report title, Main Activity, Sub Activity, and Reporting Period are required.");
      return;
    }
    if (editForm.startDate && editForm.endDate && editForm.endDate < editForm.startDate) {
      setEditError("End date cannot be before start date.");
      return;
    }
    try {
      await updateReport.mutateAsync({
        id: editReport.id,
        title: editForm.title.trim(),
        mainActivityId: editForm.mainActivityId,
        subActivityId: editForm.subActivityId,
        subSubActivities: editSubSubActivities.map((activity: SubSubActivity) => ({
          id: activity.id,
          name: activity.name || activity.subActivityName,
          approvedActivityBudget: activity.approvedActivityBudget,
        })),
        indicators: editIndicators.map((indicator: MainActivityIndicator) => ({
          id: indicator.id,
          indicator: indicator.indicator,
          target: indicator.target,
        })),
        reportingPeriod: editForm.reportingPeriod.trim(),
        startDate: editForm.startDate || null,
        endDate: editForm.endDate || null,
        disbursedAmount: Number(editForm.disbursedAmount || 0),
        utilizedAmount: Number(editForm.utilizedAmount || 0),
        percentageUtilization: Number(utilization(editForm.disbursedAmount, editForm.utilizedAmount)),
        status: editForm.status,
        achievement: editForm.achievement,
        remarks: editForm.remarks,
        supportingInformation: editForm.supportingInformation,
        supportingDocuments: editReport.supportingDocuments || [],
      });
      toast.success("Report updated successfully.");
      setEditReport(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update report.");
    }
  };

  const downloadPdf = (report: TechnicalReport) => {
    const lines = [
      "KALRO Planning, Performance Management System",
      "Technical Report",
      "",
      `Report Title: ${report.title}`,
      `Main Activity: ${report.mainActivityName || "N/A"}`,
      `Sub Activity: ${report.subActivityName || "N/A"}`,
      `Reporting Period: ${report.reportingPeriod || "N/A"}`,
      `Date Created: ${formatDate(report.createdAt)}`,
      `Status: ${report.status || "Draft"}`,
      `Start Date: ${formatDate(report.startDate)}`,
      `End Date: ${formatDate(report.endDate)}`,
      `Amount Disbursed: ${report.disbursedAmount ?? 0}`,
      `Amount Utilized: ${report.utilizedAmount ?? 0}`,
      `Utilization: ${report.percentageUtilization ?? utilization(report.disbursedAmount, report.utilizedAmount)}%`,
      "",
      "Sub-Sub Activities:",
      ...((report.subSubActivities || []).map((item, index) => `${index + 1}. ${item.name}`)),
      "",
      "Indicators:",
      ...((report.indicators || []).map((item, index) => `${index + 1}. ${item.indicator}${item.target ? ` - Target: ${item.target}` : ""}`)),
      "",
      `Achievement: ${report.achievement || "N/A"}`,
      `Remarks: ${report.remarks || "N/A"}`,
      `Supporting Information: ${report.supportingInformation || "N/A"}`,
      "Supporting Documents:",
      ...((report.supportingDocuments || []).length ? report.supportingDocuments || [] : ["N/A"]),
    ].slice(0, 52);
    const stream = [
      "BT",
      "/F1 16 Tf 50 800 Td (KALRO Technical Report) Tj",
      ...lines.map((line, index) => `/F1 ${index < 2 ? 12 : 10} Tf 0 -14 Td (${cleanPdfText(line).slice(0, 112)}) Tj`),
      "ET",
    ].join("\n");
    const objects = [
      "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
      "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
      "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
      "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
      `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
    ];
    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((object) => {
      offsets.push(pdf.length);
      pdf += `${object}\n`;
    });
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

    const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${cleanPdfText(report.title || "technical-report").replace(/\\[()]/g, "").replace(/\s+/g, "-").toLowerCase()}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("PDF downloaded.");
  };

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
              <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
                <SelectTrigger className="h-9 w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizes.map((size) => (
                    <SelectItem key={size} value={String(size)}>{size} / page</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button asChild size="sm" className="gap-1.5 text-white">
                <Link to="/new-report"><Plus className="h-4 w-4" /> New Report</Link>
              </Button>
            </div>
          </div>

          {isError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error instanceof Error ? error.message : "Unable to load reports."}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2.5 pr-3 text-left font-medium">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => changeSort("title")}>Report Title <ArrowDownUp className="h-3 w-3" /></button>
                  </th>
                  <th className="py-2.5 pr-3 text-left font-medium">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => changeSort("mainActivityName")}>Main Activity <ArrowDownUp className="h-3 w-3" /></button>
                  </th>
                  <th className="py-2.5 pr-3 text-left font-medium">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => changeSort("subActivityName")}>Sub Activity <ArrowDownUp className="h-3 w-3" /></button>
                  </th>
                  <th className="py-2.5 pr-3 text-left font-medium">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => changeSort("reportingPeriod")}>Reporting Period <ArrowDownUp className="h-3 w-3" /></button>
                  </th>
                  <th className="py-2.5 pr-3 text-left font-medium">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => changeSort("createdAt")}>Date Created <ArrowDownUp className="h-3 w-3" /></button>
                  </th>
                  <th className="py-2.5 pr-3 text-left font-medium">
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => changeSort("status")}>Status <ArrowDownUp className="h-3 w-3" /></button>
                  </th>
                  <th className="py-2.5 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReports.length === 0 && (
                  <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">{isLoading ? "Loading reports..." : "No reports found."}</td></tr>
                )}
                {paginatedReports.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="max-w-64 py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <div className="truncate font-medium">{r.title}</div>
                          <div className="text-xs text-muted-foreground">TR-{r.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-52 py-3 pr-3 text-muted-foreground">{r.mainActivityName || "N/A"}</td>
                    <td className="max-w-52 py-3 pr-3 text-muted-foreground">{r.subActivityName || "N/A"}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{r.reportingPeriod || "N/A"}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{formatDate(r.createdAt)}</td>
                    <td className="py-3 pr-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", statusTone[(r.status as StatusKey) || "Draft"]) }>
                        {r.status || "Draft"}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => openDetails(r)}>
                          <Eye className="h-3.5 w-3.5" /> View
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => openEdit(r)}>
                          <Edit3 className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => downloadPdf(r)}>
                          <Download className="h-3.5 w-3.5" /> PDF
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              Showing {paginatedReports.length ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, filtered.length)} of {filtered.length} reports
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <span>Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      <Dialog open={Boolean(selectedReport)} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedReport?.title || "Report details"}</DialogTitle>
            <DialogDescription>Read-only view of the saved technical report.</DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div><span className="font-medium">Main Activity:</span> {selectedReport.mainActivityName || "N/A"}</div>
                <div><span className="font-medium">Sub Activity:</span> {selectedReport.subActivityName || "N/A"}</div>
                <div><span className="font-medium">Reporting Period:</span> {selectedReport.reportingPeriod || "N/A"}</div>
                <div><span className="font-medium">Status:</span> {selectedReport.status || "Draft"}</div>
                <div><span className="font-medium">Start Date:</span> {formatDate(selectedReport.startDate)}</div>
                <div><span className="font-medium">End Date:</span> {formatDate(selectedReport.endDate)}</div>
                <div><span className="font-medium">Amount Disbursed:</span> {selectedReport.disbursedAmount ?? 0}</div>
                <div><span className="font-medium">Amount Utilized:</span> {selectedReport.utilizedAmount ?? 0}</div>
                <div><span className="font-medium">Utilization:</span> {selectedReport.percentageUtilization ?? utilization(selectedReport.disbursedAmount, selectedReport.utilizedAmount)}%</div>
              </div>
              <div className="rounded-md border bg-muted/20 p-3"><span className="font-medium">Sub-Sub Activities:</span>
                <ul className="mt-1 list-disc pl-5">
                  {(selectedReport.subSubActivities || []).length ? selectedReport.subSubActivities.map((item) => <li key={item.name}>{item.name}</li>) : <li>N/A</li>}
                </ul>
              </div>
              <div className="rounded-md border bg-muted/20 p-3"><span className="font-medium">Indicators:</span>
                <ul className="mt-1 list-disc pl-5">
                  {(selectedReport.indicators || []).length ? selectedReport.indicators.map((item) => <li key={item.indicator}>{item.indicator}{item.target ? ` - Target: ${item.target}` : ""}</li>) : <li>N/A</li>}
                </ul>
              </div>
              <div className="rounded-md border bg-muted/20 p-3"><span className="font-medium">Achievement:</span><p className="mt-1 whitespace-pre-wrap">{selectedReport.achievement || "N/A"}</p></div>
              <div className="rounded-md border bg-muted/20 p-3"><span className="font-medium">Remarks:</span><p className="mt-1 whitespace-pre-wrap">{selectedReport.remarks || "N/A"}</p></div>
              <div className="rounded-md border bg-muted/20 p-3"><span className="font-medium">Supporting Information:</span><p className="mt-1 whitespace-pre-wrap">{selectedReport.supportingInformation || "N/A"}</p></div>
              <div className="rounded-md border bg-muted/20 p-3"><span className="font-medium">Attached Files:</span>
                <ul className="mt-1 list-disc pl-5">
                  {(selectedReport.supportingDocuments || []).length ? selectedReport.supportingDocuments?.map((name) => <li key={name}>{name}</li>) : <li>N/A</li>}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editReport)} onOpenChange={() => setEditReport(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Report</DialogTitle>
            <DialogDescription>Update report information and save changes to the backend.</DialogDescription>
          </DialogHeader>
          {editReport && editForm && (
            <div className="space-y-4">
              {editError && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{editError}</div>}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Report Title</Label>
                  <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Reporting Period</Label>
                  <Input value={editForm.reportingPeriod} onChange={(e) => setEditForm({ ...editForm, reportingPeriod: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Main Activity</Label>
                  <Select value={editForm.mainActivityId} onValueChange={(value) => setEditForm({ ...editForm, mainActivityId: value, subActivityId: "" })}>
                    <SelectTrigger><SelectValue placeholder="Select Main Activity" /></SelectTrigger>
                    <SelectContent>
                      {mainActivities.map((activity) => <SelectItem key={activity.id} value={activity.id}>{activity.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Sub Activity</Label>
                  <Select value={editForm.subActivityId} onValueChange={(value) => setEditForm({ ...editForm, subActivityId: value })} disabled={!editForm.mainActivityId}>
                    <SelectTrigger><SelectValue placeholder="Select Sub Activity" /></SelectTrigger>
                    <SelectContent>
                      {editSubActivities.map((activity) => <SelectItem key={activity.id} value={activity.id}>{activity.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Start Date</Label>
                  <Input type="date" value={editForm.startDate} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date</Label>
                  <Input type="date" value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Amount Disbursed</Label>
                  <Input type="number" value={editForm.disbursedAmount} onChange={(e) => setEditForm({ ...editForm, disbursedAmount: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Amount Utilized</Label>
                  <Input type="number" value={editForm.utilizedAmount} onChange={(e) => setEditForm({ ...editForm, utilizedAmount: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Percentage Utilization</Label>
                  <div className="grid h-9 place-items-center rounded-md border bg-muted/40 text-sm font-semibold text-[(--brand-green)]">
                    {utilization(editForm.disbursedAmount, editForm.utilizedAmount)}%
                  </div>
                </div>
              <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Submitted">Submitted</SelectItem>
                      <SelectItem value="Under Review">Under Review</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-md border bg-muted/20 p-3">
                  <div className="text-sm font-medium">Sub-Sub Activities</div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                    {editSubSubActivities.length ? editSubSubActivities.map((item) => <li key={item.id}>{item.name || item.subActivityName}</li>) : <li>N/A</li>}
                  </ul>
                </div>
                <div className="rounded-md border bg-muted/20 p-3">
                  <div className="text-sm font-medium">Indicators</div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                    {editIndicators.length ? editIndicators.map((item) => <li key={item.id}>{item.indicator}</li>) : <li>N/A</li>}
                  </ul>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Achievement</Label>
                <Textarea value={editForm.achievement} onChange={(e) => setEditForm({ ...editForm, achievement: e.target.value })} rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label>Remarks</Label>
                <Textarea value={editForm.remarks} onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })} rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label>Supporting Information</Label>
                <Textarea value={editForm.supportingInformation} onChange={(e) => setEditForm({ ...editForm, supportingInformation: e.target.value })} rows={3} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditReport(null)}>Cancel</Button>
                <Button onClick={saveEdit} disabled={updateReport.isPending}>{updateReport.isPending ? "Saving..." : "Save Changes"}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
