import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Check, ArrowLeft, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/apiClient";
import { useQueryClient } from "@tanstack/react-query";
import {
  qk,
  useComponents,
  useObjectives,
  useStrategies,
  useExpectedOutputs,
  useKeyActivities,
  useOutputIndicators,
  useProject,
  useProjectDocuments,
  useProjectMapping,
} from "@/hooks/useProjectsApi";

import { INITIAL_WIZARD_DATA, type WizardData } from "./types";
import Step1Identification from "./Step1Identification";
import Step2ImplementationUnit from "./Step2ImplementationUnit";
import Step3StrategicAlignment from "./Step3StrategicAlignment";
import Step4TimelineFinance from "./Step4TimelineFinance";
import Step5ObjectivesOutcomes from "./Step5ObjectivesOutcomes";
import Step6BeneficiaryTargets from "./Step6BeneficiaryTargets";
import Step7ProjectLocations from "./Step7ProjectLocations";
import Step8FundingSources from "./Step8FundingSources";
import Step9Documents from "./Step9Documents";

const STEPS = [
  { number: 1, label: "Identification" },
  { number: 2, label: "Project Implementation Centres" },
  { number: 3, label: "Strategic Alignment" },
  { number: 4, label: "Project Documents" },
  { number: 5, label: "Project Objectives" },
  { number: 6, label: "Project Locations" },
  { number: 7, label: "Timeline & Finance" },
  { number: 8, label: "Funding Sources" },
  { number: 9, label: "Beneficiary Targets" },
];

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "PR"
  );
}

function projectToWizardData(project: Record<string, unknown>): Partial<WizardData> {
  const implementationUnits = (project.implementationUnits as Record<string, unknown>) || {};
  return {
    title: (project.name as string) || "",
    mainProject: (project.mainProject as string) || "",
    mainProjectId: project.mainProjectId ? String(project.mainProjectId) : null,
    coordinator: (project.coordinator as string) || "",
    coordinatorUserId: (project.coordinatorUserId as string) || "",
    principalInvestigatorIds: (project.principalInvestigatorIds as string[]) || [],
    coPrincipalInvestigatorIds: (project.coPrincipalInvestigatorIds as string[]) || [],
    investigatorInstituteIds: (project.investigatorInstituteIds as string[]) || [],
    projectType: (project.projectType as string) || "",
    status: (project.status as string) || "Not Started",
    description: (project.description as string) || "",
    implementationUnits: {
      headquarters: !!implementationUnits.headquarters,
      coordination: (implementationUnits.coordination as string) || "",
      coordinationOther: (implementationUnits.coordinationOther as string) || "",
      institute: !!implementationUnits.institute,
      instituteName: (implementationUnits.instituteName as string) || "",
      centre: (implementationUnits.centre as string) || "",
      subCentre: (implementationUnits.subCentre as string) || "",
    },
    valueChains: (project.valueChains as string[]) || [],
    startDate: (project.startDate as string) || "",
    expectedEndDate: (project.endDate as string) || "",
    budget: project.budget != null ? String(project.budget) : "",
    background: (project.background as string) || "",
    objectives: (project.projectObjectives as string) || "",
    expectedOutputs: (project.expectedOutputs as string) || "",
    collaborators: (project.collaborators as string) || "",
    totalBeneficiaries: project.totalBeneficiaries != null ? String(project.totalBeneficiaries) : "",
    women: project.women != null ? String(project.women) : "",
    men: project.men != null ? String(project.men) : "",
    youth: project.youth != null ? String(project.youth) : "",
    pwds: project.pwds != null ? String(project.pwds) : "",
    locations: (project.locations as WizardData["locations"]) || [],
    fundingSources: ((project.fundingSources as Record<string, unknown>[]) || []).map((f) => ({
      sourceName: (f.sourceName as string) || "",
      fundingAgency: (f.fundingAgency as string) || "",
      fundingAgencyOther: (f.fundingAgencyOther as string) || "",
      type: (f.type as string) || "",
      amount: f.amount != null ? String(f.amount) : "",
      disbursed: f.disbursed != null ? String(f.disbursed) : "",
      utilized: f.utilized != null ? String(f.utilized) : "",
    })),
  };
}

function StepperHeader({ current, onJump }: { current: number; onJump: (n: number) => void }) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center min-w-max gap-0">
        {STEPS.map((step, idx) => {
          const done = current > step.number;
          const active = current === step.number;
          return (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => onJump(step.number)}
                  className={[
                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all cursor-pointer",
                    done ? "bg-green-500 border-primary text-primary-foreground" : "",
                    active
                      ? "bg-green-500 border-green-500 text-primary-foreground ring-4 ring-primary/20"
                      : "",
                    !done && !active ? "bg-background border-border text-muted-foreground" : "",
                  ].join(" ")}
                >
                  {done ? <Check className="h-4 w-4" /> : step.number}
                </button>
                <span
                  className={[
                    "text-[10px] font-medium whitespace-nowrap",
                    active ? "text-primary" : done ? "text-primary/70" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={[
                    "h-0.5 w-8 mx-1 mb-4 transition-colors",
                    done ? "bg-green-500" : "bg-border",
                  ].join(" ")}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProjectWizard({ mode }: { mode: "create" | "edit" }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { id: routeProjectId } = useParams<{ id: string }>();
  const editId = mode === "edit" ? routeProjectId : undefined;
  const isEdit = mode === "edit";

  const [projectId, setProjectId] = useState<string | undefined>(isEdit ? editId : undefined);
  const [mainProjectId, setMainProjectId] = useState<string | undefined>();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL_WIZARD_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hydrated, setHydrated] = useState(isEdit ? false : true);

  const { data: existingProject, isError: projectLoadError } = useProject(editId);
  const { data: existingMapping } = useProjectMapping(projectId);
  const { data: existingDocuments = [] } = useProjectDocuments(projectId);

  const { data: kras = [] } = useComponents();
  const { data: objectives = [] } = useObjectives();
  const { data: strategies = [] } = useStrategies();
  const { data: keyActivities = [] } = useKeyActivities();
  const { data: outputs = [] } = useExpectedOutputs();
  const { data: outputIndicators = [] } = useOutputIndicators();

  // A route transition between an edit URL and /projects/new can reuse this
  // component instance. Reset explicitly so create never inherits edit state.
  useEffect(() => {
    setProjectId(isEdit ? editId : undefined);
    setMainProjectId(undefined);
    setCurrentStep(1);
    setData(INITIAL_WIZARD_DATA);
    setHydrated(!isEdit);
  }, [editId, isEdit]);

  useEffect(() => {
    if (!existingMapping) return;
    setData((prev) => ({
      ...prev,
      selectedKeyActivityIds: existingMapping.keyActivityIds || [],
      selectedOutputIds: existingMapping.expectedOutputIds || [],
      selectedOutputIndicatorIds: existingMapping.outputIndicatorIds || [],
    }));
  }, [existingMapping]);

  useEffect(() => {
    if (existingDocuments.length === 0) return;
    setData((prev) => {
      const unsavedDocs = prev.documents.filter((doc) => !doc.id && (doc.title.trim() || doc.files.length > 0));
      return {
        ...prev,
        documents: [
          ...existingDocuments.map((doc) => ({
            id: doc.id,
            title: doc.name,
            docType: doc.documentType || "",
            description: doc.description || "",
            files: [],
          })),
          ...unsavedDocs,
        ],
      };
    });
  }, [existingDocuments]);

  // Hydrate from the existing project when editing.
  useEffect(() => {
    if (!isEdit || !existingProject || hydrated) return;
    setData((prev) => ({
      ...prev,
      ...projectToWizardData(existingProject as unknown as Record<string, unknown>),
      selectedKeyActivityIds: existingMapping?.keyActivityIds || [],
      selectedOutputIds: existingMapping?.expectedOutputIds || [],
      selectedOutputIndicatorIds: existingMapping?.outputIndicatorIds || [],
    }));
    if (existingProject.mainProjectId) setMainProjectId(String(existingProject.mainProjectId));
    setCurrentStep(Math.min(Math.max(Number(existingProject.currentStep || 1), 1), 9));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existingProject, existingMapping, hydrated]);

  const onChange = (updates: Partial<WizardData>) =>
    setData((prev) => {
      const next = { ...prev, ...updates };
      return next;
    });

  const buildProjectPayload = (): Record<string, unknown> => ({
    name: data.title.trim(),
    logo: initials(data.title),
    description: data.description,
    status: data.status || "Not Started",
    coordinator: data.coordinator,
    mainProject: data.mainProject,
    mainProjectId: mainProjectId || null,
    coordinatorUserId: data.coordinatorUserId || null,
    principalInvestigatorIds: data.principalInvestigatorIds.map(Number),
    coPrincipalInvestigatorIds: data.coPrincipalInvestigatorIds.map(Number),
    investigatorInstituteIds: data.investigatorInstituteIds.map(Number),
    projectType: data.projectType,
    implementationUnits: data.implementationUnits,
    valueChains: data.valueChains,
    startDate: data.startDate || null,
    endDate: data.expectedEndDate || null,
    budget: data.budget !== "" ? Number(data.budget) : null,
    background: data.background,
    projectObjectives: data.objectives,
    expectedOutputs: data.expectedOutputs,
    collaborators: data.collaborators,
    totalBeneficiaries: data.totalBeneficiaries !== "" ? Number(data.totalBeneficiaries) : null,
    women: data.women !== "" ? Number(data.women) : null,
    men: data.men !== "" ? Number(data.men) : null,
    youth: data.youth !== "" ? Number(data.youth) : null,
    pwds: data.pwds !== "" ? Number(data.pwds) : null,
    locations: data.locations,
    fundingSources: data.fundingSources,
  });

  const buildMappingPayload = (id: string) => {
    const selOutputIds = data.selectedOutputIds;
    const selIndicatorIds = data.selectedOutputIndicatorIds;

    const selKeyActivityIds = [
      ...new Set([
        ...data.selectedKeyActivityIds,
        ...selOutputIds
          .map((oid) => outputs.find((o) => o.id === oid)?.keyActivityId)
          .filter((kid): kid is string => !!kid),
        ...selIndicatorIds
          .map((iid) => outputIndicators.find((indicator) => indicator.id === iid)?.keyActivityId)
          .filter((kid): kid is string => !!kid),
      ]),
    ];

    const selStrategyIds = [
      ...new Set([
        ...selKeyActivityIds
          .map((kid) => keyActivities.find((activity) => activity.id === kid)?.strategyId)
          .filter((sid): sid is string => !!sid),
        ...selOutputIds
          .map((oid) => outputs.find((o) => o.id === oid)?.strategyId)
          .filter((sid): sid is string => !!sid),
        ...selIndicatorIds
          .map((iid) => outputIndicators.find((indicator) => indicator.id === iid)?.strategyId)
          .filter((sid): sid is string => !!sid),
      ]),
    ];

    const selObjectiveIds = [
      ...new Set(
        selStrategyIds
          .map((sid) => strategies.find((s) => s.id === sid)?.objectiveId)
          .filter((oid): oid is string => !!oid)
      ),
    ];

    const selKraIds = [
      ...new Set(
        selObjectiveIds
          .map((oid) => objectives.find((o) => o.id === oid)?.componentId)
          .filter((kid): kid is string => !!kid)
      ),
    ];

    return {
      project: Number(id),
      expectedOutputIds: selOutputIds.map(Number),
      strategyIds: selStrategyIds.map(Number),
      objectiveIds: selObjectiveIds.map(Number),
      kraIds: selKraIds.map(Number),
      keyActivityIds: selKeyActivityIds.map(Number),
      outputIndicatorIds: selIndicatorIds.map(Number),
    };
  };

  const syncDocuments = async (id: string, clearState = true) => {
    const docsToUpload = data.documents.filter((doc) => !doc.id && doc.title.trim());
    if (docsToUpload.length === 0) return;

    for (const doc of docsToUpload) {
      const fd = new FormData();
      fd.append("project", String(id));
      fd.append("name", doc.title.trim());
      fd.append("document_type", doc.docType);
      fd.append("description", doc.description);
      doc.files.forEach((f) => fd.append("files", f));
      await api.postForm("/project-documents/", fd);
    }

    if (clearState) setData((prev) => ({ ...prev, documents: prev.documents.filter((doc) => doc.id) }));
    await qc.invalidateQueries({ queryKey: qk.documents(id) });
  };

  const persistStep = async (stepToSave = currentStep, markComplete = false, syncProjectDocuments = true) => {
    if (!data.title.trim()) return projectId;
    setIsSaving(true);
    try {
      let effectiveMainProjectId = mainProjectId;
      if (!effectiveMainProjectId) {
        const parent = await api.post<{ id: string }>("/main-projects/", {
          name: data.mainProject.trim() || data.title.trim(),
          logo: initials(data.mainProject.trim() || data.title),
          startDate: data.startDate || null,
          endDate: data.expectedEndDate || null,
          status: data.status || "Not Started",
        });
        effectiveMainProjectId = parent.id;
        setMainProjectId(effectiveMainProjectId);
      }
      let savedId = projectId;
      const projectPayload = buildProjectPayload();
      projectPayload.mainProjectId = effectiveMainProjectId;
      if (!projectId) {
        const created = await api.post<{ id: string }>("/projects/", {
          ...projectPayload,
          isDraft: !markComplete,
          currentStep: stepToSave,
        });
        savedId = created.id;
        setProjectId(created.id);
      } else {
        await api.patch(`/projects/${projectId}/`, {
          ...projectPayload,
          isDraft: !markComplete,
          currentStep: stepToSave,
        });
      }
      if (savedId && (data.selectedKeyActivityIds.length > 0 || data.selectedOutputIds.length > 0 || data.selectedOutputIndicatorIds.length > 0)) {
        await api.post("/project-mappings/", buildMappingPayload(savedId));
        await qc.invalidateQueries({ queryKey: qk.mapping(savedId) });
      }
      if (savedId && stepToSave > 4 && syncProjectDocuments) {
        await syncDocuments(savedId);
      }
      await qc.invalidateQueries({ queryKey: qk.projects });
      return savedId;
    } catch (err) {
      console.error(err);
      toast.error("Failed to save progress for this step.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const goNext = async () => {
    const nextStep = Math.min(currentStep + 1, 9);
    await persistStep(nextStep);
    setCurrentStep(nextStep);
  };
  const goBack = async () => {
    await persistStep(currentStep);
    setCurrentStep((s) => Math.max(s - 1, 1));
  };
  const jumpTo = async (n: number) => {
    if (n === currentStep) return;
    await persistStep(Math.max(n, currentStep));
    setCurrentStep(n);
  };

  const handleFinish = async () => {
    if (!data.title.trim()) {
      toast.error("Project title is required. Please go back to Step 1.");
      return;
    }

    setIsSubmitting(true);
    try {
      const id = await persistStep(9, true, false);
      if (!id) {
        throw new Error("Project could not be saved before completion.");
      }
      const additionalTitles = [...new Set(
        data.additionalTitles
          .map((title) => title.trim())
          .filter((title) => title && title.toLocaleLowerCase() !== data.title.trim().toLocaleLowerCase()),
      )];
      // State updates from the first save are asynchronous; read the saved
      // title so queued titles always receive the correct parent ID.
      const savedProject = await api.get<{ mainProjectId?: string | number | null }>(`/projects/${id}/`);
      const parentId = mainProjectId || (savedProject.mainProjectId ? String(savedProject.mainProjectId) : undefined);
      if (parentId) {
        for (const title of additionalTitles) {
          await api.post<{ id: string }>("/projects/", {
            name: title,
            logo: initials(title),
            mainProject: data.mainProject,
            mainProjectId: parentId,
            isDraft: true,
            currentStep: 1,
            status: "Not Started",
          });
        }
      }
      await syncDocuments(id, false);
      setData((prev) => ({ ...prev, documents: prev.documents.filter((doc) => doc.id) }));

      await qc.invalidateQueries({ queryKey: qk.projects });
      toast.success(isEdit ? "Project updated successfully!" : "Project created successfully!");
      navigate(parentId ? `/projects/main/${parentId}` : "/projects");
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${isEdit ? "update" : "create"} project. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepProps = { data, onChange, onNext: goNext, onBack: goBack, isSaving };

  if (isEdit && projectLoadError) {
    return <div className="p-8 text-sm text-red-700">The selected project could not be loaded.</div>;
  }

  if (isEdit && !hydrated) {
    return <div className="p-8 text-sm text-muted-foreground">Loading project…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 justify-left">
        <Button asChild variant="outline" size="sm">
          <Link to={mainProjectId ? `/projects/main/${mainProjectId}` : "/projects"}>
            <ArrowLeft className="h-4 w-4" /> {mainProjectId ? "Back to Main Project" : "Back to Projects"}
          </Link>
        </Button>
        <div>
          <h1 className="text-xl text-center font-semibold text-foreground">
            {isEdit ? "Edit Project" : "Create New Project"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Step {currentStep} of {STEPS.length} —{" "}
            {STEPS[currentStep - 1].label}
          </p>
          {isSaving && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-primary">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Autosaving to database...
            </p>
          )}
        </div>
      </div>

      <StepperHeader current={currentStep} onJump={jumpTo} />

      {currentStep === 1 && <Step1Identification {...stepProps} allowAdditionalTitles={!isEdit} />}
      {currentStep === 2 && <Step2ImplementationUnit {...stepProps} />}
      {currentStep === 3 && <Step3StrategicAlignment {...stepProps} />}
      {currentStep === 4 && <Step9Documents {...stepProps} />}
      {currentStep === 5 && <Step5ObjectivesOutcomes {...stepProps} />}
      {currentStep === 6 && <Step7ProjectLocations {...stepProps} />}
      {currentStep === 7 && <Step4TimelineFinance {...stepProps} />}
      {currentStep === 8 && <Step8FundingSources {...stepProps} />}
      {currentStep === 9 && (
        <Step6BeneficiaryTargets
          {...stepProps}
          onFinish={handleFinish}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
