import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useProjects, useTechnicalReport, useUpdateTechnicalReport } from "@/hooks/useProjectsApi";
import type { TechnicalReport } from "@/utils/types";
import { api } from "@/utils/apiClient";

type Location = NonNullable<TechnicalReport["selectedLocations"]>[number];
type WardValues = Record<string, Array<Record<string, any>>>;

export default function EditTechnicalReport() {
  const { id } = useParams(); const navigate = useNavigate();
  const { data: report, isLoading, isError, error, refetch } = useTechnicalReport(id);
  const { data: projects = [] } = useProjects(); const update = useUpdateTechnicalReport();
  const [title, setTitle] = useState(""); const [utilizedAmount, setUtilizedAmount] = useState("0");
  const [locations, setLocations] = useState<Location[]>([]); const [wardValues, setWardValues] = useState<WardValues>({});

  useEffect(() => {
    if (!report) return;
    setTitle(report.title || ""); setUtilizedAmount(String(report.utilizedAmount ?? 0));
    setLocations(report.selectedLocations || (report.wardId ? [{ countyId: "", countyName: report.countyName || "", subCountyId: "", subCountyName: report.subCountyName || "", wardId: report.wardId, wardName: report.wardName || "" }] : []));
    setWardValues((report.indicatorReports || []).reduce<WardValues>((result, row) => { const wardId = row.wardId || report.wardId; 
      if (wardId) (result[wardId] ||= []).push({ ...row }); 
      return result; }, {}));
  }, [report]);

  const project = projects.find((item) => item.id === report?.projectId);
  const availableLocations = useMemo(() => (project?.locations || []).filter((item) => item.countyId && item.subCountyId && item.wardId).map((item) => ({ countyId: item.countyId!, countyName: item.county, subCountyId: item.subCountyId!, subCountyName: item.subCounty, wardId: item.wardId!, wardName: item.ward })), [project]);
  const changeValue = (wardId: string, index: number, field: string, value: string) => setWardValues((current) => ({ ...current, [wardId]: (current[wardId] || []).map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value, ...(field === "reportedProgress" && value !== "" && Number(value) === 0 ? { achievement: "", remarks: "" } : {}) } : row) }));
  const uploadEvidence = async (rowId: string, files: FileList | null) => {
    if (!id || !files?.length)
      return; 
    const data = new FormData(); Array.from(files).forEach((file) => data.append("files", file));
    await api.postForm(`/technical-reports/${id}/indicator-reports/${rowId}/evidence/`, data); await refetch();
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (!report || !title.trim() || !locations.length)
      return toast.error("A title and at least one ward are required.");
    const disbursed = Number(report.disbursedAmount || 0), utilized = Number(utilizedAmount || 0);
    try {
      await update.mutateAsync({
        ...report, id: report.id, title: title.trim(),
        selectedLocations: locations,
        wardId: locations[0].wardId,
        utilizedAmount: utilized,
        percentageUtilization: disbursed ? Number(((utilized / disbursed) * 100).toFixed(2)) : 0,
        indicatorReports: locations.flatMap((location) => (wardValues[location.wardId] || []).map((row) =>
        ({
          wardId: location.wardId, indicatorId: row.indicatorId,
          indicator: row.indicator, target: row.target,
          reportedProgress: Number(row.reportedProgress || 0),
          achievement: row.achievement || "", remarks: row.remarks || "",
          reasonForZero: row.reasonForZero || ""
        })))
      } as any);
      toast.success("Technical report updated successfully.");
      navigate("/technical-reports");
    }
    catch (reason) { toast.error(reason && typeof reason === "object" && "message" in reason ? String(reason.message) : "Unable to update technical report."); }};
  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading technical report...</div>;
  if (isError || !report) return (
    <Card className="p-6"><p className="text-red-700">{error ? String(error) : "Technical report could not be loaded."}</p>
      <Button asChild className="mt-4">
        <Link to="/technical-reports">Back to Technical Reports</Link>
      </Button>
    </Card>
  );
  const loadedReport = report;
  return (
    <>
      <div className="mb-6">
        <Link to="/technical-reports" className="inline-flex items-center gap-2 rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white">
          <ArrowLeft className="h-4 w-4" />Back to Technical Reports</Link>
        <h1 className="mt-4 text-2xl font-semibold">Edit Technical Report</h1>
      </div>
      <form onSubmit={save} className="space-y-5">
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Report Information</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2"><div>
            <Label>Report title</Label><Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
            <div>
              <Label>Amount disbursed</Label><Input readOnly value={String(loadedReport.disbursedAmount ?? 0)} />
            </div>
            <div><Label>Amount utilized</Label>
              <Input type="number" min="0" value={utilizedAmount} onChange={(event) => setUtilizedAmount(event.target.value)} />
            </div>
          </div>
        </Card>
        <Card className="p-6"><h2 className="text-lg font-semibold">Geographic Coverage</h2>
          <div className="mt-4 space-y-2">{availableLocations.map((location) => <label key={location.wardId} className="flex items-center gap-2 text-sm">
            <Checkbox checked={locations.some((item) => item.wardId === location.wardId)} onCheckedChange={(checked) => setLocations((current) => checked ? [...current, location] : current.filter((item) => item.wardId !== location.wardId))} />
            {location.countyName} → {location.subCountyName} → {location.wardName}</label>)}
          </div>
        </Card>
        <Card className="space-y-5 p-6"><div>
          <h2 className="text-lg font-semibold">Ward Report Details</h2>
          <p className="text-sm text-muted-foreground">Details are saved independently for each ward.</p>
        </div>{locations.map((location) => {
          const rows = wardValues[location.wardId] || []; return <section key={location.wardId} className="overflow-hidden rounded-lg border border-green-200">
            <div className="sticky top-0 z-10 bg-green-50 p-4">
              <h3 className="font-semibold">Report Details — {location.wardName}</h3><p className="text-sm">County: {location.countyName} → Sub-county: {location.subCountyName} → Ward:
                {location.wardName}</p></div>{!rows.length ?
                  <p className="p-4 text-sm text-muted-foreground">No saved indicator details for this ward.</p> : rows.map((row, index) => { const isZeroReport = row.reportedProgress !== "" && Number(row.reportedProgress) === 0; return <div key={row.id || row.indicatorId}
                    className="space-y-3 border-t p-4"><div className="grid gap-3 md:grid-cols-3"><p><b>Indicator:</b> {row.indicator}</p>
                      <p>
                        <b>Target:</b> {row.target}</p>
                      <div>
                        <Label>Report against target</Label>
                        <Input type="number" min="0" step="any" value={row.reportedProgress} onChange={(event) => changeValue(location.wardId, index, "reportedProgress", event.target.value)} />
                      </div>
                    </div>
                    {isZeroReport ? <div><Label>Reason for Zero <span className="text-red-600">*</span></Label><Textarea value={row.reasonForZero || ""} onChange={(event) => changeValue(location.wardId, index, "reasonForZero", event.target.value)} placeholder="Explain why no progress was reported for this indicator." /></div> : <div className="grid gap-3 md:grid-cols-2"><div>
                      <Label>Achievement</Label><Textarea value={row.achievement} onChange={(event) => changeValue(location.wardId, index, "achievement", event.target.value)} />
                    </div><div><Label>Remarks</Label><Textarea value={row.remarks} onChange={(event) => changeValue(location.wardId, index, "remarks", event.target.value)} />
                      </div>
                    </div>}
                    <div className="text-sm"><b>Evidence:</b> {row.evidenceFiles?.map((file: any) => <a key={file.id} className="ml-2 text-green-700 underline" href={file.url || undefined} target="_blank" rel="noreferrer">{file.name}</a>)}
                      <label className="ml-2 cursor-pointer text-green-700 underline">Upload<input className="hidden" type="file" multiple onChange={(event) => uploadEvidence(row.id, event.target.files)} />
                      </label>
                    </div>
                  </div>; })}
          </section>;
        })}
          <div className="flex justify-end gap-2 border-t pt-5">
            <Button asChild type="button" variant="outline">
              <Link to="/technical-reports">Cancel</Link>
            </Button>
            <Button type="submit" disabled={update.isPending}>{update.isPending ? "Saving..." : "Save Changes"}</Button>
          </div>
        </Card>
      </form>
    </>);
}
