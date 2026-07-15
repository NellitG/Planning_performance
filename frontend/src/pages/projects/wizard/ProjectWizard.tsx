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
  useProjects,
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
    coordinator: (project.coordinator as string) || "",
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

export default function ProjectWizard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { id: editId } = useParams<{ id: string }>();
  const isEdit = !!editId;

  const [projectId, setProjectId] = useState<string | undefined>(editId);
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL_WIZARD_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hydrated, setHydrated] = useState(isEdit ? false : true);

  const { data: existingProject } = useProject(editId);
  const { data: existingMapping } = useProjectMapping(projectId);
  const { data: existingDocuments = [] } = useProjectDocuments(projectId);
  const { data: allProjects = [], isLoading: projectsLoading } = useProjects();

  const { data: kras = [] } = useComponents();
  const { data: objectives = [] } = useObjectives();
  const { data: strategies = [] } = useStrategies();
  const { data: keyActivities = [] } = useKeyActivities();
  const { data: outputs = [] } = useExpectedOutputs();
  const { data: outputIndicators = [] } = useOutputIndicators();

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

  // Resume the newest backend-saved draft for the "new project" flow.
  useEffect(() => {
    if (isEdit || projectsLoading || projectId) return;
    const draft = allProjects.find((project) => project.isDraft);
    if (draft) {
      setProjectId(draft.id);
      setData((prev) => ({
        ...prev,
        ...projectToWizardData(draft as unknown as Record<string, unknown>),
      }));
      setCurrentStep(Math.min(Math.max(Number(draft.currentStep || 1), 1), 9));
    }
  }, [allProjects, isEdit, projectId, projectsLoading]);

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

  const syncDocuments = async (id: string) => {
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

    setData((prev) => ({
      ...prev,
      documents: prev.documents.filter((doc) => doc.id),
    }));
    await qc.invalidateQueries({ queryKey: qk.documents(id) });
  };

  const persistStep = async (stepToSave = currentStep, markComplete = false) => {
    if (!data.title.trim()) return projectId;
    setIsSaving(true);
    try {
      let savedId = projectId;
      if (!projectId) {
        const created = await api.post<{ id: string }>("/projects/", {
          ...buildProjectPayload(),
          isDraft: !markComplete,
          currentStep: stepToSave,
        });
        savedId = created.id;
        setProjectId(created.id);
      } else {
        await api.patch(`/projects/${projectId}/`, {
          ...buildProjectPayload(),
          isDraft: !markComplete,
          currentStep: stepToSave,
        });
      }
      if (savedId && (data.selectedKeyActivityIds.length > 0 || data.selectedOutputIds.length > 0 || data.selectedOutputIndicatorIds.length > 0)) {
        await api.post("/project-mappings/", buildMappingPayload(savedId));
        await qc.invalidateQueries({ queryKey: qk.mapping(savedId) });
      }
      if (savedId && stepToSave > 4) {
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
      const id = await persistStep(9, true);
      if (!id) {
        throw new Error("Project could not be saved before completion.");
      }

      await qc.invalidateQueries({ queryKey: qk.projects });
      toast.success(isEdit ? "Project updated successfully!" : "Project created successfully!");
      navigate("/projects");
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${isEdit ? "update" : "create"} project. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepProps = { data, onChange, onNext: goNext, onBack: goBack, isSaving };

  if (isEdit && !hydrated) {
    return <div className="p-8 text-sm text-muted-foreground">Loading project…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 justify-left">
        <Button asChild variant="outline" size="sm">
          <Link to="/projects">
            <ArrowLeft className="h-4 w-4" /> Back to Projects
          </Link>
        </Button>
        <div>
          <h1 className="text-xl text-center font-semibold text-foreground">
            {isEdit ? "Edit Project" : "Add New Project"}
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

      {currentStep === 1 && <Step1Identification {...stepProps} />}
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
