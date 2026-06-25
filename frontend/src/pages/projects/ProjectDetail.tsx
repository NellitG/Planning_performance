import { Link, useNavigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Upload,
  X,
  Target,
  Boxes,
  Calendar,
  CheckSquare,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import {
  useProject,
  useComponents,
  useObjectives,
  useStrategies,
  useKeyActivities,
  useExpectedOutputs,
  useOutputIndicators,
  useProjectDocuments,
  useUploadDocument,
  useDeleteDocument,
  useProjectMapping,
  useSaveMapping,
} from "@/hooks/useProjectsApi";
import type { Project } from "@/utils/types";

const ACCEPTED = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg";
const ACCEPTED_DISPLAY = "PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (max 25 MB)";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function StepBar({ step }: { step: number }) {
  const steps = [
    { n: 1, label: "Document Upload" },
    { n: 2, label: "Strategy Mapping" },
  ];
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2 transition-colors",
                step === s.n
                  ? "bg-primary border-primary text-white"
                  : step > s.n
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-muted border-border text-muted-foreground",
              )}
            >
              {step > s.n ? <CheckCircle2 className="h-4 w-4" /> : s.n}
            </div>
            <span className={cn("text-sm font-medium", step === s.n ? "text-foreground" : "text-muted-foreground")}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn("mx-4 h-px w-16 transition-colors", step > 1 ? "bg-primary" : "bg-border")} />
          )}
        </div>
      ))}
    </div>
  );
}

function ProjectSummaryCard({ project }: { project: Project }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
          {project.logo}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold text-foreground">{project.name}</h2>
            <StatusBadge status={project.status} />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{project.id}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Start: {project.startDate}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />End: {project.endDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PendingUpload {
  id: string;
  name: string;
  size: number;
}

function Step1({ project, onNext }: { project: Project; onNext: () => void }) {
  const { data: documents = [] } = useProjectDocuments(project.id);
  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [showError, setShowError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((fileList: FileList) => {
    setShowError(false);
    Array.from(fileList).forEach((file) => {
      const id = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;
      setPending((prev) => [...prev, { id, name: file.name, size: file.size }]);
      uploadDoc.mutateAsync({ projectId: project.id, file })
        .catch(() => toast.error(`Failed to upload ${file.name}`))
        .finally(() => setPending((prev) => prev.filter((p) => p.id !== id)));
    });
  }, [project.id, uploadDoc]);

  const removeFile = async (id: string) => {
    try {
      await deleteDoc.mutateAsync({ id, projectId: project.id });
    } catch {
      toast.error("Failed to remove document");
    }
  };

  const hasCompleted = documents.length > 0;

  const handleNext = () => {
    if (!hasCompleted) { setShowError(true); return; }
    onNext();
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-1 text-base font-semibold">Project Documents</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Upload all relevant project documents. At least one document is required to proceed.
        </p>
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">{ACCEPTED_DISPLAY}</span>
          <Button size="sm" onClick={() => inputRef.current?.click()} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Upload className="h-4 w-4" /> Select Files
          </Button>
        </div>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:border-primary/60 hover:bg-primary/5",
          )}
        >
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Upload className="h-6 w-6" />
          </div>
          <div className="text-sm font-medium text-foreground">Drop files here or click to browse</div>
          <div className="text-xs text-muted-foreground">Supported: Project proposal, concept note, approval documents, supporting docs</div>
          <input ref={inputRef} type="file" multiple accept={ACCEPTED} className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        </div>
        {showError && <p className="mt-2 text-sm text-red-600 font-medium">Please upload at least one document before proceeding.</p>}
        {(documents.length > 0 || pending.length > 0) && (
          <ul className="mt-4 space-y-2">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{d.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatSize(d.size)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-green-600">Uploaded successfully</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <button onClick={(e) => { e.stopPropagation(); removeFile(d.id); }} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-red-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
            {pending.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{p.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatSize(p.size)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-1/2 animate-pulse bg-primary" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex justify-end">
        <Button
          onClick={handleNext}
          className={cn("gap-2", hasCompleted ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed")}
        >
          Next Step <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Step2({ project, onBack }: { project: Project; onBack: () => void }) {
  const navigate = useNavigate();
  const { data: kras = [] } = useComponents();
  const { data: allObjectives = [] } = useObjectives();
  const { data: allStrategies = [] } = useStrategies();
  const { data: allKeyActivities = [] } = useKeyActivities();
  const { data: allExpectedOutputs = [] } = useExpectedOutputs();
  const { data: allOutputIndicators = [] } = useOutputIndicators();
  const { data: mapping = null } = useProjectMapping(project.id);
  const saveMapping = useSaveMapping();

  const [selectedKraIds, setSelectedKraIds] = useState<string[]>([]);
  const [selectedStrategyIds, setSelectedStrategyIds] = useState<string[]>([]);
  const [selectedKeyActivityIds, setSelectedKeyActivityIds] = useState<string[]>([]);
  const [selectedExpectedOutputIds, setSelectedExpectedOutputIds] = useState<string[]>([]);
  const [selectedOutputIndicatorIds, setSelectedOutputIndicatorIds] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (mapping) {
      setSelectedKraIds(mapping.kraIds || []);
      setSelectedStrategyIds(mapping.strategyIds || []);
      setSelectedKeyActivityIds(mapping.keyActivityIds || []);
      setSelectedExpectedOutputIds(mapping.expectedOutputIds || []);
      setSelectedOutputIndicatorIds(mapping.outputIndicatorIds || []);
      setSaved(true);
    }
  }, [mapping]);

  const objectivesByKra = useMemo(() => {
    const m: Record<string, typeof allObjectives> = {};
    allObjectives.forEach((o) => { if (!m[o.componentId]) m[o.componentId] = []; m[o.componentId].push(o); });
    return m;
  }, [allObjectives]);

  const strategiesByObj = useMemo(() => {
    const m: Record<string, typeof allStrategies> = {};
    allStrategies.forEach((s) => { if (!m[s.objectiveId]) m[s.objectiveId] = []; m[s.objectiveId].push(s); });
    return m;
  }, [allStrategies]);

  const keyActsByStrategy = useMemo(() => {
    const m: Record<string, typeof allKeyActivities> = {};
    allKeyActivities.forEach((a) => { if (!m[a.strategyId]) m[a.strategyId] = []; m[a.strategyId].push(a); });
    return m;
  }, [allKeyActivities]);

  const expectedOutputsByKa = useMemo(() => {
    const m: Record<string, typeof allExpectedOutputs> = {};
    allExpectedOutputs.forEach((o) => { if (!o.keyActivityId) return; if (!m[o.keyActivityId]) m[o.keyActivityId] = []; m[o.keyActivityId].push(o); });
    return m;
  }, [allExpectedOutputs]);

  const outputIndicatorsByEo = useMemo(() => {
    const m: Record<string, typeof allOutputIndicators> = {};
    allOutputIndicators.forEach((i) => { if (!i.expectedOutputId) return; if (!m[i.expectedOutputId]) m[i.expectedOutputId] = []; m[i.expectedOutputId].push(i); });
    return m;
  }, [allOutputIndicators]);

  const toggleKra = (kraId: string) => {
    setSaved(false);
    const isChecking = !selectedKraIds.includes(kraId);
    if (isChecking) {
      setSelectedKraIds((p) => [...p, kraId]);
    } else {
      const kraStratIds = (objectivesByKra[kraId] || []).flatMap((o) => (strategiesByObj[o.id] || []).map((s) => s.id));
      const kraKaIds = kraStratIds.flatMap((sid) => (keyActsByStrategy[sid] || []).map((a) => a.id));
      const kraEoIds = kraKaIds.flatMap((kid) => (expectedOutputsByKa[kid] || []).map((e) => e.id));
      const kraOiIds = kraEoIds.flatMap((eoId) => (outputIndicatorsByEo[eoId] || []).map((i) => i.id));
      setSelectedKraIds((p) => p.filter((k) => k !== kraId));
      setSelectedStrategyIds((p) => p.filter((s) => !kraStratIds.includes(s)));
      setSelectedKeyActivityIds((p) => p.filter((a) => !kraKaIds.includes(a)));
      setSelectedExpectedOutputIds((p) => p.filter((e) => !kraEoIds.includes(e)));
      setSelectedOutputIndicatorIds((p) => p.filter((i) => !kraOiIds.includes(i)));
    }
  };

  const toggleStrategy = (stratId: string) => {
    setSaved(false);
    const isChecking = !selectedStrategyIds.includes(stratId);
    if (isChecking) {
      setSelectedStrategyIds((p) => [...p, stratId]);
    } else {
      const kaIds = (keyActsByStrategy[stratId] || []).map((a) => a.id);
      const eoIds = kaIds.flatMap((kid) => (expectedOutputsByKa[kid] || []).map((e) => e.id));
      const oiIds = eoIds.flatMap((eoId) => (outputIndicatorsByEo[eoId] || []).map((i) => i.id));
      setSelectedStrategyIds((p) => p.filter((s) => s !== stratId));
      setSelectedKeyActivityIds((p) => p.filter((a) => !kaIds.includes(a)));
      setSelectedExpectedOutputIds((p) => p.filter((e) => !eoIds.includes(e)));
      setSelectedOutputIndicatorIds((p) => p.filter((i) => !oiIds.includes(i)));
    }
  };

  const toggleKeyActivity = (kaId: string) => {
    setSaved(false);
    const isChecking = !selectedKeyActivityIds.includes(kaId);
    if (isChecking) {
      setSelectedKeyActivityIds((p) => [...p, kaId]);
    } else {
      const eoIds = (expectedOutputsByKa[kaId] || []).map((e) => e.id);
      const oiIds = eoIds.flatMap((eoId) => (outputIndicatorsByEo[eoId] || []).map((i) => i.id));
      setSelectedKeyActivityIds((p) => p.filter((a) => a !== kaId));
      setSelectedExpectedOutputIds((p) => p.filter((e) => !eoIds.includes(e)));
      setSelectedOutputIndicatorIds((p) => p.filter((i) => !oiIds.includes(i)));
    }
  };

  const toggleExpectedOutput = (eoId: string) => {
    setSaved(false);
    const isChecking = !selectedExpectedOutputIds.includes(eoId);
    const oiIds = (outputIndicatorsByEo[eoId] || []).map((i) => i.id);
    if (isChecking) {
      setSelectedExpectedOutputIds((p) => [...p, eoId]);
      setSelectedOutputIndicatorIds((p) => [...new Set([...p, ...oiIds])]);
    } else {
      setSelectedExpectedOutputIds((p) => p.filter((e) => e !== eoId));
      setSelectedOutputIndicatorIds((p) => p.filter((i) => !oiIds.includes(i)));
    }
  };

  const toggleOutputIndicator = (oiId: string) => {
    setSaved(false);
    setSelectedOutputIndicatorIds((p) =>
      p.includes(oiId) ? p.filter((i) => i !== oiId) : [...p, oiId],
    );
  };

  const handleSave = async () => {
    if (selectedKraIds.length === 0) { toast.error("Please select at least one Key Result Area"); return; }

    const objIds = allObjectives.filter((o) => selectedKraIds.includes(o.componentId)).map((o) => o.id);

    try {
      await saveMapping.mutateAsync({
        projectId: project.id,
        kraIds: selectedKraIds,
        objectiveIds: objIds,
        strategyIds: selectedStrategyIds,
        keyActivityIds: selectedKeyActivityIds,
        expectedOutputIds: selectedExpectedOutputIds,
        outputIndicatorIds: selectedOutputIndicatorIds,
      });

      toast.success("Project mapping saved successfully");
      navigate("/projects");
    } catch {
      toast.error("Failed to save project mapping");
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Strategy Mapping</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select KRAs to reveal the full planning hierarchy. Check strategies, key activities, expected outputs, and output indicators.
            </p>
          </div>
          {selectedKraIds.length > 0 && (
            <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-3 py-1 shrink-0">
              {selectedKraIds.length} KRA{selectedKraIds.length !== 1 ? "s" : ""} selected
            </span>
          )}
        </div>

        {kras.length === 0 ? (
          <div className="p-5">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              No Key Result Areas available.{" "}
              <Link to="/projects/components/new" className="underline font-medium">Create a KRA</Link> first.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {kras.map((kra) => {
              const isKraChecked = selectedKraIds.includes(kra.id);
              const kraObjs = objectivesByKra[kra.id] || [];

              return (
                <div key={kra.id}>
                  <button
                    type="button"
                    onClick={() => toggleKra(kra.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors",
                      isKraChecked ? "bg-primary/5" : "hover:bg-muted/30",
                    )}
                  >
                    {isKraChecked ? <CheckSquare className="h-4 w-4 shrink-0 text-primary" /> : <Square className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    <Boxes className="h-4 w-4 shrink-0 text-primary/70" />
                    <span className="font-semibold text-sm text-foreground">{kra.title}</span>
                  </button>

                  {isKraChecked && (
                    <div className="border-t border-border/40 bg-muted/10">
                      {kraObjs.length === 0 ? (
                        <p className="pl-12 py-3 text-xs text-muted-foreground italic">
                          No strategic objectives for this KRA.{" "}
                          <Link to="/projects/strategic-objectives/new" className="underline text-primary">Add one</Link>.
                        </p>
                      ) : (
                        <div className="ml-12 border-l-2 border-primary/20 my-2 mr-4 space-y-3 py-2">
                          <div className="flex items-center gap-1.5 pl-3 pb-0.5">
                            <Target className="h-3 w-3 text-primary/60" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Strategic Objectives</span>
                          </div>

                          {kraObjs.map((obj) => {
                            const objStrats = strategiesByObj[obj.id] || [];
                            return (
                              <div key={obj.id} className="pl-3 space-y-1.5">
                                <div className="flex items-start gap-2 py-0.5">
                                  <Target className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-600" />
                                  <span className="text-sm font-medium text-foreground">{obj.text}</span>
                                </div>

                                {objStrats.length === 0 ? (
                                  <p className="pl-5 text-xs text-muted-foreground italic">No strategies under this objective.</p>
                                ) : (
                                  <div className="pl-5 space-y-1">
                                    {objStrats.map((strat) => {
                                      const isStratChecked = selectedStrategyIds.includes(strat.id);
                                      const keyActs = keyActsByStrategy[strat.id] || [];

                                      return (
                                        <div key={strat.id}>
                                          <button
                                            type="button"
                                            onClick={() => toggleStrategy(strat.id)}
                                            className={cn(
                                              "w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                                              isStratChecked
                                                ? "border-emerald-300 bg-emerald-50/60 text-foreground"
                                                : "border-border bg-background hover:border-emerald-200 hover:bg-muted/20",
                                            )}
                                          >
                                            {isStratChecked ? <CheckSquare className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> : <Square className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                                            <span className="text-sm">{strat.text}</span>
                                          </button>

                                          {isStratChecked && (
                                            <div className="ml-4 mt-1.5 mb-2 border-l-2 border-gray-200 pl-3 space-y-1">
                                              <div className="flex items-center gap-1.5 pb-0.5">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-black">Key Activities</span>
                                              </div>

                                              {keyActs.length === 0 ? (
                                                <p className="text-xs text-muted-foreground italic pl-1">
                                                  No key activities.{" "}
                                                  <Link to="/projects/key-activities/new" className="underline text-primary">Add one</Link>.
                                                </p>
                                              ) : keyActs.map((ka) => {
                                                const isKaChecked = selectedKeyActivityIds.includes(ka.id);
                                                const eoList = expectedOutputsByKa[ka.id] || [];

                                                return (
                                                  <div key={ka.id}>
                                                    <button
                                                      type="button"
                                                      onClick={() => toggleKeyActivity(ka.id)}
                                                      className={cn(
                                                        "w-full flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-sm transition-colors",
                                                        isKaChecked ? "border-green-50 bg-green-50" : "border-border bg-background hover:border-blue-200 hover:bg-muted/20",
                                                      )}
                                                    >
                                                      {isKaChecked ? <CheckSquare className="h-3.5 w-3.5 shrink-0 text-blue-600" /> : <Square className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                                                      <span className="text-xs">{ka.text}</span>
                                                    </button>

                                                    {isKaChecked && (
                                                      <div className="ml-4 mt-1 mb-1.5 border-l-2 border-gray-200 pl-3 space-y-1">
                                                        <div className="flex items-center gap-1.5 pb-0.5">
                                                          <span className="text-[10px] font-bold uppercase tracking-widest text-black">Expected Outputs</span>
                                                        </div>

                                                        {eoList.length === 0 ? (
                                                          <p className="text-xs text-muted-foreground italic pl-1">
                                                            No expected outputs.{" "}
                                                            <Link to="/projects/expected-outputs/new" className="underline text-primary">Add one</Link>.
                                                          </p>
                                                        ) : eoList.map((eo) => {
                                                          const isEoChecked = selectedExpectedOutputIds.includes(eo.id);
                                                          const oiList = outputIndicatorsByEo[eo.id] || [];

                                                          return (
                                                            <div key={eo.id}>
                                                              <button
                                                                type="button"
                                                                onClick={() => toggleExpectedOutput(eo.id)}
                                                                className={cn(
                                                                  "w-full flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-sm transition-colors",
                                                                  isEoChecked ? "border-green-50 bg-green-50" : "border-border bg-background hover:border-green-200 hover:bg-muted/20",
                                                                )}
                                                              >
                                                                {isEoChecked ? <CheckSquare className="h-3.5 w-3.5 shrink-0 text-amber-600" /> : <Square className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                                                                <span className="text-xs">{eo.text}</span>
                                                              </button>

                                                              {isEoChecked && (
                                                                <div className="ml-4 mt-1 mb-1 border-l-2 border-gray-200 pl-3 space-y-1">
                                                                  <div className="flex items-center gap-1.5 pb-0.5">
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-black">Output Indicators</span>
                                                                  </div>

                                                                  {oiList.length === 0 ? (
                                                                    <p className="text-xs text-muted-foreground italic pl-1">
                                                                      No output indicators.{" "}
                                                                      <Link to="/projects/output-indicators/new" className="underline text-primary">Add one</Link>.
                                                                    </p>
                                                                  ) : oiList.map((oi) => {
                                                                    const isOiChecked = selectedOutputIndicatorIds.includes(oi.id);
                                                                    return (
                                                                      <button
                                                                        key={oi.id}
                                                                        type="button"
                                                                        onClick={() => toggleOutputIndicator(oi.id)}
                                                                        className={cn(
                                                                          "w-full flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-left transition-colors",
                                                                          isOiChecked ? "border-violet-200 bg-violet-50/50" : "border-border bg-background hover:border-violet-200 hover:bg-muted/20",
                                                                        )}
                                                                      >
                                                                        {isOiChecked ? <CheckSquare className="h-3.5 w-3.5 shrink-0 text-violet-600" /> : <Square className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                                                                        <span className="text-xs">{oi.text}</span>
                                                                      </button>
                                                                    );
                                                                  })}
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
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {saved && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Mapping saved successfully. The full planning hierarchy is linked to this project.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back to Step 1
        </Button>
        <Button
          onClick={handleSave}
          disabled={selectedKraIds.length === 0}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <CheckCircle2 className="h-4 w-4" /> Save Mapping
        </Button>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const { data: project, isLoading, isError } = useProject(id);

  useEffect(() => {
    if (!isLoading && (isError || !project)) {
      toast.error("Project not found");
      navigate("/projects");
    }
  }, [isLoading, isError, project, navigate]);

  if (!project) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Details"
        description="Complete the workflow to upload documents and map this project to your planning hierarchy."
        actions={
          <Button asChild variant="outline">
            <Link to="/projects"><ArrowLeft className="h-4 w-4" /> Back to Projects</Link>
          </Button>
        }
      />
      <ProjectSummaryCard project={project} />
      <div className="flex items-center justify-center py-2"><StepBar step={step} /></div>
      {step === 1 && <Step1 project={project} onNext={() => setStep(2)} />}
      {step === 2 && <Step2 project={project} onBack={() => setStep(1)} />}
    </div>
  );
}
