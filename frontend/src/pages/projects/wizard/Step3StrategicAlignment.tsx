import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import type { StepProps } from "./types";
import { useComponents, useObjectives, useStrategies, useExpectedOutputs } from "@/hooks/useProjectsApi";
import type { KRAComponent, ProjectObjective, ProjectStrategy, ExpectedOutput } from "@/utils/types";

function TreeNode({ label, children, defaultOpen = false }: { label: React.ReactNode; children?: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 w-full text-left py-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRightIcon className="h-3.5 w-3.5 shrink-0" />}
        {label}
      </button>
      {open && <div className="ml-5 border-l border-border pl-3">{children}</div>}
    </div>
  );
}

export default function Step3StrategicAlignment({ data, onChange, onNext, onBack }: StepProps) {
  const { data: kras = [] } = useComponents();
  const { data: objectives = [] } = useObjectives();
  const { data: strategies = [] } = useStrategies();
  const { data: outputs = [] } = useExpectedOutputs();

  const toggleOutput = (id: string) => {
    const sel = data.selectedOutputIds;
    if (sel.includes(id)) {
      onChange({ selectedOutputIds: sel.filter((x) => x !== id) });
    } else {
      onChange({ selectedOutputIds: [...sel, id] });
    }
  };

  const objectivesByKra = (kraId: string) =>
    objectives.filter((o: ProjectObjective) => o.componentId === kraId);

  const strategiesByObjective = (objId: string) =>
    strategies.filter((s: ProjectStrategy) => s.objectiveId === objId);

  const outputsByStrategy = (stratId: string) =>
    outputs.filter((o: ExpectedOutput) => o.strategyId === stratId);

  const hasContent = kras.length > 0;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Strategic Alignment</h2>
          {data.selectedOutputIds.length > 0 && (
            <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
              {data.selectedOutputIds.length} output(s) selected
            </span>
          )}
        </div>

        {!hasContent && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            No planning hierarchy found. Please add KRAs, Strategic Objectives, Strategies and Expected Outputs first.
            You can skip this step and configure it later.
          </div>
        )}

        {hasContent && (
          <div className="space-y-1 max-h-500px overflow-y-auto pr-1">
            {kras.map((kra: KRAComponent) => {
              const kraObjectives = objectivesByKra(kra.id);
              return (
                <TreeNode
                  key={kra.id}
                  label={
                    <span className="font-semibold text-foreground">{kra.title}</span>
                  }
                  defaultOpen={false}
                >
                  {kraObjectives.length === 0 && (
                    <p className="py-1 text-xs text-muted-foreground">No strategic objectives</p>
                  )}
                  {kraObjectives.map((obj: ProjectObjective) => {
                    const objStrategies = strategiesByObjective(obj.id);
                    return (
                      <TreeNode
                        key={obj.id}
                        label={<span className="text-foreground">{obj.text}</span>}
                      >
                        {objStrategies.length === 0 && (
                          <p className="py-1 text-xs text-muted-foreground">No strategies</p>
                        )}
                        {objStrategies.map((strat: ProjectStrategy) => {
                          const stratOutputs = outputsByStrategy(strat.id);
                          return (
                            <TreeNode
                              key={strat.id}
                              label={<span className="text-muted-foreground italic">{strat.text}</span>}
                            >
                              {stratOutputs.length === 0 && (
                                <p className="py-1 text-xs text-muted-foreground">No expected outputs</p>
                              )}
                              {stratOutputs.map((output: ExpectedOutput) => (
                                <label
                                  key={output.id}
                                  className="flex items-start gap-2 py-1.5 cursor-pointer group"
                                >
                                  <input
                                    type="checkbox"
                                    checked={data.selectedOutputIds.includes(output.id)}
                                    onChange={() => toggleOutput(output.id)}
                                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary"
                                  />
                                  <span className="text-sm group-hover:text-primary transition-colors">
                                    {output.text}
                                  </span>
                                </label>
                              ))}
                            </TreeNode>
                          );
                        })}
                      </TreeNode>
                    );
                  })}
                </TreeNode>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext} className="bg-green-700 text-primary-foreground">
          Save & Continue <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
