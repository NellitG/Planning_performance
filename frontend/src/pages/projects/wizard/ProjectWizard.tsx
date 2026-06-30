import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  { number: 2, label: "Implementation Unit" },
  { number: 3, label: "Strategic Alignment" },
  { number: 4, label: "Timeline & Finance" },
  { number: 5, label: "Objectives & Outcomes" },
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

function StepperHeader({ current }: { current: number }) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center min-w-max gap-0">
        {STEPS.map((step, idx) => {
          const done = current > step.number;
          const active = current === step.number;
          return (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={[
                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all",
                    done ? "bg-primary border-primary text-primary-foreground" : "",
                    active
                      ? "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20"
                      : "",
                    !done && !active ? "bg-background border-border text-muted-foreground" : "",
                  ].join(" ")}
                >
                  {done ? <Check className="h-4 w-4" /> : step.number}
                </div>
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
                    done ? "bg-primary" : "bg-border",
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

  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL_WIZARD_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: kras = [] } = useComponents();
  const { data: objectives = [] } = useObjectives();
  const { data: strategies = [] } = useStrategies();
  const { data: outputs = [] } = useExpectedOutputs();

  const onChange = (updates: Partial<WizardData>) =>
    setData((prev) => ({ ...prev, ...updates }));

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, 9));
  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const handleFinish = async () => {
    if (!data.title.trim()) {
      toast.error("Project title is required. Please go back to Step 1.");
      return;
    }

    setIsSubmitting(true);
    try {
      const projectPayload: Record<string, unknown> = {
        name: data.title.trim(),
        logo: initials(data.title),
        description: data.description,
        status: data.status || "Not Started",
        coordinator: data.coordinator,
        projectType: data.projectType,
        scale: data.scale,
        implementationUnits: data.implementationUnits,
        valueChains: data.valueChains,
        startDate: data.startDate || null,
        endDate: data.expectedEndDate || null,
        completionRate: data.completionRate !== "" ? Number(data.completionRate) : null,
        expectedBudget: data.expectedBudget !== "" ? Number(data.expectedBudget) : null,
        disbursedAmount: data.disbursedAmount !== "" ? Number(data.disbursedAmount) : null,
        utilizedAmount: data.utilizedAmount !== "" ? Number(data.utilizedAmount) : null,
        background: data.background,
        projectObjectives: data.objectives,
        expectedOutcomes: data.expectedOutcomes,
        sustainability: data.sustainability,
        collaborators: data.collaborators,
        totalBeneficiaries: data.totalBeneficiaries !== "" ? Number(data.totalBeneficiaries) : null,
        women: data.women !== "" ? Number(data.women) : null,
        youth: data.youth !== "" ? Number(data.youth) : null,
        vmgs: data.vmgs !== "" ? Number(data.vmgs) : null,
        pwds: data.pwds !== "" ? Number(data.pwds) : null,
        locations: data.locations,
        fundingSources: data.fundingSources,
      };

      const project = await api.post<{ id: string }>("/projects/", projectPayload);

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
          project: Number(project.id),
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
          fd.append("project", String(project.id));
          fd.append("name", doc.title.trim());
          fd.append("document_type", doc.docType);
          fd.append("description", doc.description);
          if (doc.file) {
            fd.append("file", doc.file);
            fd.append("size", String(doc.file.size));
            fd.append("file_type", doc.file.type);
          }
          await fetch(`${base}/project-documents/`, {
            method: "POST",
            headers,
            body: fd,
          });
        }
      }

      await qc.invalidateQueries({ queryKey: qk.projects });
      toast.success("Project created successfully!");
      navigate("/projects");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepProps = { data, onChange, onNext: goNext, onBack: goBack };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link to="/projects">
            <ArrowLeft className="h-4 w-4" /> Back to Projects
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Add New Project</h1>
          <p className="text-sm text-muted-foreground">
            Step {currentStep} of {STEPS.length} —{" "}
            {STEPS[currentStep - 1].label}
          </p>
        </div>
      </div>

      <StepperHeader current={currentStep} />

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
