import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/apiClient";
import { useQueryClient } from "@tanstack/react-query";
import {
  qk,
  useComponents,
  useObjectives,
  useStrategies,
  useExpectedOutputs,
  useProject,
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
  { number: 4, label: "Timeline & Finance" },
  { number: 5, label: "Project Objectives" },
  { number: 6, label: "Beneficiary Targets" },
  { number: 7, label: "Project Locations" },
  { number: 8, label: "Funding Sources" },
  { number: 9, label: "Project Documents" },
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

function draftKey(projectId?: string) {
  return projectId ? `kalro_project_draft_edit_${projectId}` : "kalro_project_draft_new";
}

function loadDraft(projectId?: string): { data: WizardData; step: number } | null {
  try {
    const raw = localStorage.getItem(draftKey(projectId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveDraft(projectId: string | undefined, data: WizardData, step: number) {
  try {
    // File objects cannot be serialized; strip them from documents when persisting.
    const serializable = {
      ...data,
      documents: data.documents.map((d) => ({ ...d, files: [] as File[] })),
    };
    localStorage.setItem(draftKey(projectId), JSON.stringify({ data: serializable, step }));
  } catch {
    // localStorage may be unavailable (e.g. private mode) — safe to ignore.
  }
}

function clearDraft(projectId?: string) {
  try {
    localStorage.removeItem(draftKey(projectId));
  } catch {
    // ignore
  }
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

  const { data: existingProject } = useProject(editId);
  const { data: existingMapping } = useProjectMapping(editId);

  const [projectId, setProjectId] = useState<string | undefined>(editId);
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL_WIZARD_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(isEdit ? false : true);

  const { data: kras = [] } = useComponents();
  const { data: objectives = [] } = useObjectives();
  const { data: strategies = [] } = useStrategies();
  const { data: outputs = [] } = useExpectedOutputs();

  // Resume a saved draft for "new project" flow on first mount.
  useEffect(() => {
    if (isEdit) return;
    const draft = loadDraft(undefined);
    if (draft) {
      setData(draft.data);
      setCurrentStep(draft.step);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hydrate from the existing project when editing.
  useEffect(() => {
    if (!isEdit || !existingProject || hydrated) return;
    const draft = loadDraft(editId);
    if (draft) {
      setData(draft.data);
      setCurrentStep(draft.step);
    } else {
      setData((prev) => ({
        ...prev,
        ...projectToWizardData(existingProject as unknown as Record<string, unknown>),
        selectedOutputIds: existingMapping?.expectedOutputIds || [],
      }));
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existingProject, existingMapping, hydrated]);

  const onChange = (updates: Partial<WizardData>) =>
    setData((prev) => {
      const next = { ...prev, ...updates };
      saveDraft(projectId, next, currentStep);
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

  const persistStep = async () => {
    if (!data.title.trim()) return;
    try {
      if (!projectId) {
        const created = await api.post<{ id: string }>("/projects/", {
          ...buildProjectPayload(),
          isDraft: true,
          currentStep,
        });
        setProjectId(created.id);
        saveDraft(created.id, data, currentStep);
        clearDraft(undefined);
      } else {
        await api.patch(`/projects/${projectId}/`, {
          ...buildProjectPayload(),
          currentStep,
        });
        saveDraft(projectId, data, currentStep);
      }
      await qc.invalidateQueries({ queryKey: qk.projects });
    } catch (err) {
      console.error(err);
      toast.error("Failed to save progress for this step.");
    }
  };

  const goNext = async () => {
    await persistStep();
    setCurrentStep((s) => Math.min(s + 1, 9));
  };
  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 1));
  const jumpTo = (n: number) => setCurrentStep(n);

  const handleFinish = async () => {
    if (!data.title.trim()) {
      toast.error("Project title is required. Please go back to Step 1.");
      return;
    }

    setIsSubmitting(true);
    try {
      let id = projectId;
      if (!id) {
        const created = await api.post<{ id: string }>("/projects/", {
          ...buildProjectPayload(),
          isDraft: false,
          currentStep: 9,
        });
        id = created.id;
      } else {
        await api.patch(`/projects/${id}/`, {
          ...buildProjectPayload(),
          isDraft: false,
          currentStep: 9,
        });
      }

      if (data.selectedOutputIds.length > 0) {
        const selOutputIds = data.selectedOutputIds;

        const selStrategyIds = [
          ...new Set(
            selOutputIds
              .map((oid) => outputs.find((o) => o.id === oid)?.strategyId)
              .filter((sid): sid is string => !!sid)
          ),
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

        await api.post("/project-mappings/", {
          project: Number(id),
          expectedOutputIds: selOutputIds.map(Number),
          strategyIds: selStrategyIds.map(Number),
          objectiveIds: selObjectiveIds.map(Number),
          kraIds: selKraIds.map(Number),
          keyActivityIds: [],
          outputIndicatorIds: [],
        });
      }

      if (data.documents.some((d) => d.title.trim())) {
        const base = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";
        const token = localStorage.getItem("kalro_token");
        const headers: Record<string, string> = token
          ? { Authorization: `Token ${token}` }
          : {};

        for (const doc of data.documents) {
          if (!doc.title.trim()) continue;
          const fd = new FormData();
          fd.append("project", String(id));
          fd.append("name", doc.title.trim());
          fd.append("document_type", doc.docType);
          fd.append("description", doc.description);
          doc.files.forEach((f) => fd.append("files", f));
          await fetch(`${base}/project-documents/`, {
            method: "POST",
            headers,
            body: fd,
          });
        }
      }

      clearDraft(editId);
      clearDraft(undefined);
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

  const stepProps = { data, onChange, onNext: goNext, onBack: goBack };

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
        </div>
      </div>

      <StepperHeader current={currentStep} onJump={jumpTo} />

      {currentStep === 1 && <Step1Identification {...stepProps} />}
      {currentStep === 2 && <Step2ImplementationUnit {...stepProps} />}
      {currentStep === 3 && <Step3StrategicAlignment {...stepProps} />}
      {currentStep === 4 && <Step4TimelineFinance {...stepProps} />}
      {currentStep === 5 && <Step5ObjectivesOutcomes {...stepProps} />}
      {currentStep === 6 && <Step6BeneficiaryTargets {...stepProps} />}
      {currentStep === 7 && <Step7ProjectLocations {...stepProps} />}
      {currentStep === 8 && <Step8FundingSources {...stepProps} />}
      {currentStep === 9 && (
        <Step9Documents
          {...stepProps}
          onFinish={handleFinish}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
