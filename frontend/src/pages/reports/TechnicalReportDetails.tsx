import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Download, Edit3, Eye, FileText, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useReportWorkflowAction, useTechnicalReport } from "@/hooks/useProjectsApi";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { canManageTechnicalReports, hasAnyRole } from "@/utils/roleAccess";
import { api } from "@/utils/apiClient";

const date = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : "N/A";

export default function TechnicalReportDetails() {
  const { id } = useParams();
  const location = useLocation();
  const { auth } = useAuth();

  const {
    data: report,
    isLoading,
    isError,
    error,
    refetch,
  } = useTechnicalReport(id);
  const workflowAction = useReportWorkflowAction();
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewComments, setReviewComments] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [evidencePreview, setEvidencePreview] = useState<{ url: string; name: string; fileType?: string } | null>(null);
  const [loadingEvidenceId, setLoadingEvidenceId] = useState<string | null>(null);
  const openPreview = useCallback(async (currentReport: NonNullable<typeof report>) => {
    setPreviewLoading(true);
    try {
      const pdf = await api.getBlob(`/technical-reports/${currentReport.id}/pdf/`);
      if (pdf.type !== "application/pdf") throw new Error("The server did not return a PDF document.");
      const url = URL.createObjectURL(pdf);
      setPreviewUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return url;
      });
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Unable to generate the report PDF.");
    } finally {
      setPreviewLoading(false);
    }
  }, []);
  const downloadPreview = () => {
    if (!previewUrl) return;
    const anchor = document.createElement("a"); anchor.href = previewUrl; anchor.download = `technical-report-${id}.pdf`; anchor.click();
  };
  const previewEvidence = async (indicatorReportId: string, file: { id: string; name: string; fileType?: string }) => {
    if (!report) return;
    setLoadingEvidenceId(file.id);
    try {
      const blob = await api.getBlob(
        `/technical-reports/${report.id}/indicator-reports/${indicatorReportId}/evidence/${file.id}/download/`,
      );
      const url = URL.createObjectURL(blob);
      if (evidencePreview) URL.revokeObjectURL(evidencePreview.url);
      setEvidencePreview({ url, name: file.name, fileType: file.fileType });
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Unable to load evidence.");
    } finally {
      setLoadingEvidenceId(null);
    }
  };
  const closeEvidencePreview = () => {
    if (evidencePreview) URL.revokeObjectURL(evidencePreview.url);
    setEvidencePreview(null);
  };
  const closePdfPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };
  const editableStatuses = ["Draft", "Rejected by Accountant", "Rejected by Project Coordinator", "Rejected by M&E"];
  const reviewerRoles: Record<string, string> = {
    "Submitted to Accountant": "accountant",
    "Submitted to Project Coordinator": "project_coordinator",
    "Submitted to M&E": "me",
  };
  const isEditable = Boolean(report && canManageTechnicalReports(auth) && editableStatuses.includes(report.status));
  const canSubmit = Boolean(report && hasAnyRole(auth, "value_chain_lead") && editableStatuses.includes(report.status));
  const canReview = Boolean(report && reviewerRoles[report.status] && hasAnyRole(auth, reviewerRoles[report.status]));
  const runWorkflowAction = async (action: "submit" | "approve" | "reject") => {
    if (!report || (action === "reject" && !rejectionReason.trim())) {
      toast.error("A rejection reason is required.");
      return;
    }
    try {
      await workflowAction.mutateAsync({
        id: report.id,
        action,
        ...(action === "reject" ? { reason: rejectionReason.trim() } : {}),
        ...(action === "approve" && reviewComments.trim() ? { comments: reviewComments.trim() } : {}),
      });
      setRejectionReason("");
      setReviewComments("");
      await refetch();
      toast.success(action === "submit" ? "Report submitted for review." : action === "approve" ? "Report approved." : "Report rejected and returned to the Value Chain Lead.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : `Unable to ${action} report.`);
    }
  };

  useEffect(() => {
    if (
      report &&
      (location.state as { download?: boolean } | null)?.download
    ) {
      openPreview(report);
    }
  }, [report, location.state, openPreview]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (evidencePreview) URL.revokeObjectURL(evidencePreview.url);
  }, [previewUrl, evidencePreview]);

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Loading technical report...
      </div>
    );
  }

  if (isError || !report) {
    return (
      <Card className="p-6">
        <p className="text-red-700">
          {error instanceof Error
            ? error.message
            : "Technical report could not be loaded."}
        </p>

        <Button asChild className="mt-4">
          <Link to="/technical-reports">
            Back to Technical Reports
          </Link>
        </Button>
      </Card>
    );
  }

  const item = (label: string, value: unknown) => (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>

      <dd className="mt-1 font-medium">
        {value === null || value === undefined || value === "" ? "N/A" : String(value)}
      </dd>
    </div>
  );

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/technical-reports"
          className="inline-flex items-center gap-2 rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Technical Reports
        </Link>
        <h1 className="text-2xl font-semibold">
          Technical Report Details
        </h1>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 justify-end">
        {/* Preview saved report PDF */}
        <button
          type="button"
          onClick={() => openPreview(report)}
          disabled={previewLoading}
          className={cn(
            "inline-flex h-10 items-center justify-center gap-1.5",
            "rounded-md border border-input bg-background",
            "px-4 py-2 text-sm font-medium",
            "shadow-sm transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50"
          )}
        >
          {previewLoading ? <FileText className="h-4 w-4 animate-pulse" /> : <Eye className="h-4 w-4" />}
          {previewLoading ? "Generating PDF..." : "Preview PDF"}
        </button>

        {/* Edit Report */}
        {isEditable && <Link
          to={`/technical-reports/${report.id}/edit`}
          className={cn(
            "inline-flex h-10 items-center justify-center gap-1.5",
            "rounded-md bg-primary",
            "px-4 py-2 text-sm font-medium",
            "text-primary-foreground shadow",
            "transition-colors",
            "hover:bg-primary/90",
            "focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
        >
          <Edit3 className="h-4 w-4" />
          Edit Report
        </Link>}
      </div>
      <br></br>

      <Card className="mb-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Workflow Status</h2>
            <p className="mt-1 text-sm text-muted-foreground">Current stage: {report.status}</p>
            <p className="mt-1 text-sm text-muted-foreground">Financial review: {report.financialReviewStatus || "Pending"}</p>
          </div>
          <Badge variant={report.status === "Approved/Finalized" ? "default" : "outline"}>{report.status}</Badge>
        </div>
        {(canSubmit || canReview) && <div className="mt-4 flex flex-wrap items-end gap-3">
          {canSubmit && <Button onClick={() => runWorkflowAction("submit")} disabled={workflowAction.isPending}>{workflowAction.isPending ? "Submitting..." : report.status.startsWith("Rejected by ") ? "Resubmit Report" : "Submit for Review"}</Button>}
          {canReview && <>
            {report.status === "Submitted to Accountant" && <div className="min-w-64 flex-1">
              <label htmlFor="accountant-review-comments" className="mb-1 block text-sm font-medium">Accountant review comments (optional)</label>
              <Textarea id="accountant-review-comments" value={reviewComments} onChange={(event) => setReviewComments(event.target.value)} maxLength={2000} placeholder="Record any comments about the reported expenditure." />
            </div>}
            <div className="min-w-64 flex-1">
              <label htmlFor="rejection-reason" className="mb-1 block text-sm font-medium">Rejection reason (required to reject)</label>
              <Textarea id="rejection-reason" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} maxLength={2000} placeholder="Explain what needs to be corrected." />
            </div>
            <Button onClick={() => runWorkflowAction("approve")} disabled={workflowAction.isPending}>Approve</Button>
            <Button variant="destructive" onClick={() => runWorkflowAction("reject")} disabled={workflowAction.isPending || !rejectionReason.trim()}>Reject</Button>
          </>}
        </div>}
        <div className="mt-5 border-t pt-4">
          <h3 className="mb-3 text-sm font-semibold">Workflow History</h3>
          <ol className="space-y-3">
            {(report.workflowHistory || []).map((event, index) => <li key={`${event.at}-${index}`} className="border-l-2 border-muted pl-3 text-sm">
              <p className="font-medium">{event.action}: {event.newStatus || event.previousStatus}</p>
              <p className="text-xs text-muted-foreground">{event.user} · {event.role} · {new Date(event.at).toLocaleString()}</p>
              {event.rejectionReason && <p className="mt-1 text-sm text-red-700">Reason: {event.rejectionReason}</p>}
              {event.comments && <p className="mt-1 text-sm text-muted-foreground">Comments: {event.comments}</p>}
            </li>)}
            {!report.workflowHistory?.length && <li className="text-sm text-muted-foreground">No workflow events recorded.</li>}
          </ol>
        </div>
      </Card>

      {/* Report Card */}
      <Card className="space-y-6 p-6">
        {/* Report heading */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">
              {report.title}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Report ID: TR-{report.id}
            </p>
          </div>

        </div>

        {/* Report details */}
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {item("Project name", report.projectName)}
          {item("Financial year", report.financialYear)}
          {item("Quarter", report.quarter)}
          {item("Main activity", report.mainActivityName)}
          {item("Category", report.category)}
          {item("Value chain", report.valueChain)}
          {item("Sub activity", report.subActivityName)}
          {item("Reporting location", report.selectedLocations?.length ? report.selectedLocations.map((place) => [place.countyName, place.subCountyName, place.wardName].filter(Boolean).join(" / ")).join(", ") : report.wardName || "General")}
          {item("Reporting period", report.reportingPeriod)}
          {item("Date created", date(report.createdAt))}
          {item("Amount disbursed", report.disbursedAmount)}
          {item("Amount utilized", report.utilizedAmount)}
          {item("Amount remaining", report.amountRemaining)}
          {item(
            "Percentage utilization",
            `${report.percentageUtilization ?? 0}%`
          )}
        </dl>

        <section>
          <h3 className="mb-3 font-semibold">Geographic Coverage</h3>
          <div className="space-y-2 rounded-md border bg-muted/20 p-4 text-sm">
            {(report.selectedLocations?.length ? report.selectedLocations : report.wardName ? [{ countyName: report.countyName || "County not recorded", subCountyName: report.subCountyName || "Sub-county not recorded", wardName: report.wardName }] : []).map((place, index) => (
              <div key={`${place.countyName}-${place.subCountyName}-${place.wardName}-${index}`} className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-700" /><span>
                  {[place.countyName, place.subCountyName, place.wardName].filter(Boolean).join(" → ")}</span>
              </div>
            ))}
            {!report.selectedLocations?.length && !report.wardName && <span>N/A</span>}
          </div>
        </section>

        <section>
          <h3 className="mb-3 font-semibold">Indicators &amp; Reporting</h3>
          <div className="space-y-4">
            {(report.relatedWardReports?.length ? report.relatedWardReports : [{ id: report.id, wardId: report.wardId, wardName: report.wardName || "", locationId: null, locationLevel: report.wardName ? "Ward" : "General", subCountyName: report.subCountyName || "", countyName: report.countyName || "", indicatorReports: report.indicatorReports || [], disbursedAmount: report.disbursedAmount || 0, utilizedAmount: report.utilizedAmount || 0 }]).map((wardReport) => (
              <div key={wardReport.id} className="rounded-md border p-4">
                <p className="mb-3 text-sm font-semibold text-green-800">{[wardReport.countyName, wardReport.subCountyName, wardReport.wardName].filter(Boolean).join(" → ") || wardReport.locationLevel || "General report"}</p>
                <div className="space-y-3">
                  {wardReport.indicatorReports.map((indicator) => <div key={indicator.id} className="rounded-md bg-muted/20 p-3 text-sm">
                    <div className="grid gap-3 md:grid-cols-3"><div>
                      <span className="text-xs font-medium uppercase text-muted-foreground">Indicator</span>
                      <p className="font-medium">{indicator.indicator}</p></div>
                      <div>
                        <span className="text-xs font-medium uppercase text-muted-foreground">Target</span>
                        <p>{indicator.target}</p></div><div><span className="text-xs font-medium uppercase text-muted-foreground">Report against target</span>
                        <p>{indicator.reportedProgress} ({indicator.progress}%)</p></div>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2"><div>
                      <span className="text-xs font-medium uppercase text-muted-foreground">Achievement</span>
                      <p className="mt-1 whitespace-pre-wrap">{indicator.achievement || "N/A"}</p>
                    </div>
                      <div>
                        <span className="text-xs font-medium uppercase text-muted-foreground">Remarks</span>
                        <p className="mt-1 whitespace-pre-wrap">{indicator.remarks || "N/A"}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-xs font-medium uppercase text-muted-foreground">Evidence</span>
                      {indicator.evidenceFiles.length ? <ul className="mt-1 space-y-1">{indicator.evidenceFiles.map((file) => <li key={file.id}>
                        <button type="button" className="inline-flex items-center gap-1 text-green-700 underline disabled:opacity-50" onClick={() => previewEvidence(indicator.id, file)} disabled={loadingEvidenceId === file.id}>
                          <FileText className="h-4 w-4" />{loadingEvidenceId === file.id ? "Loading evidence..." : file.name}</button><span className="ml-2 text-xs text-muted-foreground">{[file.fileType, file.uploadedBy, file.createdAt ? new Date(file.createdAt).toLocaleDateString() : ""].filter(Boolean).join(" · ")}</span></li>)}
                      </ul> : <p className="mt-1">No evidence uploaded.</p>}
                    </div>
                  </div>)}
                  {!wardReport.indicatorReports.length && <p className="text-muted-foreground">No indicator reports were recorded.</p>}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 font-semibold">Financial Information</h3>
          <dl className="grid gap-4 rounded-md border bg-muted/20 p-4 sm:grid-cols-3">
            {item("Amount / budget", `KES ${Number(report.disbursedAmount || 0).toLocaleString()}`)}
            {item("Amount utilized", `KES ${Number(report.utilizedAmount || 0).toLocaleString()}`)}
            {item("Amount remaining", `KES ${Number(report.amountRemaining ?? Math.max(0, Number(report.disbursedAmount || 0) - Number(report.utilizedAmount || 0))).toLocaleString()}`)}
          </dl>
        </section>
      </Card>
      {previewUrl && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-background shadow-xl">
          <div className="flex items-center justify-between border-b p-4"><div>
            <h2 className="font-semibold">PDF Preview</h2>
            <p className="text-sm text-muted-foreground">Preview and download use the same saved report data and PDF.</p>
          </div>
            <div className="flex gap-2"><Button onClick={downloadPreview}>
              <Download className="mr-2 h-4 w-4" />Download PDF</Button>
              <Button variant="outline" onClick={closePdfPreview}>Close</Button>
            </div>
          </div>
          <iframe title="Technical report PDF preview" className="min-h-0 flex-1" src={`${previewUrl}#toolbar=1&navpanes=1&zoom=page-width`} /></div>
      </div>}
      {evidencePreview && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-background shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b p-4">
            <div><h2 className="font-semibold">{evidencePreview.name}</h2><p className="text-sm text-muted-foreground">Protected report evidence</p></div>
            <div className="flex gap-2">
              <a className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" href={evidencePreview.url} download={evidencePreview.name}>Download</a>
              <Button variant="outline" onClick={closeEvidencePreview}>Close</Button>
            </div>
          </div>
          {evidencePreview.fileType === "PDF" ?
            <iframe title={`Evidence preview: ${evidencePreview.name}`} className="min-h-0 flex-1" src={evidencePreview.url} /> :
            ["PNG", "JPG", "JPEG", "GIF", "WEBP"].includes(evidencePreview.fileType || "") ?
              <div className="grid min-h-0 flex-1 place-items-center overflow-auto bg-muted/30 p-4"><img src={evidencePreview.url} alt={evidencePreview.name} className="max-h-full max-w-full object-contain" /></div> :
              <div className="grid flex-1 place-items-center gap-3 p-8 text-center text-sm text-muted-foreground"><p>Preview is unavailable for this file type.</p><a href={evidencePreview.url} target="_blank" rel="noreferrer" className="text-primary underline">Open attachment in a new tab</a></div>}
        </div>
      </div>}
    </>
  );
}
