import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, Upload, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useMainActivities,
  useSubActivities,
  useSubSubActivities,
  useMainActivityIndicators,
  useActivityIndicators,
  useCreateTechnicalReport,
  useProjects,
} from "@/hooks/useProjectsApi";
import { QUARTER_OPTIONS, FINANCIAL_YEAR_OPTIONS } from "@/pages/projects/wizard/data";
import type { ActivityIndicator, MainActivityIndicator } from "@/utils/types";

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;

}

type WardIndicatorValues = Record<string, { reportedProgress: string; achievement: string; remarks: string }>;
type ProjectWard = { id: string; name: string };
type ProjectSubCounty = { id: string; name: string; wards: ProjectWard[] };
type ProjectCounty = { id: string; name: string; subCounties: Map<string, ProjectSubCounty> };

function Field({ label, ...props }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <Input {...props} />
    </div>
  );
}

interface SectionProps {
  index: number;
  title: string;
  children: React.ReactNode;
}

function Section({ index, title, children }: SectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-(--brand-green) text-xs font-bold text-white">
            {index}
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function NewReport() {
  const { data: mainActivities = [], isLoading: loadingMainActivities } = useMainActivities();
  const { data: subActivities = [], isLoading: loadingSubActivities } = useSubActivities();
  const { data: subSubActivities = [], isLoading: loadingSubSubActivities } = useSubSubActivities();
  const { data: mainIndicators = [], isLoading: loadingMainIndicators } = useMainActivityIndicators();
  const { data: activityIndicators = [], isLoading: loadingActivityIndicators } = useActivityIndicators();
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const createReport = useCreateTechnicalReport();
  const navigate = useNavigate();

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedWardIds, setSelectedWardIds] = useState<string[]>([]);
  const [quarter, setQuarter] = useState("");
  const [financialYear, setFinancialYear] = useState("");
  const [selectedMainActivityId, setSelectedMainActivityId] = useState("");
  const [category, setCategory] = useState("");
  const [selectedValueChain, setSelectedValueChain] = useState("");
  const [selectedSubActivityId, setSelectedSubActivityId] = useState("");
  const [disbursed, setDisbursed] = useState(0);
  const [utilized, setUtilized] = useState(0);
  const [status, setStatus] = useState("Draft");
  const [achievement, setAchievement] = useState("");
  const [remarks, setRemarks] = useState("");
  const [reportedProgress, setReportedProgress] = useState<Record<string, string>>({});
  const [wardIndicatorValues, setWardIndicatorValues] = useState<Record<string, WardIndicatorValues>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const categoryOptions = ["Value Chain", "ICT", "Thematic Area", "Project Coordination"];
  const valueChainOptions = useMemo(() => {
    if (!selectedMainActivityId || category !== "Value Chain") return [] as string[];
    const options = new Set<string>();
    subActivities
      .filter((item) => item.mainActivityId === selectedMainActivityId && item.category === "Value Chain")
      .forEach((item) => {
        item.valueChain
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
          .forEach((value) => options.add(value));
      });
    subSubActivities
      .filter((item) => {
        const parent = subActivities.find((activity) => activity.id === item.subActivityId);
        return parent?.mainActivityId === selectedMainActivityId && parent.category === "Value Chain";
      })
      .forEach((item) => {
        if (item.valueChain) options.add(item.valueChain);
      });
    mainIndicators
      .filter((item) => item.mainActivityId === selectedMainActivityId && item.category === "Value Chain")
      .forEach((item) => {
        if (item.valueChain) options.add(item.valueChain);
      });
    return [...options].sort((a, b) => a.localeCompare(b));
  }, [category, mainIndicators, selectedMainActivityId, subActivities, subSubActivities]);

  const selectedSubActivities = useMemo(() => {
    if (!selectedMainActivityId || !category) return [];
    return subActivities.filter((item) => {
      if (item.mainActivityId !== selectedMainActivityId || item.category !== category) return false;
      if (category !== "Value Chain") return true;
      if (!selectedValueChain) return false;
      const assignedChains = item.valueChain.split(",").map((value) => value.trim());
      const hasMatchingSubSubActivity = subSubActivities.some(
        (subSub) => subSub.subActivityId === item.id && subSub.valueChain === selectedValueChain,
      );
      return assignedChains.includes(selectedValueChain) || hasMatchingSubSubActivity;
    });
  }, [category, selectedMainActivityId, selectedValueChain, subActivities, subSubActivities]);

  const availableIndicators = useMemo(() => {
    if (!selectedMainActivityId || !category) return [] as Array<MainActivityIndicator | ActivityIndicator>;
    const activityLevelIndicators = activityIndicators.filter(
      (item) => item.mainActivityId === selectedMainActivityId,
    );
    const mainLevelIndicators = mainIndicators.filter((item) => {
      if (item.mainActivityId !== selectedMainActivityId || item.category !== category) return false;
      return category !== "Value Chain" || item.valueChain === selectedValueChain;
    });
    return mainLevelIndicators.length > 0 ? mainLevelIndicators : activityLevelIndicators;
  }, [activityIndicators, category, mainIndicators, selectedMainActivityId, selectedSubActivityId, selectedValueChain]);

  const selectedMainActivity = mainActivities.find((activity) => activity.id === selectedMainActivityId);
  const selectedSubActivity = selectedSubActivities.find((activity) => activity.id === selectedSubActivityId);
  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const projectLocations = selectedProject?.locations || [];

  const projectCounties = useMemo(() => {
    const counties = new Map<string, ProjectCounty>();
    projectLocations.forEach((location) => {
      if
        (!location.countyId || !location.subCountyId || !location.wardId)
        return;
      const county: ProjectCounty = counties.get(location.countyId) || {
        id: location.countyId,
        name: location.county,
        subCounties: new Map<string, ProjectSubCounty>(),
      };
      const subCounty: ProjectSubCounty = county.subCounties.get(location.subCountyId) || {
        id: location.subCountyId,
        name: location.subCounty,
        wards: [],
      };
      if
        (!subCounty.wards.some((ward) => ward.id === location.wardId)) subCounty.wards.push({ id: location.wardId, name: location.ward });

      county.subCounties.set(subCounty.id, subCounty);
      counties.set(county.id, county);
    });

    return [...counties.values()];
  }, [projectLocations]);

  const isLoadingReportingData =
    loadingProjects ||
    loadingMainActivities ||
    loadingSubActivities ||
    loadingSubSubActivities ||
    loadingMainIndicators ||
    loadingActivityIndicators;

  const utilizationPercent = useMemo(
    () => (disbursed > 0 ? ((utilized / disbursed) * 100).toFixed(1) : "0.0"),
    [disbursed, utilized],
  );

  const handleMainActivityChange = (value: string) => {
    setSelectedMainActivityId(value);
    setCategory("");
    setSelectedValueChain("");
    setSelectedSubActivityId("");
    setReportedProgress({});
    setWardIndicatorValues({});
    setDisbursed(0);
    setUtilized(0);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setSelectedValueChain("");
    setSelectedSubActivityId("");
    setReportedProgress({});
    setWardIndicatorValues({});
    setDisbursed(0);
    setUtilized(0);
  };

  const handleValueChainChange = (value: string) => {
    setSelectedValueChain(value);
    setSelectedSubActivityId("");
    setReportedProgress({});
    setWardIndicatorValues({});
    setDisbursed(0);
    setUtilized(0);
  };

  const handleSubActivityChange = (value: string) => {
    setSelectedSubActivityId(value);
    const budget = subSubActivities
      .filter((item) => item.subActivityId === value && (category !== "Value Chain" || item.valueChain === selectedValueChain))
      .reduce((sum, item) => sum + Number(item.approvedActivityBudget || 0), 0);
    setReportedProgress({});
    setWardIndicatorValues({});
    setDisbursed(budget);
    setUtilized(0);
  };

  const updateWardIndicator = (wardId: string, indicatorId: string, field: "reportedProgress" | "achievement" | "remarks", value: string) => {
    setWardIndicatorValues((current) => ({
      ...current,
      [wardId]: {
        ...current[wardId],
        [indicatorId]: {
          reportedProgress: current[wardId]?.[indicatorId]?.reportedProgress || "",
          achievement: current[wardId]?.[indicatorId]?.achievement || "",
          remarks: current[wardId]?.[indicatorId]?.remarks || "",
          [field]: value,
        },
      },
    }));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setFiles((f) => [...f, ...Array.from(e.dataTransfer.files)]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProjectId) {
      toast.error("Please select a project.");
      return;
    }

    if (selectedWardIds.length === 0) {
      toast.error("Select at least one project ward before saving.");
      return;
    }

    if (!quarter || !financialYear) {
      toast.error("Please select a quarter and financial year.");
      return;
    }

    if (!selectedMainActivityId || !category || !selectedSubActivityId) {
      toast.error("Please select a main activity, category, and sub activity before saving.");
      return;
    }

    if (category === "Value Chain" && !selectedValueChain) {
      toast.error("Please select a value chain.");
      return;
    }

    try {
      const generatedTitle = [
        selectedProject?.name || "Project Report",
        selectedMainActivity?.name,
        financialYear,
        quarter,
      ]
        .filter(Boolean)
        .join(" - ");

      const reportPayload = {
        title: generatedTitle,
        projectId: selectedProjectId,
        quarter,
        financialYear,
        mainActivityId: selectedMainActivityId,
        category,
        valueChain: selectedValueChain,
        subActivityId: selectedSubActivityId,
        disbursedAmount: Number(disbursed || 0),
        utilizedAmount: Number(utilized || 0),
        percentageUtilization: Number(utilizationPercent || 0),
        status,
        achievement,
        remarks,
        supportingDocuments: files.map((file) => file.name),
      };
      await Promise.all(selectedWardIds.map((wardId) => createReport.mutateAsync({
        ...reportPayload,
        wardId,
        indicators: availableIndicators.map((indicator) => ({
          id: indicator.id,
          indicator: indicator.indicator,
          target: indicator.target,
          ...(wardIndicatorValues.shared?.[indicator.id] || { reportedProgress: "", achievement: "", remarks: "" }),
        })),
      })));

      toast.success("Report saved successfully.");
      navigate("/technical-reports");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save report.");
    }
  };

  return (
    <>
      <div className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Dashboard</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/technical-reports" className="hover:text-foreground">Technical Reports</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">New Report</span>
      </div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Project Reporting Form</h1>
          <p className="text-sm text-muted-foreground">Generated from the official KALRO Project Reporting Template.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/technical-reports">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" form="report-form" className="bg-green-700 hover:opacity-90" disabled={createReport.isPending}>
            {createReport.isPending ? "Saving..." : "Save Report"}
          </Button>
        </div>
      </div>

      <form id="report-form" onSubmit={submit} className="space-y-5">
        <Section index={1} title="Project Activity">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Project</Label>
              <Select value={selectedProjectId} onValueChange={(value) => { setSelectedProjectId(value); setSelectedWardIds([]); }}>
                <SelectTrigger><SelectValue placeholder={loadingProjects ? "Loading projects..." : "Select Project"} /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Financial Year</Label>
              <Select value={financialYear} onValueChange={setFinancialYear}>
                <SelectTrigger><SelectValue placeholder="Select Financial Year" /></SelectTrigger>
                <SelectContent>
                  {FINANCIAL_YEAR_OPTIONS.map((fy) => <SelectItem key={fy} value={fy}>{fy}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Quarter</Label>
              <Select value={quarter} onValueChange={setQuarter}>
                <SelectTrigger><SelectValue placeholder="Select Quarter" /></SelectTrigger>
                <SelectContent>
                  {QUARTER_OPTIONS.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>
        <Section index={2} title="Project Locations">
          {!selectedProjectId ? <p className="text-sm text-muted-foreground">Select a project to view its locations.</p> : projectCounties.length === 0 ? <p className="text-sm text-muted-foreground">This project has no ward locations configured.</p> : <div className="space-y-3">{projectCounties.map((county) => { const countyWardIds = [...county.subCounties.values()].flatMap((subCounty) => subCounty.wards.map((ward) => ward.id)); return <div key={county.id} className="rounded-md border p-3"><label className="flex items-center gap-2 font-medium"><Checkbox checked={countyWardIds.some((id) => selectedWardIds.includes(id))} onCheckedChange={(checked) => setSelectedWardIds((current) => checked ? [...new Set([...current, ...countyWardIds])] : current.filter((id) => !countyWardIds.includes(id)))} />{county.name}</label><div className="ml-6 mt-2 space-y-2">{[...county.subCounties.values()].map((subCounty) => { const subCountyWardIds = subCounty.wards.map((ward) => ward.id); return <div key={subCounty.id}><label className="flex items-center gap-2 text-sm font-medium"><Checkbox checked={subCountyWardIds.some((id) => selectedWardIds.includes(id))} onCheckedChange={(checked) => setSelectedWardIds((current) => checked ? [...new Set([...current, ...subCountyWardIds])] : current.filter((id) => !subCountyWardIds.includes(id)))} />{subCounty.name}</label><div className="ml-6 mt-1 space-y-1">{subCounty.wards.map((ward) => <label key={ward.id} className="flex items-center gap-2 text-sm text-muted-foreground"><Checkbox checked={selectedWardIds.includes(ward.id)} onCheckedChange={(checked) => setSelectedWardIds((current) => checked ? [...new Set([...current, ward.id])] : current.filter((id) => id !== ward.id))} />{ward.name}</label>)}</div></div>; })}</div></div>; })}</div>}
          {selectedWardIds.length > 0 && <div className="mt-4 rounded-md border-l-4 border-green-700 bg-green-50 p-3 text-sm font-medium">Reporting Wards: {selectedWardIds.flatMap((wardId) => projectCounties.flatMap((county) => [...county.subCounties.values()].flatMap((subCounty) => subCounty.wards.map((ward) => ward.id === wardId ? `${county.name} / ${subCounty.name} / ${ward.name}` : "")))).filter(Boolean).join(", ")}</div>}
        </Section>
        {selectedWardIds.length > 0 && <Section index={3} title="Main Activity Reporting">
          <div className="mb-4 rounded-md border-l-4 border-green-700 bg-green-50 p-3 text-sm font-medium">Wards: {selectedWardIds.flatMap((wardId) => projectCounties.flatMap((county) => [...county.subCounties.values()].flatMap((subCounty) => subCounty.wards.map((ward) => ward.id === wardId ? ward.name : "")))).filter(Boolean).join(", ")}</div>
          <div className="space-y-4">
            <div className="space-y-4 rounded-lg border border-border bg-muted/10 p-4">
              {isLoadingReportingData && (
                <div className="rounded-md border border-border/70 bg-background/80 p-3 text-sm text-muted-foreground">
                  Loading reporting data...
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Main Activity</Label>
                  <Select value={selectedMainActivityId} onValueChange={handleMainActivityChange}>
                    <SelectTrigger><SelectValue placeholder={loadingMainActivities ? "Loading Main Activities..." : "Select Main Activity"} /></SelectTrigger>
                    <SelectContent>
                      {mainActivities.map((activity) => <SelectItem key={activity.id} value={activity.id}>{activity.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={handleCategoryChange} disabled={!selectedMainActivityId}>
                    <SelectTrigger><SelectValue placeholder={selectedMainActivityId ? "Select Category" : "Select Main Activity first"} /></SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {category === "Value Chain" && (
                  <div className="space-y-1.5">
                    <Label>Value Chain</Label>
                    <Select value={selectedValueChain} onValueChange={handleValueChainChange} disabled={valueChainOptions.length === 0}>
                      <SelectTrigger><SelectValue placeholder={valueChainOptions.length > 0 ? "Select Value Chain" : "No Value Chains found"} /></SelectTrigger>
                      <SelectContent>
                        {valueChainOptions.map((valueChain) => <SelectItem key={valueChain} value={valueChain}>{valueChain}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Sub Activity</Label>
                  <Select value={selectedSubActivityId} onValueChange={handleSubActivityChange} disabled={!category || (category === "Value Chain" && !selectedValueChain)}>
                    <SelectTrigger>
                      <SelectValue placeholder={!category ? "Select Category first" : category === "Value Chain" && !selectedValueChain ? "Select Value Chain first" : "Select Sub Activity"} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedSubActivities.map((activity) => <SelectItem key={activity.id} value={activity.id}>{activity.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(selectedMainActivity || selectedSubActivity) && (
                <div className="rounded-lg border border-border bg-background/80 p-4">
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium text-foreground">Main Activity:</span>
                    <span className="text-muted-foreground">{selectedMainActivity?.name || "Not selected"}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-medium text-foreground">Category:</span>
                    <span className="text-muted-foreground">{category || "Not selected"}</span>
                    {selectedValueChain && (
                      <>
                        <span className="text-muted-foreground">/</span>
                        <span className="font-medium text-foreground">Value Chain:</span>
                        <span className="text-muted-foreground">{selectedValueChain}</span>
                      </>
                    )}
                    <span className="text-muted-foreground">/</span>
                    <span className="font-medium text-foreground">Sub Activity:</span>
                    <span className="text-muted-foreground">{selectedSubActivity?.name || "Not selected"}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-foreground">Indicators</h3>
                      {selectedSubActivityId ? (
                        availableIndicators.length > 0 ? (
                          <div className="overflow-x-auto rounded-md border border-border/60">
                            <table className="w-full  text-sm">
                              <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                                <tr>
                                  <th className="px-3 py-2 font-semibold">Indicator</th>
                                  <th className="px-3 py-2 font-semibold">Target</th>
                                  <th className="px-3 py-2 font-semibold">Report Against Target</th>
                                  <th className="min-w-64 px-3 py-2 font-semibold">Achievement</th>
                                  <th className="min-w-64 px-3 py-2 font-semibold">Remarks</th>
                                </tr>
                              </thead>
                              <tbody>
                                {availableIndicators.map((indicator) => (
                                  <tr key={indicator.id} className="border-t border-border/60">
                                    <td className="px-3 py-2 align-top font-medium text-foreground">{indicator.indicator}</td>
                                    <td className="px-3 py-2 align-top text-muted-foreground">{indicator.target || "N/A"}</td>
                                    <td className="px-3 py-2 align-top">
                                      <Input
                                        value={wardIndicatorValues.shared?.[indicator.id]?.reportedProgress || ""}
                                        onChange={(e) => updateWardIndicator("shared", indicator.id, "reportedProgress", e.target.value)}
                                        placeholder="Enter your target achievement"
                                      />
                                    </td>
                                    <td className="px-3 py-2 align-top"><Textarea rows={4} value={wardIndicatorValues.shared?.[indicator.id]?.achievement || ""} onChange={(e) => updateWardIndicator("shared", indicator.id, "achievement", e.target.value)} placeholder="Describe the achievement" /></td>
                                    <td className="px-3 py-2 align-top"><Textarea rows={4} value={wardIndicatorValues.shared?.[indicator.id]?.remarks || ""} onChange={(e) => updateWardIndicator("shared", indicator.id, "remarks", e.target.value)} placeholder="Enter remarks" /></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="rounded-md border border-dashed border-border/70 bg-muted/10 p-3 text-sm text-muted-foreground">
                            No indicators found for the selected reporting path.
                          </p>
                        )
                      ) : (
                        <p className="rounded-md border border-dashed border-border/70 bg-muted/10 p-3 text-sm text-muted-foreground">
                          Select a sub activity to view indicators and targets.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Amount Disbursed</Label>
                  <Input type="number" value={disbursed || ""} onChange={(e) => setDisbursed(Number(e.target.value))} readOnly />
                </div>
                <div className="space-y-1.5">
                  <Label>Amount Utilized</Label>
                  <Input type="number" value={utilized || ""} onChange={(e) => setUtilized(Number(e.target.value))} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-1.5">
                  <Label>Percentage Utilization</Label>
                  <div className="grid h-9 place-items-center rounded-md border bg-muted/40 text-sm font-semibold text-(--brand-green)">
                    {utilizationPercent}%
                  </div>
                </div>
                {/* <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Submitted">Submitted</SelectItem>
                        <SelectItem value="Under Review">Under Review</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div> */}
                {/* <div className="space-y-1.5">
                    <Label>Achievements</Label>
                    <Textarea value={achievement} onChange={(e) => setAchievement(e.target.value)} placeholder="Achievement details" rows={4} />
                  </div> */}
                {/* <div className="space-y-1.5">
                    <Label>Remarks</Label>
                    <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Remarks" rows={4} />
                  </div> */}
              </div>
            </div>
          </div>
        </Section>}
        <Section index={3} title="Attach Evidence (Bank Statements)">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`grid place-items-center rounded-lg border-2 border-dashed p-8 text-center transition ${dragOver ? "border-(--brand-green) bg-green-50" : "border-muted-foreground/30"
              }`}
          >
            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
            <div className="text-sm font-medium">Drag &amp; drop your evidence here</div>
            <div className="text-xs text-muted-foreground">PDF, DOCX, PPTX up to 25 MB each</div>
            <label className="mt-3 inline-flex">
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setFiles((f) => [...f, ...Array.from(e.target.files ?? [])])}
              />
              <span className="cursor-pointer rounded-md bg-(--brand-navy) px-3 py-1.5 text-xs font-medium text-white">
                Browse files
              </span>
            </label>
          </div>
          {files.length > 0 && (
            <ul className="mt-4 space-y-2">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2 text-sm">
                  <span className="truncate">{f.name}</span>
                  <button type="button" onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))}>
                    <X className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <div className="flex justify-end gap-2">
          <Button type="submit" variant="outline" onClick={() => setStatus("Draft")}>Save Draft</Button>
          <Button type="submit" className="bg-(--brand-navy) hover:opacity-90">Submit Report</Button>
        </div>
      </form>
    </>
  );
}
