import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Pencil,
  Calendar,
  Boxes,
  Target,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  File,
  Image,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import {
  useProject,
  useComponents,
  useObjectives,
  useStrategies,
  useKeyActivities,
  useExpectedOutputs,
  useOutputIndicators,
  useProjectDocuments,
  useProjectMapping,
} from "@/hooks/useProjectsApi";
import type {
  KRAComponent,
  ProjectObjective,
  ProjectStrategy,
  KeyActivity,
  ExpectedOutput,
  OutputIndicator,
  ProjectDocument,
} from "@/utils/types";

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function fileExt(name = "") {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function isImage(name = "", type = "") {
  const ext = fileExt(name);
  return (
    ["png", "jpg", "jpeg", "gif", "webp", "bmp"].includes(ext) ||
    (!!type && type.startsWith("image/"))
  );
}

function isPdf(name = "", type = "") {
  return fileExt(name) === "pdf" || type === "application/pdf";
}

interface DocIconProps {
  name: string;
  type: string;
  className?: string;
}

function DocIcon({ name, type, className }: DocIconProps) {
  const ext = fileExt(name);
  if (isImage(name, type)) return <Image className={cn("text-blue-500", className)} />;
  if (isPdf(name, type)) return <FileText className={cn("text-red-500", className)} />;
  if (["xls", "xlsx"].includes(ext)) return <FileSpreadsheet className={cn("text-green-600", className)} />;
  if (["doc", "docx"].includes(ext)) return <FileText className={cn("text-blue-600", className)} />;
  return <File className={cn("text-muted-foreground", className)} />;
}

function DocumentCard({ doc }: { doc: ProjectDocument }) {
  const dataUrl = doc.fileUrl ?? null;
  const [lightbox, setLightbox] = useState(false);
  const img = isImage(doc.name, doc.type ?? "");
  const pdf = isPdf(doc.name, doc.type ?? "");

  const handleOpen = () => {
    if (!dataUrl) return;
    if (img) { setLightbox(true); return; }
    window.open(dataUrl, "_blank");
  };

  return (
    <>
      <div className="group rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div
          className={cn(
            "relative flex items-center justify-center bg-muted/40 border-b border-border",
            img && dataUrl ? "h-36 cursor-pointer" : "h-24",
          )}
          onClick={img && dataUrl ? () => setLightbox(true) : undefined}
        >
          {img && dataUrl ? (
            <img src={dataUrl} alt={doc.name} className="h-full w-full object-cover" />
          ) : pdf && dataUrl ? (
            <div className="flex flex-col items-center gap-1.5">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-red-50">
                <FileText className="h-6 w-6 text-red-500" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">PDF Document</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10">
                <DocIcon name={doc.name} type={doc.type ?? ""} className="h-6 w-6" />
              </div>
            </div>
          )}

          {dataUrl && (
            <button
              onClick={(e) => { e.stopPropagation(); handleOpen(); }}
              className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs text-white"
            >
              <ExternalLink className="h-3 w-3" /> View
            </button>
          )}
        </div>

        <div className="p-3">
          <p className="truncate text-sm font-medium text-foreground" title={doc.name}>
            {doc.name}
          </p>
          <div className="mt-1 flex items-center justify-between gap-1">
            <span className="text-xs text-muted-foreground">{formatSize(doc.size)}</span>
            <span className="text-xs text-muted-foreground">{doc.uploadedAt}</span>
          </div>
          {dataUrl && (
            <button
              onClick={handleOpen}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-background py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              {img ? "View Image" : pdf ? "Open PDF" : "Open File"}
            </button>
          )}
        </div>
      </div>

      {lightbox && dataUrl && img && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(false)}
        >
          <img
            src={dataUrl}
            alt={doc.name}
            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setLightbox(false)}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading: projectLoading, isError: projectError } = useProject(id);
  const { data: mapping = null } = useProjectMapping(id);
  const { data: documents = [] } = useProjectDocuments(id);
  const { data: allComponents = [] } = useComponents();
  const { data: allObjectives = [] } = useObjectives();
  const { data: allStrategies = [] } = useStrategies();
  const { data: allKeyActivities = [] } = useKeyActivities();
  const { data: allExpectedOutputs = [] } = useExpectedOutputs();
  const { data: allOutputIndicators = [] } = useOutputIndicators();

  useEffect(() => {
    if (!projectLoading && (projectError || !project)) {
      toast.error("Project not found");
      navigate("/projects");
    }
  }, [projectLoading, projectError, project, navigate]);

  const kras = useMemo<KRAComponent[]>(() => {
    if (!mapping) return [];
    const ids = mapping.kraIds || [];
    return allComponents.filter((c) => ids.includes(c.id));
  }, [mapping, allComponents]);

  const objectives = useMemo<ProjectObjective[]>(() => {
    if (!mapping) return [];
    const ids = mapping.objectiveIds || [];
    return allObjectives.filter((o) => ids.includes(o.id));
  }, [mapping, allObjectives]);

  const stratsByObj = useMemo<Record<string, ProjectStrategy[]>>(() => {
    if (!mapping) return {};
    const stratIds = mapping.strategyIds || [];
    const byObj: Record<string, ProjectStrategy[]> = {};
    objectives.forEach((o) => {
      byObj[o.id] = allStrategies.filter((s) => s.objectiveId === o.id && stratIds.includes(s.id));
    });
    return byObj;
  }, [mapping, objectives, allStrategies]);

  const keyActsByStrategy = useMemo<Record<string, KeyActivity[]>>(() => {
    if (!mapping) return {};
    const ids = mapping.keyActivityIds || [];
    const byStrat: Record<string, KeyActivity[]> = {};
    allKeyActivities.filter((a) => ids.includes(a.id)).forEach((a) => {
      if (!byStrat[a.strategyId]) byStrat[a.strategyId] = [];
      byStrat[a.strategyId].push(a);
    });
    return byStrat;
  }, [mapping, allKeyActivities]);

  const expectedOutputsByKa = useMemo<Record<string, ExpectedOutput[]>>(() => {
    if (!mapping) return {};
    const ids = mapping.expectedOutputIds || [];
    const byKa: Record<string, ExpectedOutput[]> = {};
    allExpectedOutputs.filter((e) => ids.includes(e.id)).forEach((e) => {
      if (!e.keyActivityId) return;
      if (!byKa[e.keyActivityId]) byKa[e.keyActivityId] = [];
      byKa[e.keyActivityId].push(e);
    });
    return byKa;
  }, [mapping, allExpectedOutputs]);

  const outputIndicatorsByEo = useMemo<Record<string, OutputIndicator[]>>(() => {
    if (!mapping) return {};
    const ids = mapping.outputIndicatorIds || [];
    const byEo: Record<string, OutputIndicator[]> = {};
    allOutputIndicators.filter((i) => ids.includes(i.id)).forEach((i) => {
      if (!i.expectedOutputId) return;
      if (!byEo[i.expectedOutputId]) byEo[i.expectedOutputId] = [];
      byEo[i.expectedOutputId].push(i);
    });
    return byEo;
  }, [mapping, allOutputIndicators]);

  const objsByKra = useMemo(() => {
    const m: Record<string, ProjectObjective[]> = {};
    objectives.forEach((o) => {
      if (!m[o.componentId]) m[o.componentId] = [];
      m[o.componentId].push(o);
    });
    return m;
  }, [objectives]);

  if (!project) return null;

  const isMapped = !!mapping;
  const effectiveStatus = isMapped ? "Active" : "Pending";
  const totalStrategies = Object.values(stratsByObj).reduce((a, v) => a + v.length, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Overview"
        description="View project details, uploaded documents and planning hierarchy."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/projects"><ArrowLeft className="h-4 w-4" /> Back</Link>
            </Button>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to={`/projects/${id}`}>
                <Pencil className="h-4 w-4" /> {isMapped ? "Edit Mapping" : "Start Workflow"}
              </Link>
            </Button>
          </div>
        }
      />

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
            {project.logo}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-bold text-foreground">{project.name}</h2>
              <StatusBadge status={effectiveStatus} />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{project.id}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Start: {project.startDate}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                End: {project.endDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {!isMapped && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Workflow not completed</p>
            <p className="text-xs text-amber-700 mt-0.5">
              This project has not been mapped to a component, strategic objectives, or strategies yet. Complete the 2-step workflow to activate it.
            </p>
            <Button asChild size="sm" className="mt-3 bg-amber-600 text-white hover:bg-amber-700">
              <Link to={`/projects/${id}`}>Start Workflow</Link>
            </Button>
          </div>
        </div>
      )}

      {documents.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <h3 className="font-semibold">Uploaded Documents</h3>
            <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {documents.length}
            </span>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {documents.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        </div>
      )}

      {isMapped && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Planning Hierarchy</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {[
                { label: "KRAs", val: kras.length, color: "text-primary bg-primary/10" },
                { label: "Objs", val: objectives.length, color: "text-emerald-700 bg-emerald-50" },
                { label: "Strats", val: totalStrategies, color: "text-slate-600 bg-slate-100" },
              ].map(({ label, val, color }) => (
                <span key={label} className={cn("text-xs font-semibold rounded-full px-2.5 py-0.5", color)}>
                  {val} {label}
                </span>
              ))}
            </div>
          </div>

          <div className="divide-y divide-border">
            {kras.length === 0 && (
              <p className="px-5 py-4 text-sm text-muted-foreground">No KRAs linked.</p>
            )}

            {kras.map((kra, kIdx) => {
              const kraObjs = objsByKra[kra.id] || [];
              return (
                <div key={kra.id} className="px-5 py-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary text-white text-xs font-bold">
                      {kIdx + 1}
                    </div>
                    <Boxes className="h-4 w-4 shrink-0 text-primary/70" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/60">Key Result Area</p>
                      <p className="font-bold text-primary text-sm">{kra.title}</p>
                    </div>
                  </div>

                  {kraObjs.length === 0 && (
                    <p className="pl-10 text-xs text-muted-foreground italic">No objectives linked.</p>
                  )}

                  <div className="ml-10 border-l-2 border-primary/20 pl-3 space-y-3">
                    {kraObjs.map((obj) => {
                      const strats = stratsByObj[obj.id] || [];
                      return (
                        <div key={obj.id} className="space-y-2">
                          <div className="flex items-start gap-2">
                            <Target className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-600" />
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Strategic Objective</p>
                              <p className="text-sm font-medium text-foreground">{obj.text}</p>
                            </div>
                          </div>

                          {strats.length > 0 && (
                            <div className="ml-5 border-l-2 border-emerald-200 pl-3 space-y-2">
                              {strats.map((s) => {
                                const kas = keyActsByStrategy[s.id] || [];
                                return (
                                  <div key={s.id} className="space-y-1.5">
                                    <div className="flex items-start gap-2">
                                      <GitBranch className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-500" />
                                      <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Strategy</p>
                                        <p className="text-sm text-foreground">{s.text}</p>
                                      </div>
                                    </div>

                                    {kas.length > 0 && (
                                      <div className="ml-5 border-l-2 border-gray-200 pl-3 space-y-1.5">
                                        {kas.map((ka) => {
                                          const eos = expectedOutputsByKa[ka.id] || [];
                                          return (
                                            <div key={ka.id} className="space-y-1">
                                              <div className="flex items-start gap-2">
                                                <div>
                                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">Key Activity</p>
                                                  <p className="text-xs text-foreground">{ka.text}</p>
                                                </div>
                                              </div>

                                              {eos.length > 0 && (
                                                <div className="ml-5 border-l-2 border-gray-200 pl-3 space-y-1">
                                                  {eos.map((eo) => {
                                                    const ois = outputIndicatorsByEo[eo.id] || [];
                                                    return (
                                                      <div key={eo.id} className="space-y-1">
                                                        <div className="flex items-start gap-2">
                                                          <div>
                                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">Expected Output</p>
                                                            <p className="text-xs text-foreground">{eo.text}</p>
                                                          </div>
                                                        </div>

                                                        {ois.length > 0 && (
                                                          <div className="ml-5 border-l-2 border-gray-200 pl-3 space-y-0.5">
                                                            {ois.map((oi) => (
                                                              <div key={oi.id} className="flex items-start gap-2">
                                                                <div>
                                                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-500">Indicator</p>
                                                                  <p className="text-xs text-foreground">{oi.text}</p>
                                                                </div>
                                                              </div>
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
                </div>
              );
            })}
          </div>

          {mapping && (
            <div className="border-t border-border px-5 py-3 flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
              Mapping saved · Last updated {mapping.savedAt}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
