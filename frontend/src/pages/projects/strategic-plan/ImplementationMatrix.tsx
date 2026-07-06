import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useComponents, useExpectedOutputs, useKeyActivities, useObjectives, useOutputIndicators, useStrategies } from "@/hooks/useProjectsApi";
import type { ExpectedOutput, KeyActivity, KRAComponent, OutputIndicator, ProjectObjective, ProjectStrategy } from "@/utils/types";

export default function ImplementationMatrix() {
  const { data: kras = [] } = useComponents();
  const { data: objectives = [] } = useObjectives();
  const { data: strategies = [] } = useStrategies();
  const { data: keyActivities = [] } = useKeyActivities();
  const { data: expectedOutputs = [] } = useExpectedOutputs();
  const { data: outputIndicators = [] } = useOutputIndicators();

  const [kraId, setKraId] = useState("");
  const [objectiveId, setObjectiveId] = useState("");
  const [strategyId, setStrategyId] = useState("");
  const [activityId, setActivityId] = useState("");
  const [expectedOutputId, setExpectedOutputId] = useState("");
  const [indicatorId, setIndicatorId] = useState("");

  const filteredObjectives = useMemo(() => objectives.filter((item) => item.componentId === kraId), [objectives, kraId]);
  const filteredStrategies = useMemo(() => strategies.filter((item) => item.objectiveId === objectiveId), [strategies, objectiveId]);
  const filteredActivities = useMemo(() => keyActivities.filter((item) => item.strategyId === strategyId), [keyActivities, strategyId]);
  const filteredExpectedOutputs = useMemo(() => expectedOutputs.filter((item) => item.strategyId === strategyId && (!activityId || item.keyActivityId === activityId)), [expectedOutputs, strategyId, activityId]);
  const filteredIndicators = useMemo(() => outputIndicators.filter((item) => item.expectedOutputId === expectedOutputId), [outputIndicators, expectedOutputId]);

  const selectedIndicator = filteredIndicators.find((item) => item.id === indicatorId) || null;

  return (
    <div className="space-y-6">
      <PageHeader title="Implementation Matrix" description="View output indicator details for the selected planning hierarchy." />

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Key Result Area</Label>
            <Select value={kraId} onValueChange={(value) => { setKraId(value); setObjectiveId(""); setStrategyId(""); setActivityId(""); setExpectedOutputId(""); setIndicatorId(""); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select KRA" />
              </SelectTrigger>
              <SelectContent>
                {kras.map((kra: KRAComponent) => <SelectItem key={kra.id} value={kra.id}>{kra.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Strategic Objective</Label>
            <Select value={objectiveId} onValueChange={(value) => { setObjectiveId(value); setStrategyId(""); setActivityId(""); setExpectedOutputId(""); setIndicatorId(""); }} disabled={!kraId}>
              <SelectTrigger>
                <SelectValue placeholder={kraId ? "Select Strategic Objective" : "Select KRA first"} />
              </SelectTrigger>
              <SelectContent>
                {filteredObjectives.map((objective: ProjectObjective) => <SelectItem key={objective.id} value={objective.id}>{objective.text}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Strategy</Label>
            <Select value={strategyId} onValueChange={(value) => { setStrategyId(value); setActivityId(""); setExpectedOutputId(""); setIndicatorId(""); }} disabled={!objectiveId}>
              <SelectTrigger>
                <SelectValue placeholder={objectiveId ? "Select Strategy" : "Select Strategic Objective first"} />
              </SelectTrigger>
              <SelectContent>
                {filteredStrategies.map((strategy: ProjectStrategy) => <SelectItem key={strategy.id} value={strategy.id}>{strategy.text}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Key Activity</Label>
            <Select value={activityId} onValueChange={(value) => { setActivityId(value); setExpectedOutputId(""); setIndicatorId(""); }} disabled={!strategyId}>
              <SelectTrigger>
                <SelectValue placeholder={strategyId ? "Select Key Activity" : "Select Strategy first"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— None —</SelectItem>
                {filteredActivities.map((activity: KeyActivity) => <SelectItem key={activity.id} value={activity.id}>{activity.text}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Expected Output</Label>
            <Select value={expectedOutputId} onValueChange={(value) => { setExpectedOutputId(value); setIndicatorId(""); }} disabled={!strategyId}>
              <SelectTrigger>
                <SelectValue placeholder={strategyId ? "Select Expected Output" : "Select Strategy first"} />
              </SelectTrigger>
              <SelectContent>
                {filteredExpectedOutputs.map((output: ExpectedOutput) => <SelectItem key={output.id} value={output.id}>{output.text}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Output Indicator</Label>
            <Select value={indicatorId} onValueChange={setIndicatorId} disabled={!expectedOutputId}>
              <SelectTrigger>
                <SelectValue placeholder={expectedOutputId ? "Select Output Indicator" : "Select Expected Output first"} />
              </SelectTrigger>
              <SelectContent>
                {filteredIndicators.map((indicator: OutputIndicator) => <SelectItem key={indicator.id} value={indicator.id}>{indicator.text}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Cumulative Target</th>
                <th className="px-4 py-3">Year 1</th>
                <th className="px-4 py-3">Year 2</th>
                <th className="px-4 py-3">Year 3</th>
                <th className="px-4 py-3">Year 4</th>
                <th className="px-4 py-3">Year 5</th>
                <th className="px-4 py-3">Total Budget (Millions)</th>
                <th className="px-4 py-3">Budget Year 1</th>
                <th className="px-4 py-3">Budget Year 2</th>
                <th className="px-4 py-3">Budget Year 3</th>
                <th className="px-4 py-3">Budget Year 4</th>
                <th className="px-4 py-3">Budget Year 5</th>
              </tr>
            </thead>
            <tbody>
              {selectedIndicator ? (
                <tr className="border-t border-border/60 bg-background/50">
                  <td className="px-4 py-3">{selectedIndicator.cumulativeTarget ?? "-"}</td>
                  <td className="px-4 py-3">{selectedIndicator.year1Target ?? "-"}</td>
                  <td className="px-4 py-3">{selectedIndicator.year2Target ?? "-"}</td>
                  <td className="px-4 py-3">{selectedIndicator.year3Target ?? "-"}</td>
                  <td className="px-4 py-3">{selectedIndicator.year4Target ?? "-"}</td>
                  <td className="px-4 py-3">{selectedIndicator.year5Target ?? "-"}</td>
                  <td className="px-4 py-3">{selectedIndicator.totalBudgetMillions ?? "-"}</td>
                  <td className="px-4 py-3">{selectedIndicator.budgetYear1 ?? "-"}</td>
                  <td className="px-4 py-3">{selectedIndicator.budgetYear2 ?? "-"}</td>
                  <td className="px-4 py-3">{selectedIndicator.budgetYear3 ?? "-"}</td>
                  <td className="px-4 py-3">{selectedIndicator.budgetYear4 ?? "-"}</td>
                  <td className="px-4 py-3">{selectedIndicator.budgetYear5 ?? "-"}</td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Select the planning hierarchy to populate the implementation matrix.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
