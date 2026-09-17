import type { TechnicalReport } from "@/utils/types";

const clean = (value: unknown) => String(value ?? "N/A").replace(/[\\()]/g, "").replace(/\s+/g, " ").trim();
const wrap = (text: string, width = 88) => text.match(new RegExp(`.{1,${width}}(?:\\s|$)|.{1,${width}}`, "g")) || [text];

/** One source for preview and download: a blob generated from the saved API report. */
export function technicalReportPdf(report: TechnicalReport) {
  const lines: Array<[string, boolean]> = [["TECHNICAL REPORT", true], [report.title, true], ["" , false]];
  const add = (label: string, value: unknown) => wrap(`${label}: ${clean(value)}`).forEach((line) => lines.push([line, false]));
  add("Project", report.projectName); add("Financial year", report.financialYear); add("Quarter", report.quarter);
  add("Main activity", report.mainActivityName); add("Sub activity", report.subActivityName); add("Category", report.category); add("Value chain", report.valueChain); add("Reporting period", report.reportingPeriod);
  add("Amount disbursed", report.disbursedAmount); add("Amount utilized", report.utilizedAmount); add("Percentage utilization", `${report.percentageUtilization ?? 0}%`); add("Report achievement", report.achievement); add("Report remarks", report.remarks); add("Supporting information", report.supportingInformation);
  const wards = report.relatedWardReports?.length ? report.relatedWardReports : (report.selectedLocations || []).map((place) => ({ id: place.wardId, wardId: place.wardId, wardName: place.wardName, subCountyName: place.subCountyName, countyName: place.countyName, indicatorReports: (report.indicatorReports || []).filter((row) => row.wardId === place.wardId), disbursedAmount: report.disbursedAmount || 0, utilizedAmount: report.utilizedAmount || 0 }));
  wards.forEach((ward, wardIndex) => { lines.push(["", false], [`WARD ${wardIndex + 1} — ${clean(ward.wardName)}`, true]); add("County", ward.countyName); add("Sub-county", ward.subCountyName); add("Ward", ward.wardName); if (!ward.indicatorReports.length) lines.push(["No indicator details recorded for this ward.", false]); ward.indicatorReports.forEach((row) => { lines.push([`Indicator: ${clean(row.indicator)}`, true]); add("Target", row.target); add("Achievement / report against target", row.reportedProgress); add("Progress", `${row.progress}%`); add("Achievement narrative", row.achievement); add("Remarks", row.remarks); add("Reason for zero", row.reasonForZero); add("Evidence", row.evidenceFiles.length ? row.evidenceFiles.map((file) => file.name).join(", ") : "No evidence uploaded"); }); });
  const pages: string[][] = []; for (let i = 0; i < lines.length; i += 46) pages.push(lines.slice(i, i + 46).map(([line, heading], index) => `BT /F1 ${heading ? 12 : 9} Tf 42 ${800 - index * 16} Td (${clean(line)}) Tj ET`));
  const objects: string[] = ["<</Type/Catalog/Pages 2 0 R>>", `<</Type/Pages/Kids[${pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ")}] /Count ${pages.length}>>`];
  pages.forEach((content, index) => { const page = 3 + index * 2, stream = page + 1; objects.push(`<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 842]/Resources<</Font<</F1 ${3 + pages.length * 2} 0 R>>>>/Contents ${stream} 0 R>>`, `<</Length ${content.join("\n").length}>>\nstream\n${content.join("\n")}\nendstream`); }); objects.push("<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>");
  let pdf = "%PDF-1.4\n"; const offsets = [0]; objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; }); const xref = pdf.length; pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}
