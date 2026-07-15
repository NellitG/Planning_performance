import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon, LoaderCircle } from "lucide-react";
import { useState } from "react";
import type { StepProps } from "./types";
import { useComponents, useObjectives, useStrategies, useKeyActivities, useExpectedOutputs, useOutputIndicators } from "@/hooks/useProjectsApi";
import type { KRAComponent, ProjectObjective, ProjectStrategy, KeyActivity, ExpectedOutput, OutputIndicator } from "@/utils/types";

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

export default function Step3StrategicAlignment({ data, onChange, onNext, onBack, isSaving }: StepProps) {
  const { data: kras = [] } = useComponents();
  const { data: objectives = [] } = useObjectives();
  const { data: strategies = [] } = useStrategies();
  const { data: keyActivities = [] } = useKeyActivities();
  const { data: outputs = [] } = useExpectedOutputs();
  const { data: outputIndicators = [] } = useOutputIndicators();

  const toggleKeyActivity = (id: string) => {
    const selected = data.selectedKeyActivityIds;
    const keyOutputIds = outputs
      .filter((output) => output.keyActivityId === id)
      .map((output) => output.id);
    const keyIndicatorIds = outputIndicators
      .filter((indicator) => keyOutputIds.includes(indicator.expectedOutputId))
      .map((indicator) => indicator.id);

    if (selected.includes(id)) {
      onChange({
        selectedKeyActivityIds: selected.filter((x) => x !== id),
        selectedOutputIds: data.selectedOutputIds.filter((x) => !keyOutputIds.includes(x)),
        selectedOutputIndicatorIds: data.selectedOutputIndicatorIds.filter((x) => !keyIndicatorIds.includes(x)),
      });
    } else {
      onChange({ selectedKeyActivityIds: [...selected, id] });
    }
  };

  const toggleOutput = (id: string) => {
    const sel = data.selectedOutputIds;
    const indicatorIds = outputIndicators
      .filter((indicator) => indicator.expectedOutputId === id)
      .map((indicator) => indicator.id);

    if (sel.includes(id)) {
      onChange({
        selectedOutputIds: sel.filter((x) => x !== id),
        selectedOutputIndicatorIds: data.selectedOutputIndicatorIds.filter((x) => !indicatorIds.includes(x)),
      });
    } else {
      onChange({ selectedOutputIds: [...sel, id] });
    }
  };

  const toggleOutputIndicator = (id: string) => {
    const selected = data.selectedOutputIndicatorIds;
    if (selected.includes(id)) {
      onChange({ selectedOutputIndicatorIds: selected.filter((x) => x !== id) });
    } else {
      onChange({ selectedOutputIndicatorIds: [...selected, id] });
    }
  };

  const objectivesByKra = (kraId: string) =>
    objectives.filter((o: ProjectObjective) => o.componentId === kraId);

  const strategiesByObjective = (objId: string) =>
    strategies.filter((s: ProjectStrategy) => s.objectiveId === objId);

  const keyActivitiesByStrategy = (stratId: string) =>
    keyActivities.filter((activity: KeyActivity) => activity.strategyId === stratId);

  const outputsByKeyActivity = (keyActivityId: string) =>
    outputs.filter((o: ExpectedOutput) => o.keyActivityId === keyActivityId);

  const indicatorsByOutput = (expectedOutputId: string) =>
    outputIndicators.filter((indicator: OutputIndicator) => indicator.expectedOutputId === expectedOutputId);

  const hasContent = kras.length > 0;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Strategic Alignment</h2>
          {(data.selectedKeyActivityIds.length + data.selectedOutputIds.length + data.selectedOutputIndicatorIds.length) > 0 && (
            <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
              {data.selectedOutputIds.length} output(s), {data.selectedOutputIndicatorIds.length} indicator(s) selected
            </span>
          )}
        </div>

        {!hasContent && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            No planning hierarchy found. Please add KRAs, Strategic Objectives, Strategies, Key Activities, Expected Outputs and Output Indicators first.
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
                          const stratKeyActivities = keyActivitiesByStrategy(strat.id);
                          return (
                            <TreeNode
                              key={strat.id}
                              label={<span className="text-muted-foreground italic">{strat.text}</span>}
                            >
                              {stratKeyActivities.length === 0 && (
                                <p className="py-1 text-xs text-muted-foreground">No key activities</p>
                              )}
                              {stratKeyActivities.map((activity: KeyActivity) => {
                                const activityOutputs = outputsByKeyActivity(activity.id);
                                const activitySelected = data.selectedKeyActivityIds.includes(activity.id);
                                return (
                                  <div key={activity.id} className="space-y-1 py-1">
                                    <label className="flex items-start gap-2 cursor-pointer group">
                                      <input
                                        type="checkbox"
                                        checked={activitySelected}
                                        onChange={() => toggleKeyActivity(activity.id)}
                                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary"
                                      />
                                      <span className="text-sm font-medium group-hover:text-primary transition-colors">
                                        {activity.text}
                                      </span>
                                    </label>
                                    {activitySelected && (
                                      <div className="ml-6 space-y-1 border-l border-border pl-3">
                                        {activityOutputs.length === 0 && (
                                          <p className="py-1 text-xs text-muted-foreground">No expected outputs</p>
                                        )}
                                        {activityOutputs.map((output: ExpectedOutput) => {
                                          const outputSelected = data.selectedOutputIds.includes(output.id);
                                          const outputIndicatorRows = indicatorsByOutput(output.id);
                                          return (
                                            <div key={output.id} className="space-y-1 py-1">
                                              <label className="flex items-start gap-2 cursor-pointer group">
                                                <input
                                                  type="checkbox"
                                                  checked={outputSelected}
                                                  onChange={() => toggleOutput(output.id)}
                                                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary"
                                                />
                                                <span className="text-sm group-hover:text-primary transition-colors">
                                                  {output.text}
                                                </span>
                                              </label>
                                              {outputSelected && (
                                                <div className="ml-6 space-y-1 border-l border-border pl-3">
                                                  {outputIndicatorRows.length === 0 && (
                                                    <p className="py-1 text-xs text-muted-foreground">No output indicators</p>
                                                  )}
                                                  {outputIndicatorRows.map((indicator: OutputIndicator) => (
                                                    <label
                                                      key={indicator.id}
                                                      className="flex items-start gap-2 py-1 cursor-pointer group"
                                                    >
                                                      <input
                                                        type="checkbox"
                                                        checked={data.selectedOutputIndicatorIds.includes(indicator.id)}
                                                        onChange={() => toggleOutputIndicator(indicator.id)}
                                                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary"
                                                      />
                                                      <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                                                        {indicator.text}
                                                      </span>
                                                    </label>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
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
        <Button onClick={onNext} disabled={isSaving} className="bg-green-700 text-primary-foreground">
          {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" />}
          {isSaving ? "Saving..." : "Save & Continue"} <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
