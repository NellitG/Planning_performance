import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight, FileText, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/PageHeader";
import { useCreateMainProject, useMainProject, qk } from "@/hooks/useProjectsApi";
import { useFundingAgencies, useFundingTypes } from "@/hooks/useUserManagementApi";
import type { MainProject, MainProjectDocument } from "@/utils/types";
import { api } from "@/utils/apiClient";
import { INITIAL_WIZARD_DATA, type LocationEntry, type WizardData } from "./wizard/types";
import Step7ProjectLocations from "./wizard/Step7ProjectLocations";

const STEPS = [
  "Project Documents",
  "Budget and Funding Sources",
  "Project Objectives",
  "Project Timeline",
  "Project Location",
];
const DOCUMENT_TYPES: MainProjectDocument["documentType"][] = ["Project Proposal", "MOU / Agreement"];

interface FundingEntry {
  sourceName: string;
  fundingAgencyId: string;
  fundingTypeId: string;
  amount: string;
}

interface DocumentDraft {
  key: string;
  title: string;
  documentType: MainProjectDocument["documentType"];
  files: File[];
}

interface ImplementationForm {
  projectBudget: string;
  fundingSources: FundingEntry[];
  background: string;
  projectObjectives: string;
  startDate: string;
  endDate: string;
  locations: LocationEntry[];
}

const EMPTY_FORM: ImplementationForm = {
  projectBudget: "",
  fundingSources: [],
  background: "",
  projectObjectives: "",
  startDate: "",
  endDate: "",
  locations: [],
};

function mapFundingSources(project: MainProject): FundingEntry[] {
  return (project.fundingSources || []).map((source) => ({
    sourceName: source.sourceName,
    fundingAgencyId: source.fundingAgencyId,
    fundingTypeId: source.fundingTypeId,
    amount: String(source.amount ?? ""),
  }));
}

function fundingSourcesAreValid(sources: FundingEntry[]) {
  return sources.every((source) => {
    const hasValue = source.sourceName.trim() || source.fundingAgencyId || source.fundingTypeId || source.amount;
    return !hasValue || (
      source.sourceName.trim()
      && source.fundingAgencyId
      && source.fundingTypeId
      && source.amount !== ""
      && Number.isFinite(Number(source.amount))
      && Number(source.amount) >= 0
    );
  });
}

function MainProjectImplementation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isCreate = !id;
  const [mainProjectName, setMainProjectName] = useState("");
  const [form, setForm] = useState<ImplementationForm>(EMPTY_FORM);
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pendingDocuments, setPendingDocuments] = useState<DocumentDraft[]>([]);
  const [documentEdits, setDocumentEdits] = useState<Record<string, { title: string; documentType: MainProjectDocument["documentType"] }>>({});

  const { data: project, isLoading: isLoadingProject, isError: projectError } = useMainProject(id);
  const createMainProject = useCreateMainProject();
  const { data: agencies = [], isLoading: agenciesLoading, isError: agenciesError } = useFundingAgencies();
  const { data: fundingTypes = [], isLoading: typesLoading, isError: typesError } = useFundingTypes();
  const documentsKey = ["mainProjectDocuments", id];
  const {
    data: documents = [],
    isLoading: documentsLoading,
    isError: documentsError,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: documentsKey,
    queryFn: () => api.get<MainProjectDocument[]>(`/main-project-documents/?main_project=${id}`),
    enabled: Boolean(id),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!project) return;
    setMainProjectName(project.name);
    setForm({
      projectBudget: project.projectBudget == null ? "" : String(project.projectBudget),
      fundingSources: mapFundingSources(project),
      background: project.background || "",
      projectObjectives: project.projectObjectives || "",
      startDate: project.startDate || "",
      endDate: project.endDate || "",
      locations: (project.locations || []).map((location) => ({
        county: location.county,
        countyId: location.countyId,
        svgId: location.svgId,
        subCounty: "",
        ward: "",
      })),
    });
    setStep(Math.min(Math.max(project.implementationStep || 1, 1), STEPS.length));
  }, [project]);

  const fundingTotal = useMemo(
    () => form.fundingSources.reduce((sum, source) => sum + (Number(source.amount) || 0), 0),
    [form.fundingSources],
  );
  const mapData: WizardData = {
    ...INITIAL_WIZARD_DATA,
    mainProjectId: id || null,
    locations: form.locations,
  };
  const updateForm = (updates: Partial<ImplementationForm>) => {
    setPageError("");
    setForm((current) => ({ ...current, ...updates }));
  };

  const create = async () => {
    const name = mainProjectName.trim();
    if (!name) {
      setPageError("Enter a Main Project name.");
      return;
    }
    setIsSaving(true);
    try {
      const created = await createMainProject.mutateAsync({ name });
      navigate(`/projects/main/${created.id}/implementation`, { replace: true });
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "The Main Project could not be created.");
    } finally {
      setIsSaving(false);
    }
  };

  const syncDocuments = async () => {
    if (!id) throw new Error("Save the Main Project before uploading documents.");
    for (const document of documents) {
      const changes = documentEdits[document.id];
      if (changes && (
        changes.title !== document.title
        || changes.documentType !== document.documentType
      )) {
        await api.patch(`/main-project-documents/${document.id}/`, changes);
      }
    }
    for (const draft of pendingDocuments) {
      if (!draft.title.trim() || !draft.files.length) {
        throw new Error("Each new document needs a title and at least one file.");
      }
      const body = new FormData();
      body.append("mainProject", id);
      body.append("title", draft.title.trim());
      body.append("documentType", draft.documentType);
      draft.files.forEach((file) => body.append("files", file));
      const saved = await api.postForm<MainProjectDocument>("/main-project-documents/", body);
      if (String(saved.mainProject) !== String(id)
        || !saved.files.some((file) => file.available)) {
        throw new Error(`The uploaded document "${draft.title}" could not be verified.`);
      }
    }
    if (pendingDocuments.length) setPendingDocuments([]);
    setDocumentEdits({});
    const result = await api.get<MainProjectDocument[]>(`/main-project-documents/?main_project=${id}`);
    if (!result.some((document) => document.files.some((file) => file.available))) {
      throw new Error("Upload at least one available Main Project document before continuing.");
    }
    await refetchDocuments();
  };

  const validateStep = async (targetStep: number) => {
    if (step === 1 || targetStep === STEPS.length) {
      await syncDocuments();
    }
    if (step === 2 || targetStep === STEPS.length) {
      if (form.projectBudget === "" || !Number.isFinite(Number(form.projectBudget)) || Number(form.projectBudget) < 0) {
        throw new Error("Enter a valid, non-negative Main Project budget.");
      }
      if (!fundingSourcesAreValid(form.fundingSources)) {
        throw new Error("Complete every funding source row or remove the unfinished row.");
      }
    }
    if ((step === 3 || targetStep === STEPS.length) && (!form.background.trim() || !form.projectObjectives.trim())) {
      throw new Error("Enter the Main Project background and objectives.");
    }
    if (step === 4 || targetStep === STEPS.length) {
      if (!form.startDate || !form.endDate) throw new Error("Enter both Main Project dates.");
      if (form.endDate < form.startDate) throw new Error("End date cannot be earlier than start date.");
    }
    if (step === STEPS.length && form.locations.length === 0) {
      throw new Error("Select at least one county for the Main Project.");
    }
  };

  const persist = async (targetStep: number, complete = false) => {
    if (!id) throw new Error("The Main Project has not been created.");
    const sourcePayload = form.fundingSources
      .filter((source) => source.sourceName.trim() || source.fundingAgencyId || source.fundingTypeId || source.amount)
      .map((source) => ({
        sourceName: source.sourceName.trim(),
        fundingAgencyId: Number(source.fundingAgencyId),
        fundingTypeId: Number(source.fundingTypeId),
        amount: Number(source.amount),
      }));
    await api.patch(`/main-projects/${id}/`, {
      projectBudget: form.projectBudget === "" ? null : Number(form.projectBudget),
      fundingSources: sourcePayload,
      background: form.background,
      projectObjectives: form.projectObjectives,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      locationCountyIds: form.locations.map((location) => Number(location.countyId)).filter(Number.isFinite),
      implementationStep: targetStep,
      implementationComplete: complete,
    });
    await queryClient.invalidateQueries({ queryKey: qk.mainProjects });
    await queryClient.invalidateQueries({ queryKey: ["mainProject", id] });
  };

  const continueStep = async () => {
    const next = Math.min(step + 1, STEPS.length);
    setIsSaving(true);
    setPageError("");
    try {
      await validateStep(next);
      await persist(next);
      setStep(next);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to save Main Project implementation.");
    } finally {
      setIsSaving(false);
    }
  };

  const goBack = async () => {
    setIsSaving(true);
    setPageError("");
    try {
      if (step === 2 && !fundingSourcesAreValid(form.fundingSources)) {
        throw new Error("Complete every funding source row or remove the unfinished row before leaving this step.");
      }
      await persist(Math.max(step - 1, 1));
      setStep((current) => Math.max(current - 1, 1));
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to save Main Project implementation.");
    } finally {
      setIsSaving(false);
    }
  };

  const completeImplementation = async () => {
    setIsSaving(true);
    setPageError("");
    try {
      await validateStep(STEPS.length);
      await persist(STEPS.length, true);
      toast.success("Main Project implementation completed.");
      navigate(`/projects/main/${id}`);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to complete Main Project implementation.");
    } finally {
      setIsSaving(false);
    }
  };

  const addFundingSource = () => updateForm({
    fundingSources: [
      ...form.fundingSources,
      { sourceName: "", fundingAgencyId: "", fundingTypeId: "", amount: "" },
    ],
  });
  const updateFundingSource = (index: number, changes: Partial<FundingEntry>) => updateForm({
    fundingSources: form.fundingSources.map((source, sourceIndex) =>
      sourceIndex === index ? { ...source, ...changes } : source,
    ),
  });
  const removeFundingSource = (index: number) => updateForm({
    fundingSources: form.fundingSources.filter((_source, sourceIndex) => sourceIndex !== index),
  });

  const addDocumentDraft = () => setPendingDocuments((current) => [
    ...current,
    {
      key: `${Date.now()}-${current.length}`,
      title: "",
      documentType: DOCUMENT_TYPES[0],
      files: [],
    },
  ]);
  const updateDocumentDraft = (key: string, changes: Partial<DocumentDraft>) => {
    setPendingDocuments((current) => current.map((document) =>
      document.key === key ? { ...document, ...changes } : document,
    ));
  };
  const deleteDocument = async (documentId: string) => {
    try {
      await api.del(`/main-project-documents/${documentId}/`);
      await queryClient.invalidateQueries({ queryKey: documentsKey });
      toast.success("Main Project document removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove document.");
    }
  };

  if (isCreate) {
    return <div className="space-y-6">
      <PageHeader title="Register Main Project" description="Create the parent project before starting its implementation workflow." />
      <div className="max-w-2xl space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        <Label htmlFor="main-project-name">Main Project Name</Label>
        <Input id="main-project-name" value={mainProjectName} onChange={(event) => setMainProjectName(event.target.value)} />
        {pageError && <p className="text-sm text-red-700">{pageError}</p>}
        <Button onClick={create} disabled={isSaving}>
          {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" />}
          Create Main Project and Continue
        </Button>
      </div>
    </div>;
  }

  if (isLoadingProject || documentsLoading) return <div className="p-8 text-sm text-muted-foreground">Loading Main Project implementation…</div>;
  if (projectError || !project) return <div className="p-8 text-sm text-red-700">The Main Project implementation could not be loaded.</div>;

  return <div className="space-y-6">
    <div className="flex items-start gap-3">
      <Button asChild size="sm" variant="outline"><Link to={`/projects/main/${id}`}><ArrowLeft className="h-4 w-4" /> Main Project</Link></Button>
      <div className="min-w-0 flex-1">
        <PageHeader title={`Implement: ${project.name}`} description={`Step ${step} of ${STEPS.length} — ${STEPS[step - 1]}`} />
        <div className="mt-4 flex flex-wrap gap-2">
          {STEPS.map((label, index) => (
            <Button
              key={label}
              type="button"
              size="sm"
              variant={step === index + 1 ? "default" : "outline"}
              onClick={() => setStep(index + 1)}
              disabled={isSaving}
            >
              {index + 1}. {label}
            </Button>
          ))}
        </div>
      </div>
    </div>

    {step === 1 && <section className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="font-semibold">Project Documents</h2><p className="text-sm text-muted-foreground">Upload proposal or agreement files for {project.name}.</p></div>
        <Button type="button" variant="outline" onClick={addDocumentDraft}><Plus className="h-4 w-4" /> Add Document</Button>
      </div>
      {documentsError && <p className="text-sm text-red-700">Documents could not be loaded. Reload the page to retry.</p>}
      {documents.map((document) => {
        const edit = documentEdits[document.id] || { title: document.title, documentType: document.documentType };
        return <div key={document.id} className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_220px_auto]">
          <Input aria-label="Document title" value={edit.title} onChange={(event) => setDocumentEdits((current) => ({
            ...current,
            [document.id]: { ...edit, title: event.target.value },
          }))} />
          <select aria-label="Document type" value={edit.documentType} onChange={(event) => setDocumentEdits((current) => ({
            ...current,
            [document.id]: { ...edit, documentType: event.target.value as MainProjectDocument["documentType"] },
          }))} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            {DOCUMENT_TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
          <Button type="button" variant="ghost" className="text-red-600" onClick={() => deleteDocument(document.id)}><Trash2 className="h-4 w-4" /> Remove</Button>
          <div className="md:col-span-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {document.files.map((file) => file.available && file.fileUrl
              ? <a key={file.id} className="inline-flex items-center gap-1 text-primary underline" href={file.fileUrl} target="_blank" rel="noreferrer"><FileText className="h-3.5 w-3.5" />{file.name}</a>
              : <span key={file.id}>{file.name} (unavailable)</span>)}
            {!document.files.length && <span>No file uploaded.</span>}
          </div>
        </div>;
      })}
      {pendingDocuments.map((document) => <div key={document.key} className="grid gap-3 rounded-lg border border-dashed p-4 md:grid-cols-[1fr_220px_1fr_auto]">
        <Input aria-label="Document title" placeholder="Document title" value={document.title} onChange={(event) => updateDocumentDraft(document.key, { title: event.target.value })} />
        <select aria-label="Document type" value={document.documentType} onChange={(event) => updateDocumentDraft(document.key, { documentType: event.target.value as MainProjectDocument["documentType"] })} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          {DOCUMENT_TYPES.map((type) => <option key={type}>{type}</option>)}
        </select>
        <Input type="file" multiple onChange={(event) => updateDocumentDraft(document.key, { files: Array.from(event.target.files || []) })} />
        <Button type="button" variant="ghost" className="text-red-600" onClick={() => setPendingDocuments((current) => current.filter((entry) => entry.key !== document.key))}><Trash2 className="h-4 w-4" /></Button>
        {!!document.files.length && <p className="md:col-span-4 text-xs text-muted-foreground">{document.files.map((file) => file.name).join(", ")}</p>}
      </div>)}
      {!documents.length && !pendingDocuments.length && <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No Main Project documents have been added.</p>}
    </section>}

    {step === 2 && <section className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="font-semibold">Project Budget and Funding Sources</h2>
      <div className="max-w-sm space-y-2"><Label htmlFor="project-budget">Project Budget</Label><Input id="project-budget" type="number" min="0" step="0.01" value={form.projectBudget} onChange={(event) => updateForm({ projectBudget: event.target.value })} /></div>
      <div className="flex items-center justify-between gap-3"><h3 className="font-medium">Funding Sources</h3><Button type="button" variant="outline" onClick={addFundingSource}><Plus className="h-4 w-4" /> Add Funding Source</Button></div>
      {agenciesError || typesError ? <p className="text-sm text-red-700">Funding reference data could not be loaded. Refresh and try again.</p> : null}
      {(agenciesLoading || typesLoading) && <p className="text-sm text-muted-foreground">Loading funding reference data…</p>}
      {form.fundingSources.map((source, index) => <div key={index} className="grid gap-3 rounded-lg border p-4 md:grid-cols-4">
        <Input aria-label="Source Name" placeholder="Source Name" value={source.sourceName} onChange={(event) => updateFundingSource(index, { sourceName: event.target.value })} />
        <select aria-label="Funding Agency" value={source.fundingAgencyId} onChange={(event) => updateFundingSource(index, { fundingAgencyId: event.target.value })} disabled={agenciesLoading || agenciesError} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">Select Funding Agency</option>{agencies.filter((agency) => agency.active).map((agency) => <option key={agency.id} value={agency.id}>{agency.name}</option>)}
        </select>
        <select aria-label="Funding Type" value={source.fundingTypeId} onChange={(event) => updateFundingSource(index, { fundingTypeId: event.target.value })} disabled={typesLoading || typesError} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">Select Funding Type</option>{fundingTypes.filter((type) => type.active).map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
        </select>
        <div className="flex gap-2"><Input aria-label="Funding Amount" type="number" min="0" step="0.01" placeholder="Amount (KES)" value={source.amount} onChange={(event) => updateFundingSource(index, { amount: event.target.value })} /><Button type="button" variant="ghost" aria-label="Remove funding source" className="text-red-600" onClick={() => removeFundingSource(index)}><Trash2 className="h-4 w-4" /></Button></div>
      </div>)}
      <p className="text-sm font-medium">Total Funding: KES {new Intl.NumberFormat().format(fundingTotal)}</p>
    </section>}

    {step === 3 && <section className="grid gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="font-semibold">Project Objectives</h2>
      <div className="space-y-2"><Label htmlFor="main-project-background">Background</Label><Textarea id="main-project-background" rows={6} value={form.background} onChange={(event) => updateForm({ background: event.target.value })} /></div>
      <div className="space-y-2"><Label htmlFor="main-project-objectives">Objectives</Label><Textarea id="main-project-objectives" rows={6} value={form.projectObjectives} onChange={(event) => updateForm({ projectObjectives: event.target.value })} /></div>
    </section>}

    {step === 4 && <section className="grid gap-4 rounded-xl border border-border bg-card p-6 shadow-sm md:grid-cols-2">
      <h2 className="font-semibold md:col-span-2">Project Timeline</h2>
      <div className="space-y-2"><Label htmlFor="main-project-start">Start Date</Label><Input id="main-project-start" type="date" value={form.startDate} onChange={(event) => updateForm({ startDate: event.target.value })} /></div>
      <div className="space-y-2"><Label htmlFor="main-project-end">End Date</Label><Input id="main-project-end" type="date" min={form.startDate || undefined} value={form.endDate} onChange={(event) => updateForm({ endDate: event.target.value })} /></div>
    </section>}

    {step === 5 && <Step7ProjectLocations
      data={mapData}
      onChange={(updates) => updateForm({ locations: updates.locations || [] })}
      onNext={completeImplementation}
      onBack={goBack}
      isSaving={isSaving}
      countyOnly
    />}

    {pageError && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{pageError}</p>}
    {step < 5 && <div className="flex justify-between">
      <Button type="button" variant="outline" onClick={goBack} disabled={isSaving || step === 1}><ChevronLeft className="h-4 w-4" /> Back</Button>
      <Button type="button" onClick={continueStep} disabled={isSaving || (step === 2 && (agenciesError || typesError))} className="bg-green-700 text-white">
        {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" />} Save & Continue <ChevronRight className="h-4 w-4" />
      </Button>
    </div>}
    {step === 5 && !isSaving && <p className="text-right text-xs text-muted-foreground">Saving implementation will enable Project Title registration.</p>}
    {isSaving && step === 5 && <p className="text-right text-xs text-muted-foreground">Saving Main Project implementation…</p>}
  </div>;
}

export default MainProjectImplementation;
