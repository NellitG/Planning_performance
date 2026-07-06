import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useComponents, useOutcomes } from "@/hooks/useProjectsApi";
import type { KRAComponent, Outcome, OutcomeIndicator } from "@/utils/types";

export default function OutcomeMatrix() {
  const { data: kras = [] } = useComponents();
  const { data: outcomes = [] } = useOutcomes();

  const [kraId, setKraId] = useState("");
  const [outcomeId, setOutcomeId] = useState("");
  const [indicatorId, setIndicatorId] = useState("");

  const filteredOutcomes = useMemo(() => outcomes.filter((item) => item.kraId === kraId), [outcomes, kraId]);
  const filteredIndicators = useMemo(() => {
    const selectedOutcome = filteredOutcomes.find((item) => item.id === outcomeId);
    return selectedOutcome?.indicators || [];
  }, [filteredOutcomes, outcomeId]);
  const selectedIndicator = filteredIndicators.find((item) => item.id === indicatorId) || null;

  return (
    <div className="space-y-6">
      <PageHeader title="Outcome Matrix" description="View baseline and target values for the selected outcome indicator." />

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Key Result Area</Label>
            <Select value={kraId} onValueChange={(value) => { setKraId(value); setOutcomeId(""); setIndicatorId(""); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select KRA" />
              </SelectTrigger>
              <SelectContent>
                {kras.map((kra: KRAComponent) => <SelectItem key={kra.id} value={kra.id}>{kra.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Outcome</Label>
            <Select value={outcomeId} onValueChange={(value) => { setOutcomeId(value); setIndicatorId(""); }} disabled={!kraId}>
              <SelectTrigger>
                <SelectValue placeholder={kraId ? "Select Outcome" : "Select KRA first"} />
              </SelectTrigger>
              <SelectContent>
                {filteredOutcomes.map((outcome: Outcome) => <SelectItem key={outcome.id} value={outcome.id}>{outcome.text}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Outcome Indicator</Label>
            <Select value={indicatorId} onValueChange={setIndicatorId} disabled={!outcomeId}>
              <SelectTrigger>
                <SelectValue placeholder={outcomeId ? "Select Outcome Indicator" : "Select Outcome first"} />
              </SelectTrigger>
              <SelectContent>
                {filteredIndicators.map((indicator: OutcomeIndicator) => <SelectItem key={indicator.id} value={indicator.id}>{indicator.text}</SelectItem>)}
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
                <th className="px-4 py-3">Baseline Value</th>
                <th className="px-4 py-3">Midterm Target</th>
                <th className="px-4 py-3">Endterm Target</th>
              </tr>
            </thead>
            <tbody>
              {selectedIndicator ? (
                <tr className="border-t border-border/60 bg-background/50">
                  <td className="px-4 py-3">{selectedIndicator.baselineValue ?? "-"}</td>
                  <td className="px-4 py-3">{selectedIndicator.midtermTarget ?? "-"}</td>
                  <td className="px-4 py-3">{selectedIndicator.endtermTarget ?? "-"}</td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Select the planning hierarchy to populate the outcome matrix.
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
