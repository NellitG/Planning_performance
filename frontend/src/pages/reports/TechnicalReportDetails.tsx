import { useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Download, Edit3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTechnicalReport } from "@/hooks/useProjectsApi";
import { cn } from "@/lib/utils";

const statusTone: Record<string, string> = {
  Approved: "bg-green-100 text-green-800",
  "Under Review": "bg-amber-100 text-amber-800",
  Draft: "bg-slate-100 text-slate-700",
  Submitted: "bg-blue-100 text-blue-800",
};

const date = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : "N/A";

function downloadPdf(report: Record<string, any>) {
  const entries = [
    ["Project", report.projectName],
    ["Financial year", report.financialYear],
    ["Quarter", report.quarter],
    ["Status", report.status],
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

  useEffect(() => {
    if (
      report &&
      (location.state as { download?: boolean } | null)?.download
    ) {
      downloadPdf(report);
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
          onClick={() => downloadPdf(report)}
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

          <span
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium",
              statusTone[report.status || "Draft"]
            )}
          >
            {report.status || "Draft"}
          </span>
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

        {/* Indicators */}
        <section>
          <h3 className="mb-2 font-semibold">
            Indicators
          </h3>

          <ul className="list-disc space-y-1 rounded-md border bg-muted/20 p-4 pl-9 text-sm">
            {report.indicators?.length ? (
              report.indicators.map(
                (indicator: any, index: number) => (
                  <li key={indicator.id || index}>
                    {indicator.indicator}

                    {indicator.target
                      ? ` — Target: ${indicator.target}`
                      : ""}

                    {indicator.reportedProgress
                      ? ` — Progress: ${indicator.reportedProgress}`
                      : ""}
                  </li>
                )
              )
            ) : (
              <li>N/A</li>
            )}
          </ul>
        </section>

        {/* Narrative sections */}
        {[
          ["Achievement", report.achievement],
          ["Remarks", report.remarks],
          [
            "Supporting information",
            report.supportingInformation,
          ],
        ].map(([label, value]) => (
          <section key={label as string}>
            <h3 className="mb-2 font-semibold">
              {label}
            </h3>

            <p className="whitespace-pre-wrap rounded-md border bg-muted/20 p-4 text-sm">
              {value || "N/A"}
            </p>
          </section>
        ))}

        {/* Supporting documents */}
        <section>
          <h3 className="mb-2 font-semibold">
            Supporting documents
          </h3>

          <ul className="list-disc rounded-md border bg-muted/20 p-4 pl-9 text-sm">
            {report.supportingDocuments?.length ? (
              report.supportingDocuments.map(
                (file: string) => (
                  <li key={file}>{file}</li>
                )
              )
            ) : (
              <li>N/A</li>
            )}
          </ul>
        </section>
      </Card>
    </>
  );
}