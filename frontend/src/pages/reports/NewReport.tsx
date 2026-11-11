import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, Upload, X, CheckCircle2, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useMainActivities,
  useSubActivities,
  useSubSubActivities,
  useMainActivityIndicators,
  useActivityIndicators,
  useCreateTechnicalReport,
  useSaveTechnicalReportDraft,
  useProjects,
  useMainProjects,
  useTechnicalReports,
  useTechnicalReport,
  useUpdateTechnicalReport,
  useReportWorkflowAction,
} from "@/hooks/useProjectsApi";
import { QUARTER_OPTIONS, FINANCIAL_YEAR_OPTIONS } from "@/pages/projects/wizard/data";
import type { ActivityIndicator, MainActivityIndicator, Project, TechnicalReport } from "@/utils/types";
import { api } from "@/utils/apiClient";
import { reportProgressPercent } from "@/utils/reportProgress";

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;

}

type IndicatorValue = {
  target: string;
  reportedProgress: string;
  achievement: string;
  remarks: string;
  reasonForZero: string;
  files: File[];
  evidenceFiles: NonNullable<TechnicalReport["indicatorReports"]>[number]["evidenceFiles"];
};
type WardIndicatorValues = Record<string, IndicatorValue>;
type IndicatorStatus = { cumulative: Record<string, number>; reportedIndicatorIds: string[] };
type ReportingLocation = {
  key: string;
  projectLocationId: string;
  level: "County" | "Sub-county" | "Ward";
  countyId: string;
  countyName: string;
  subCountyId?: string;
  subCountyName?: string;
  wardId?: string;
  wardName?: string;
};
const EMPTY_PROJECT_LOCATIONS: NonNullable<Project["locations"]> = [];

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
  const { id } = useParams();
  const { data: mainActivities = [], isLoading: loadingMainActivities } = useMainActivities();
  const { data: subActivities = [], isLoading: loadingSubActivities } = useSubActivities();
  const { data: subSubActivities = [], isLoading: loadingSubSubActivities } = useSubSubActivities();
  const { data: mainIndicators = [], isLoading: loadingMainIndicators } = useMainActivityIndicators();
  const { data: activityIndicators = [], isLoading: loadingActivityIndicators } = useActivityIndicators();
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: mainProjects = [], isLoading: loadingMainProjects } = useMainProjects();
  const { data: previousReports = [] } = useTechnicalReports();
  const { data: report, isLoading: loadingReport, isError: reportLoadError, error: reportError } = useTechnicalReport(id);
  const createReport = useCreateTechnicalReport();
  const saveDraft = useSaveTechnicalReportDraft();
  const updateReport = useUpdateTechnicalReport();
  const submitReport = useReportWorkflowAction();
  const navigate = useNavigate();

  const [selectedMainProjectId, setSelectedMainProjectId] = useState("");
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
  const [achievement, setAchievement] = useState("");
  const [remarks, setRemarks] = useState("");
  const [wardIndicatorValues, setWardIndicatorValues] = useState<Record<string, WardIndicatorValues>>({});
  const [cumulativeByWard, setCumulativeByWard] = useState<Record<string, IndicatorStatus>>({});
  const [indicatorStatusError, setIndicatorStatusError] = useState("");
  const [isCheckingIndicators, setIsCheckingIndicators] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const reportGroupId = useMemo(() => crypto.randomUUID(), []);
  const isContextFieldLocked = (savedValue?: string | null) =>
    Boolean(id && (report?.status !== "Draft" || savedValue));

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
    const configuredIndicators = mainLevelIndicators.length > 0 ? mainLevelIndicators : activityLevelIndicators;
    const indicatorsById = new Map<string, MainActivityIndicator | ActivityIndicator>(
      configuredIndicators.map((indicator) => [indicator.id, indicator]),
    );
    report?.indicatorReports?.forEach((row) => {
      if (!indicatorsById.has(row.indicatorId)) {
        indicatorsById.set(row.indicatorId, {
          id: row.indicatorId,
          mainActivityId: selectedMainActivityId,
          category,
          valueChain: selectedValueChain,
          indicator: row.indicator,
          target: String(row.target),
          createdAt: "",
        });
      }
    });
    return [...indicatorsById.values()];
  }, [activityIndicators, category, mainIndicators, report, selectedMainActivityId, selectedValueChain]);
  const selectedWardKey = selectedWardIds.join(",");
  const indicatorStatusKey = availableIndicators.map((indicator) => indicator.id).join(",");

  const selectedMainActivity = mainActivities.find((activity) => activity.id === selectedMainActivityId);
  const selectedSubActivity = selectedSubActivities.find((activity) => activity.id === selectedSubActivityId);
  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const projectLocations = selectedProject?.locations ?? EMPTY_PROJECT_LOCATIONS;

  const reportingLocations = useMemo<ReportingLocation[]>(() => {
    const unique = new Map<string, ReportingLocation>();
    projectLocations.forEach((location) => {
      if (!location.countyId || !location.projectLocationId) return;
      const level = location.wardId ? "Ward" : location.subCountyId ? "Sub-county" : "County";
      const key = `location:${location.projectLocationId}`;
      unique.set(key, {
        key,
        projectLocationId: location.projectLocationId!,
        level,
        countyId: location.countyId!,
        countyName: location.county,
        ...(location.subCountyId ? { subCountyId: location.subCountyId, subCountyName: location.subCounty } : {}),
        ...(location.wardId ? { wardId: location.wardId, wardName: location.ward } : {}),
      });
    });
    (report?.selectedLocations || []).forEach((location) => {
      if (!location.projectLocationId || unique.has(`location:${location.projectLocationId}`)) return;
      unique.set(`location:${location.projectLocationId}`, {
        key: `location:${location.projectLocationId}`,
        projectLocationId: location.projectLocationId,
        level: (location.level as ReportingLocation["level"]) || (location.wardId ? "Ward" : location.subCountyId ? "Sub-county" : "County"),
        countyId: location.countyId,
        countyName: location.countyName,
        ...(location.subCountyId ? { subCountyId: location.subCountyId, subCountyName: location.subCountyName || "" } : {}),
        ...(location.wardId ? { wardId: location.wardId, wardName: location.wardName || "" } : {}),
      });
    });
    return [...unique.values()];
  }, [projectLocations, report]);

  const isLoadingReportingData =
    loadingProjects || loadingMainProjects || Boolean(id && loadingReport) ||
    loadingMainActivities ||
    loadingSubActivities ||
    loadingSubSubActivities ||
    loadingMainIndicators ||
    loadingActivityIndicators;

  const utilizationPercent = useMemo(
    () => (disbursed > 0 ? ((utilized / disbursed) * 100).toFixed(1) : "0.0"),
    [disbursed, utilized],
  );

  const previousUtilized = useMemo(() => previousReports
    .filter((report) => report.projectId === selectedProjectId
      && !report.isValueChainLeadCopy
      && report.financialYear === financialYear
      && report.quarter !== quarter
      && report.mainActivityId === selectedMainActivityId
      && report.subActivityId === selectedSubActivityId
      && (report.category || "") === category
      && (report.valueChain || "") === selectedValueChain)
    .reduce((sum, report) => sum + Number(report.utilizedAmount || 0), 0), [previousReports, selectedProjectId, financialYear, quarter, selectedMainActivityId, selectedSubActivityId, category, selectedValueChain]);
  const existingContextReport = useMemo(() => id ? undefined : previousReports.find((item) =>
    !item.isValueChainLeadCopy
      && item.projectId === selectedProjectId
      && item.financialYear === financialYear
      && item.quarter === quarter
      && item.mainActivityId === selectedMainActivityId
      && item.subActivityId === selectedSubActivityId
      && (item.category || "") === category
      && (item.valueChain || "") === selectedValueChain
  ), [category, financialYear, id, previousReports, quarter, selectedMainActivityId, selectedProjectId, selectedSubActivityId, selectedValueChain]);
  const amountRemaining = Math.max(0, Number(disbursed || 0) - previousUtilized - Number(utilized || 0));

  const selectedLocations = useMemo(() => reportingLocations.filter((location) => selectedWardIds.includes(location.key)), [reportingLocations, selectedWardIds]);
  const reportingKeys = useMemo(() => selectedWardIds.length ? selectedWardIds : ["__none__"], [selectedWardIds]);

  useEffect(() => {
    if (!report) return;
    setSelectedMainProjectId(report.mainProjectId || "");
    setSelectedProjectId(report.projectId || "");
    setSelectedWardIds([...new Set([
      ...(report.selectedLocations || [])
        .filter((location) => location.projectLocationId)
        .map((location) => `location:${location.projectLocationId}`),
      ...(report.indicatorReports || [])
        .map((row) => {
          const projectLocationId = row.projectLocationId
            || projectLocations.find((location) => location.wardId === row.wardId)?.projectLocationId;
          return projectLocationId ? `location:${projectLocationId}` : "";
        })
        .filter(Boolean),
    ])]);
    setQuarter(report.quarter || "");
    setFinancialYear(report.financialYear || "");
    setSelectedMainActivityId(report.mainActivityId || "");
    setCategory(report.category || "");
    setSelectedValueChain(report.valueChain || "");
    setSelectedSubActivityId(report.subActivityId || "");
    setDisbursed(Number(report.disbursedAmount || 0));
    setUtilized(Number(report.utilizedAmount || 0));
    setAchievement(report.achievement || "");
    setRemarks(report.remarks || "");
    setWardIndicatorValues((report.indicatorReports || []).reduce<Record<string, WardIndicatorValues>>((values, row) => {
      const projectLocationId = row.projectLocationId
        || report.selectedLocations?.find((location) => location.wardId === row.wardId)?.projectLocationId
        || projectLocations.find((location) => location.wardId === row.wardId)?.projectLocationId;
      const locationKey = projectLocationId
        ? `location:${projectLocationId}`
        : row.wardId
          ? `ward:${row.wardId}`
          : "__none__";
      const value: IndicatorValue = {
        target: String(row.target ?? 0),
        reportedProgress: row.reportedProgress == null ? "" : String(row.reportedProgress),
        achievement: row.achievement || "",
        remarks: row.remarks || "",
        reasonForZero: row.reasonForZero || "",
        files: [],
        evidenceFiles: row.evidenceFiles || [],
      };
      values[locationKey] = { ...values[locationKey], [row.indicatorId]: value };
      return values;
    }, {}));
  }, [projectLocations, report]);

  const handleMainActivityChange = (value: string) => {
    setSelectedMainActivityId(value);
    setCategory("");
    setSelectedValueChain("");
    setSelectedSubActivityId("");
    setWardIndicatorValues({});
    setDisbursed(0);
    setUtilized(0);
  };

  const projectTitles = useMemo(() => {
    const parent = mainProjects.find((item) => item.id === selectedMainProjectId);
    if (!parent) return [];
    const titleIds = new Set(parent.projectTitles.map((title) => title.id));
    return projects.filter((project) => titleIds.has(project.id));
  }, [mainProjects, projects, selectedMainProjectId]);

  const handleMainProjectChange = (value: string) => {
    setSelectedMainProjectId(value);
    setSelectedProjectId("");
    setSelectedWardIds([]);
    setWardIndicatorValues({});
    setCumulativeByWard({});
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setSelectedValueChain("");
    setSelectedSubActivityId("");
    setWardIndicatorValues({});
    setDisbursed(0);
    setUtilized(0);
  };

  const handleValueChainChange = (value: string) => {
    setSelectedValueChain(value);
    setSelectedSubActivityId("");
    setWardIndicatorValues({});
    setDisbursed(0);
    setUtilized(0);
  };

  const handleSubActivityChange = (value: string) => {
    setSelectedSubActivityId(value);
    const budget = subSubActivities
      .filter((item) => item.subActivityId === value && (category !== "Value Chain" || item.valueChain === selectedValueChain))
      .reduce((sum, item) => sum + Number(item.approvedActivityBudget || 0), 0);
    setWardIndicatorValues({});
    setDisbursed(budget);
    setUtilized(0);
  };

  useEffect(() => {
    if (!selectedProjectId || !quarter || !financialYear || !selectedMainActivityId || !selectedSubActivityId || !category || !indicatorStatusKey) {
      setCumulativeByWard((current) => Object.keys(current).length ? {} : current);
      setIndicatorStatusError("");
      setIsCheckingIndicators(false);
      return;
    }
    let active = true;
    setIndicatorStatusError("");
    setIsCheckingIndicators(true);
    Promise.all(reportingKeys.map(async (locationKey) => {
      const location = selectedLocations.find((item) => item.key === locationKey);
      const params = new URLSearchParams({
        project: selectedProjectId,
        financialYear,
        quarter,
        mainActivity: selectedMainActivityId,
        subActivity: selectedSubActivityId,
        category,
        valueChain: selectedValueChain,
        ...(location ? { location: location.projectLocationId } : { general: "1" }),
        ...(id ? { excludeReportId: id } : {}),
      });
      indicatorStatusKey.split(",").forEach((indicatorId) => params.append("indicatorId", indicatorId));
      const result = await api.get<IndicatorStatus>(`/technical-reports/indicator-status/?${params}`);
      return [locationKey, result] as const;
    })).then((results) => {
      if (active) {
        setCumulativeByWard(Object.fromEntries(results));
        setIsCheckingIndicators(false);
      }
    }).catch((error: unknown) => {
      if (!active) return;
      setCumulativeByWard({});
      setIndicatorStatusError(error instanceof Error ? error.message : "Unable to check previously reported indicators.");
      setIsCheckingIndicators(false);
    });
    return () => { active = false; };
  }, [selectedProjectId, quarter, financialYear, selectedMainActivityId, selectedSubActivityId, category, selectedValueChain, selectedWardKey, indicatorStatusKey, selectedLocations, reportingKeys, id]);

  const updateWardIndicator = (wardId: string, indicatorId: string, field: keyof Omit<IndicatorValue, "files" | "evidenceFiles">, value: string) => {
    setWardIndicatorValues((current) => {
      const previous = current[wardId]?.[indicatorId] || { target: "0", reportedProgress: "", achievement: "", remarks: "", reasonForZero: "", files: [], evidenceFiles: [] };
      const next = field === "reportedProgress" && value !== "" && Number(value) === 0
        ? { ...previous, reportedProgress: value, achievement: "", remarks: "", files: [] }
        : { ...previous, [field]: value };
      return { ...current, [wardId]: { ...current[wardId], [indicatorId]: next } };
    });
  };

  const setIndicatorFiles = (wardId: string, indicatorId: string, files: File[]) => setWardIndicatorValues((current) => ({
    ...current,
    [wardId]: {
      ...current[wardId],
      [indicatorId]: current[wardId]?.[indicatorId]
        ? { ...current[wardId][indicatorId], files }
        : { target: "0", reportedProgress: "", achievement: "", remarks: "", reasonForZero: "", files, evidenceFiles: [] },
    },
  }));

  const buildReportInput = (includeIncompleteIndicators = false) => {
    const generatedTitle = [
        selectedProject?.name || "Project Report",
        selectedMainActivity?.name,
        financialYear,
        quarter,
    ]
        .filter(Boolean)
        .join(" - ");
    const indicatorReports = reportingKeys.flatMap((locationKey) => availableIndicators.flatMap((indicator) => {
        const value = wardIndicatorValues[locationKey]?.[indicator.id];
        if (!value) return [];
        const hasDraftData = value.target !== "0"
          || value.reportedProgress !== ""
          || Boolean(value.achievement || value.remarks || value.reasonForZero)
          || value.files.length > 0
          || value.evidenceFiles.length > 0;
        if (includeIncompleteIndicators ? !hasDraftData : value.reportedProgress === "") return [];
        const location = selectedLocations.find((item) => item.key === locationKey);
        return [{
          ...(location ? { projectLocationId: location.projectLocationId } : {}),
          ...(location?.wardId ? { wardId: location.wardId } : {}),
          indicatorId: indicator.id,
          indicator: indicator.indicator,
          target: Number(value.target || 0),
          reportedProgress: value.reportedProgress === "" ? null : Number(value.reportedProgress),
          achievement: value.achievement,
          remarks: value.remarks,
          reasonForZero: value.reasonForZero,
        }];
    }));

    return {
        title: report?.title || generatedTitle || "Untitled Technical Report",
        projectId: selectedProjectId || null,
        mainProjectId: selectedMainProjectId || null,
        quarter,
        financialYear,
        mainActivityId: selectedMainActivityId || null,
        category,
        valueChain: selectedValueChain,
        subActivityId: selectedSubActivityId || null,
        disbursedAmount: Number(disbursed || 0),
        utilizedAmount: Number(utilized || 0),
        percentageUtilization: Number(utilizationPercent || 0),
        achievement,
        remarks,
        supportingInformation: report?.supportingInformation || "",
        supportingDocuments: report?.supportingDocuments || [],
        subSubActivities: report?.subSubActivities || [],
        indicators: report?.indicators || [],
        reportGroupId: report?.reportGroupId || reportGroupId,
        selectedLocations,
        ...(selectedLocations[0]?.wardId ? { wardId: selectedLocations[0].wardId } : {}),
        indicatorReports,
    };
  };

  const uploadEvidenceFiles = async (saved: TechnicalReport, includeZeroProgress: boolean) => {
    await Promise.all((saved.indicatorReports || []).map((row) => {
        const locationKey = selectedLocations.find(
          (location) => location.projectLocationId === row.projectLocationId,
        )?.key || (row.wardId ? `location:${row.projectLocationId || ""}` : "__none__");
        const rowValue = wardIndicatorValues[locationKey]?.[row.indicatorId];
        const rowFiles = rowValue
          && (includeZeroProgress || Number(rowValue.reportedProgress) !== 0)
          ? rowValue.files
          : [];
        if (!rowFiles.length) return Promise.resolve();
        const form = new FormData();
        rowFiles.forEach((file) => form.append("files", file));
        return api.postForm(
          `/technical-reports/${saved.id}/indicator-reports/${row.id}/evidence/`,
          form,
        );
    }));
  };

  const saveReportDraft = async () => {
    if (reportLoadError) {
        toast.error(reportError instanceof Error ? reportError.message : "Unable to load the report for editing.");
        return;
    }
    if (!id && existingContextReport) {
        toast.error("A report already exists for this reporting context. Open the saved report instead.");
        navigate(
          `/technical-reports/${existingContextReport.id}${existingContextReport.status === "Draft" || existingContextReport.status.startsWith("Rejected by ") ? "/edit" : ""}`,
        );
        return;
    }

    setIsSaving(true);
    try {
        const saved = await saveDraft.mutateAsync({
          ...buildReportInput(true),
          ...(id ? { id } : {}),
        });
        try {
          await uploadEvidenceFiles(saved, true);
        } catch (error) {
          toast.error(`Draft saved, but evidence upload failed: ${error instanceof Error ? error.message : "Please retry the upload."}`);
          navigate(`/technical-reports/${saved.id}/edit`, { replace: !id });
          return;
        }

        toast.success("Draft saved successfully.");
        if (!id) navigate(`/technical-reports/${saved.id}/edit`, { replace: true });
    } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save draft.");
    } finally {
        setIsSaving(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (reportLoadError) {
      toast.error(reportError instanceof Error ? reportError.message : "Unable to load the report for editing.");
      return;
    }

    if (!id && existingContextReport?.status.startsWith("Rejected by ")) {
      toast.error("This report was returned for correction. Open the saved report to edit and resubmit it.");
      navigate(`/technical-reports/${existingContextReport.id}/edit`);
      return;
    }

    if (indicatorStatusError || isCheckingIndicators) {
      if (isCheckingIndicators && !indicatorStatusError) {
        toast.error("Wait for previously reported indicators to finish loading before submitting.");
        return;
      }
      toast.error(`Unable to verify indicator availability: ${indicatorStatusError}`);
      return;
    }

    if (!selectedMainProjectId || !selectedProjectId) {
      toast.error("Please select a Main Project and Project Title.");
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

    let hasReportedIndicator = false;
    for (const wardId of reportingKeys) {
      for (const indicator of availableIndicators) {
        const value = wardIndicatorValues[wardId]?.[indicator.id];

        if (!value || value.reportedProgress === "") {
          continue;
        }
        hasReportedIndicator = true;
        if (!Number.isFinite(Number(value.target)) || Number(value.target) < 0) {
          toast.error(`Enter a valid non-negative target for ${indicator.indicator}.`);
          return;
        }
        if (!Number.isFinite(Number(value.reportedProgress)) || Number(value.reportedProgress) < 0) {
          toast.error(`Enter a valid non-negative achievement for ${indicator.indicator}.`);
          return;
        }

        if (
          Number(value.reportedProgress) === 0 &&
          !value.reasonForZero?.trim()
        ) {
          toast.error(
            `Please provide a reason when Report Against Target is 0 for ${indicator.indicator}.`
          );
          return;
        }
      }
    }
    if (!hasReportedIndicator) {
      toast.error("Enter a Report Against Target value for at least one indicator before submitting.");
      return;
    }

    setIsSaving(true);
    try {
      const input = buildReportInput();
      const saved = report
        ? await updateReport.mutateAsync({ ...input, id: report.id })
        : await createReport.mutateAsync(input);
      try {
        await uploadEvidenceFiles(saved, false);
      } catch (error) {
        toast.error(`Report saved but not submitted because evidence upload failed: ${error instanceof Error ? error.message : "Please upload evidence from the saved report."}`);
        navigate(`/technical-reports/${saved.id}`);
        return;
      }

      try {
        await submitReport.mutateAsync({ id: saved.id, action: "submit" });
      } catch (error) {
        toast.error(`Report saved but not submitted: ${error instanceof Error ? error.message : "Please review the report and try again."}`);
        navigate(`/technical-reports/${saved.id}`);
        return;
      }

      toast.success("Report saved and submitted to the Accountant for review.");
      navigate(`/technical-reports/${saved.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save report.");
    } finally {
      setIsSaving(false);
    }
  };

  if (id && loadingReport) {
    return <p className="py-12 text-center text-muted-foreground">Loading technical report...</p>;
  }
  if (id && (reportLoadError || !report)) {
    return <div className="rounded-lg border p-6">
      <p className="text-sm text-red-700">{reportError instanceof Error ? reportError.message : "Technical report could not be loaded."}</p>
      <Button asChild className="mt-4"><Link to="/technical-reports">Back to Technical Reports</Link></Button>
    </div>;
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Dashboard</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/technical-reports" className="hover:text-foreground">Technical Reports</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{id ? "Edit Report" : "New Report"}</span>
      </div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{id ? "Edit Technical Report" : "Project Reporting Form"}</h1>
          <p className="text-sm text-muted-foreground">Generated from the official KALRO Project Reporting Template.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/technical-reports">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button
            type="button"
            variant="outline"
            onClick={saveReportDraft}
            disabled={isSaving || Boolean(id && loadingReport)}
          >
            {isSaving ? "Saving..." : "Save Draft"}
          </Button>
          <Button type="submit" form="report-form" className="bg-green-700 hover:opacity-90" disabled={isSaving || isLoadingReportingData || isCheckingIndicators || Boolean(existingContextReport && !id)}>
            {isSaving ? "Saving and submitting..." : isCheckingIndicators ? "Checking indicators..." : "Save Report"}
          </Button>
        </div>
      </div>

      {reportLoadError && <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{reportError instanceof Error ? reportError.message : "Unable to load the report for editing."}</p>}
      {existingContextReport && !id && <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        A report already exists for this project and reporting period ({existingContextReport.status}). <Link className="font-semibold underline" to={`/technical-reports/${existingContextReport.id}${existingContextReport.status.startsWith("Rejected by ") || existingContextReport.status === "Draft" ? "/edit" : ""}`}>{existingContextReport.status.startsWith("Rejected by ") || existingContextReport.status === "Draft" ? "Open it to edit" : "View it"}</Link>.
      </p>}
      <form id="report-form" onSubmit={submit} className="space-y-5">
        <Section index={1} title="Project Activity">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Main Project</Label>
              <Select value={selectedMainProjectId} disabled={isContextFieldLocked(report?.mainProjectId)} onValueChange={handleMainProjectChange}>
                <SelectTrigger><SelectValue placeholder={loadingMainProjects ? "Loading Main Projects..." : "Select Main Project"} /></SelectTrigger>
                <SelectContent>
                  {mainProjects.map((project) => <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">Project Title</Label><Select value={selectedProjectId} disabled={!selectedMainProjectId || isContextFieldLocked(report?.projectId)} onValueChange={(value) => { setSelectedProjectId(value); setSelectedWardIds([]); setWardIndicatorValues({}); }}><SelectTrigger><SelectValue placeholder={!selectedMainProjectId ? "Select Main Project first" : loadingProjects ? "Loading Project Titles..." : "Select Project Title"} /></SelectTrigger><SelectContent>{projectTitles.map((project) => <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Financial Year</Label>
              <Select value={financialYear} disabled={isContextFieldLocked(report?.financialYear)} onValueChange={setFinancialYear}>
                <SelectTrigger><SelectValue placeholder="Select Financial Year" /></SelectTrigger>
                <SelectContent>
                  {FINANCIAL_YEAR_OPTIONS.map((fy) => <SelectItem key={fy} value={fy}>{fy}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Quarter</Label>
              <Select value={quarter} disabled={isContextFieldLocked(report?.quarter)} onValueChange={setQuarter}>
                <SelectTrigger><SelectValue placeholder="Select Quarter" /></SelectTrigger>
                <SelectContent>
                  {QUARTER_OPTIONS.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>
        <Section index={2} title="Project Locations">
          {!selectedProjectId ? <p className="text-sm text-muted-foreground">Select a project to view its locations.</p> : reportingLocations.length === 0 ? <p className="text-sm text-muted-foreground">This project has no locations configured. You may submit a general report without a specific location.</p> :
            <div className="space-y-2">{reportingLocations.map((location) => <label key={location.key} className="flex items-center gap-2 rounded-md border p-3 text-sm">
              <Checkbox checked={selectedWardIds.includes(location.key)} disabled={Boolean(report?.indicatorReports?.some((row) => row.projectLocationId === location.projectLocationId))} onCheckedChange={(checked) => setSelectedWardIds((current) => checked ? [...current, location.key] : current.filter((key) => key !== location.key))} />
              <span className="text-xs font-semibold uppercase text-muted-foreground">{location.level}</span>
              {[location.countyName, location.subCountyName, location.wardName].filter(Boolean).join(" / ")}
            </label>)}</div>}
          {selectedLocations.length > 0 && <div className="mt-4 rounded-md border-l-4 border-green-200 bg-green-50 p-3 text-sm font-medium">Reporting locations: {selectedLocations.map((location) => [location.countyName, location.subCountyName, location.wardName].filter(Boolean).join(" / ")).join(", ")}</div>}
        </Section>
        {!!selectedProjectId && <Section index={3} title="Main Activity Reporting">
          <div className="mb-4 rounded-md border-l-4 border-green-200 bg-green-50 p-3 text-sm font-medium">{selectedLocations.length ? `Locations: ${selectedLocations.map((location) => [location.countyName, location.subCountyName, location.wardName].filter(Boolean).join(" / ")).join(", ")}` : "General report (no specific location selected)"}</div>
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
                  <Select value={selectedMainActivityId} disabled={isContextFieldLocked(report?.mainActivityId)} onValueChange={handleMainActivityChange}>
                    <SelectTrigger><SelectValue placeholder={loadingMainActivities ? "Loading Main Activities..." : "Select Main Activity"} /></SelectTrigger>
                    <SelectContent>
                      {mainActivities.map((activity) => <SelectItem key={activity.id} value={activity.id}>{activity.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={handleCategoryChange} disabled={!selectedMainActivityId || isContextFieldLocked(report?.category)}>
                    <SelectTrigger><SelectValue placeholder={selectedMainActivityId ? "Select Category" : "Select Main Activity first"} /></SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {category === "Value Chain" && (
                  <div className="space-y-1.5">
                    <Label>Value Chain</Label>
                    <Select value={selectedValueChain} onValueChange={handleValueChainChange} disabled={valueChainOptions.length === 0 || isContextFieldLocked(report?.valueChain)}>
                      <SelectTrigger><SelectValue placeholder={valueChainOptions.length > 0 ? "Select Value Chain" : "No Value Chains found"} /></SelectTrigger>
                      <SelectContent>
                        {valueChainOptions.map((valueChain) => <SelectItem key={valueChain} value={valueChain}>{valueChain}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Sub Activity</Label>
                  <Select value={selectedSubActivityId} onValueChange={handleSubActivityChange} disabled={!category || (category === "Value Chain" && !selectedValueChain) || isContextFieldLocked(report?.subActivityId)}>
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

                  <div className="space-y-5">
                    {indicatorStatusError && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">Unable to check previously reported indicators: {indicatorStatusError}</p>}
                    {!selectedSubActivityId ? <p className="rounded-md border border-dashed border-border/70 bg-muted/10 p-3 text-sm text-muted-foreground">Select a sub activity to view indicators and targets.</p> : availableIndicators.length === 0 ? <p className="rounded-md border border-dashed border-border/70 bg-muted/10 p-3 text-sm text-muted-foreground">No indicators found for the selected reporting path.</p> : reportingKeys.map((locationKey, locationIndex) => {
                      const location = selectedLocations.find((item) => item.key === locationKey);
                      const locationName = location ? [location.countyName, location.subCountyName, location.wardName].filter(Boolean).join(" / ") : "No specific location";
                      const wardId = locationKey;
                      const reportedIndicatorIds = new Set(cumulativeByWard[wardId]?.reportedIndicatorIds || []);
                      const indicatorsForLocation = availableIndicators.filter((indicator) => Boolean(id) || !reportedIndicatorIds.has(indicator.id));
                      return <div key={wardId} className="space-y-3 rounded-lg border border-green-200 bg-green-50/40 p-4">
                        <div className="sticky top-0 z-10 -mx-4 -mt-4 rounded-t-lg border-b border-green-200 bg-green-100/80 p-4 text-green-950">
                          <h3 className="font-semibold">{location?.level || "General"} report {location ? locationIndex + 1 : ""} — {locationName}</h3>
                          <p className="mt-1 text-sm"><span className="font-medium">Main Activity:</span> {selectedMainActivity?.name || "Not selected"}</p>
                        </div>
                        {!isLoadingReportingData && !isCheckingIndicators && indicatorsForLocation.length === 0 ? <p className="rounded-md border border-dashed bg-background p-4 text-sm text-muted-foreground">All indicators for this location have already been reported in this financial year, quarter, and activity.</p> : indicatorsForLocation.map((indicator) => {
                          const value = wardIndicatorValues[wardId]?.[indicator.id] || { target: "0", reportedProgress: "", achievement: "", remarks: "", reasonForZero: "", files: [], evidenceFiles: [] };
                          const target = Number(value.target || 0);
                          const cumulative = cumulativeByWard[wardId]?.cumulative[indicator.id] || 0;
                          const entered = Number(value.reportedProgress || 0);
                          const isZeroReport = value.reportedProgress !== "" && Number(value.reportedProgress) === 0;
                          const progress = reportProgressPercent(entered, target);
                          const progressLabel = target > 0 ? `${progress.toFixed(1)}%` : "N/A";
                          const fullyAchieved = target > 0 && cumulative >= target;
                          return <div key={indicator.id} className="rounded-lg border border-border bg-background p-5 shadow-sm">
                            <div className="grid gap-4 lg:grid-cols-2">
                              <div>
                                <p className="text-sm font-semibold">{indicator.indicator}</p>
                                <p className="mt-1 text-sm text-muted-foreground">Target: {target} · Cumulative report: {cumulative}</p>
                              </div>
                              <div className="space-y-1.5">
                                <Label>Target</Label>
                                <Input type="number" min="0" step="any" value={value.target} onChange={(event) => updateWardIndicator(wardId, indicator.id, "target", event.target.value)} />
                              </div>
                            </div>
                            {fullyAchieved ? <div className="mt-4 rounded-md bg-green-100 p-3 text-sm font-medium text-green-800">
                              <CheckCircle2 className="mr-1 inline h-4 w-4" />Target fully achieved. No further reporting is allowed.</div> : <div className="mt-4 space-y-1.5"><Label>Report Against Target</Label><Input type="number" min="0" step="any" max={target > 0 ? Math.max(0, target - cumulative) : undefined} value={value.reportedProgress} onChange={(e) => updateWardIndicator(wardId, indicator.id, "reportedProgress", e.target.value)} placeholder={target > 0 ? `Remaining: ${Math.max(0, target - cumulative)}` : "Enter a non-negative value"} /><p className="text-xs text-muted-foreground">{target > 0 ? `Whole and decimal values are accepted. Remaining target: ${Math.max(0, target - cumulative)}` : "Whole and decimal non-negative values are accepted; no target limit is set."}</p></div>}
                            <div className="mt-4 rounded-md bg-muted/35 p-3">
                              <div className="mb-1 flex justify-between text-xs font-medium">
                                <span>Progress</span><span>{progressLabel}</span>
                              </div>
                              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                                <div className="h-full bg-green-700 transition-all" style={{ width: `${progress}%` }} />
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">{target > 0 ? "Calculated as reported value ÷ fixed target × 100." : "Percentage is unavailable because the fixed target is 0."}</p>
                            </div>
                            {value.evidenceFiles.length > 0 && <p className="mt-3 text-xs text-muted-foreground">Previously saved evidence: {value.evidenceFiles.map((file) => file.name).join(", ")}</p>}
                            {!fullyAchieved && isZeroReport && <div className="mt-4 space-y-1.5">
                              <Label>Reason for Zero <span className="text-red-600">*</span>
                              </Label>
                              <Textarea rows={4} value={value.reasonForZero} onChange={(e) => updateWardIndicator(wardId, indicator.id, "reasonForZero", e.target.value)} placeholder="Explain why no progress was reported for this indicator." />
                            </div>}
                            {!fullyAchieved && !isZeroReport && <div className="mt-4 grid gap-4 md:grid-cols-2">
                              <div className="space-y-1.5">
                                <Label>Achievement</Label>
                                <Textarea rows={5} value={value.achievement} onChange={(e) => updateWardIndicator(wardId, indicator.id, "achievement", e.target.value)} placeholder="Describe the achievement" />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Remarks</Label>
                                <Textarea rows={5} value={value.remarks} onChange={(e) => updateWardIndicator(wardId, indicator.id, "remarks", e.target.value)} placeholder="Enter remarks" />
                              </div>
                            </div>}
                            {!fullyAchieved && !isZeroReport && <div className="mt-4 rounded-md border border-dashed border-green-300 bg-green-50/40 p-4">
                              <Label className="text-sm font-semibold">Evidence (any technical or financial)</Label>
                              <p className="mt-1 text-xs text-muted-foreground">Upload supporting documentation for this indicator only.</p>
                              <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800">
                                <Upload className="h-4 w-4" />
                                <span>Upload Evidence</span>
                                <input className="hidden" type="file" multiple onChange={(e) => setIndicatorFiles(wardId, indicator.id, [...value.files, ...Array.from(e.target.files || [])])} />
                              </label>{value.files.length > 0 && <ul className="mt-3 space-y-2">{value.files.map((file, index) => <li key={`${file.name}-${index}`} className="flex items-center justify-between rounded-md bg-background px-3 py-2 text-sm">
                                <span className="flex min-w-0 items-center gap-2 truncate">
                                  <FileText className="h-4 w-4 shrink-0 text-green-700" />{file.name}</span>
                                <button type="button" className="text-xs font-medium text-red-600" onClick={() => setIndicatorFiles(wardId, indicator.id, value.files.filter((_, fileIndex) => fileIndex !== index))}>Remove</button>
                              </li>)}</ul>}
                            </div>}
                          </div>;
                        })}
                      </div>;
                    })}
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
                <div className="space-y-1.5">
                  <Label>Amount Remaining</Label>
                  <div className="grid h-9 place-items-center rounded-md border bg-muted/40 text-sm font-semibold text-(--brand-green)">
                    KES {amountRemaining.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>}
        <div className="flex justify-end gap-2">
          <Button type="submit" className="bg-(--brand-navy) hover:opacity-90">Save Report</Button>
        </div>
      </form>
    </>
  );
}
