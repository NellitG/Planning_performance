import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Download, Edit3, FileText, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTechnicalReport } from "@/hooks/useProjectsApi";
import { cn } from "@/lib/utils";
import { technicalReportPdf } from "@/utils/technicalReportPdf";

const date = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : "N/A";

function legacyDownloadPdf(report: Record<string, any>) {
  const entries = [
    ["Project", report.projectName],
    ["Financial year", report.financialYear],
    ["Quarter", report.quarter],
    // ["Status", report.status],
    ["Achievement", report.achievement],
    ["Remarks", report.remarks],
  ];

  const content = entries
    .map(
      ([key, value], index) =>
        `BT /F1 ${index ? 10 : 14
        } Tf 50 ${790 - index * 30} Td (${String(key)}: ${String(
          value ?? "N/A"
        ).replace(/[()\\]/g, "")}) Tj ET`
    )
    .join("\n");

  const pdf = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 842]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
5 0 obj<</Length ${content.length}>>stream
${content}
endstream
endobj
trailer<</Root 1 0 R>>
%%EOF`;

  const anchor = document.createElement("a");

  anchor.href = URL.createObjectURL(
    new Blob([pdf], {
      type: "application/pdf",
    })
  );

  anchor.download = "technical-report.pdf";
  anchor.click();

  URL.revokeObjectURL(anchor.href);
}

export default function TechnicalReportDetails() {
  const { id } = useParams();
  const location = useLocation();

  const {
    data: report,
    isLoading,
    isError,
    error,
  } = useTechnicalReport(id);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const openPreview = (currentReport: NonNullable<typeof report>) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(technicalReportPdf(currentReport)));
  };
  const downloadPreview = () => {
    if (!previewUrl) return;
    const anchor = document.createElement("a"); anchor.href = previewUrl; anchor.download = `technical-report-${id}.pdf`; anchor.click();
  };

  useEffect(() => {
    if (
      report &&
      (location.state as { download?: boolean } | null)?.download
    ) {
      openPreview(report);
    }
  }, [report, location.state]);

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
        {String(value || "N/A")}
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
        {/* Download PDF */}
        <button
          type="button"
          onClick={() => openPreview(report)}
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
          <Download className="h-4 w-4" />
          Download PDF
        </button>

        {/* Edit Report */}
        <Link
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
        </Link>
      </div>
      <br></br>

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
          {item("Reporting ward", report.wardName)}
          {item("Reporting period", report.reportingPeriod)}
          {item("Date created", date(report.createdAt))}
          {item("Amount disbursed", report.disbursedAmount)}
          {item("Amount utilized", report.utilizedAmount)}
          {item(
            "Percentage utilization",
            `${report.percentageUtilization ?? 0}%`
          )}
        </dl>

        <section>
          <h3 className="mb-3 font-semibold">Geographic Coverage</h3>
          <div className="space-y-2 rounded-md border bg-muted/20 p-4 text-sm">
            {(report.selectedLocations?.length ? report.selectedLocations : report.wardName ? [{ countyName: report.countyName || "County not recorded", subCountyName: report.subCountyName || "Sub-county not recorded", wardName: report.wardName }] : []).map((place, index) => (
              <div key={`${place.wardName}-${index}`} className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-700" /><span>
                  <strong>{place.countyName}</strong>
                  <span className="text-muted-foreground">→</span>
                  <strong>{place.subCountyName}</strong>
                  <span className="text-muted-foreground">→</span> {place.wardName}</span>
              </div>
            ))}
            {!report.selectedLocations?.length && !report.wardName && <span>N/A</span>}
          </div>
        </section>

        <section>
          <h3 className="mb-3 font-semibold">Indicators &amp; Reporting</h3>
          <div className="space-y-4">
            {(report.relatedWardReports?.length ? report.relatedWardReports : [{ id: report.id, wardName: report.wardName || "Reporting ward", subCountyName: report.subCountyName || "", countyName: report.countyName || "", indicatorReports: report.indicatorReports || [], disbursedAmount: report.disbursedAmount || 0, utilizedAmount: report.utilizedAmount || 0 }]).map((wardReport) => (
              <div key={wardReport.id} className="rounded-md border p-4">
                <p className="mb-3 text-sm font-semibold text-green-800">{[wardReport.countyName, wardReport.subCountyName, wardReport.wardName].filter(Boolean).join(" → ")}</p>
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
                        <a className="inline-flex items-center gap-1 text-green-700 underline" href={file.url || undefined} target="_blank" rel="noreferrer">
                          <FileText className="h-4 w-4" />{file.name}</a></li>)}
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
              <Button variant="outline" onClick={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}>Close</Button>
            </div>
          </div>
          <iframe title="Technical report PDF preview" className="min-h-0 flex-1" src={previewUrl} /></div>
      </div>}
    </>
  );
}
