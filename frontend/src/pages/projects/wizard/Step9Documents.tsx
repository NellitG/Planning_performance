import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, FileCheck2, LoaderCircle, Plus, Trash2, Upload, X } from "lucide-react";
import { useRef } from "react";
import type { StepProps, DocumentEntry } from "./types";
import { DOCUMENT_TYPES } from "./data";

function DocumentRow({
  doc,
  index,
  onChange,
  onRemove,
}: {
  doc: DocumentEntry;
  index: number;
  onChange: (updates: Partial<DocumentEntry>) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    onChange({ files: [...doc.files, ...Array.from(fileList)] });
  };

  const removeFile = (idx: number) => {
    onChange({ files: doc.files.filter((_, i) => i !== idx) });
  };

  return (
    <div className="rounded-lg border border-border bg-background p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          <FileCheck2 className="h-3.5 w-3.5" /> Document {index + 1}
        </span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 px-2"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Document Title</Label>
          <Input
            value={doc.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="e.g. Project Concept Note"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Document Type</Label>
          <select
            value={doc.docType}
            onChange={(e) => onChange({ docType: e.target.value })}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">— Select Type —</option>
            {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs">Description</Label>
          <Textarea
            rows={2}
            value={doc.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Brief description of this document"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs">Files</Label>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" /> Add Files
            </Button>
            {doc.files.length === 0 && (
              <span className="text-xs text-muted-foreground">No files chosen</span>
            )}
          </div>
          {doc.files.length > 0 && (
            <ul className="space-y-1.5 pt-1">
              {doc.files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-1.5">
                  <span className="truncate text-xs text-foreground">{f.name} ({(f.size / 1024).toFixed(1)} KB)</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-red-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

interface Step9Props extends StepProps {
  onFinish?: () => void;
  isSubmitting?: boolean;
}

export default function Step9Documents({ data, onChange, onNext, onBack, onFinish, isSubmitting, isSaving }: Step9Props) {
  const addDoc = () => {
    onChange({
      documents: [
        ...data.documents,
        { title: "", docType: "", description: "", files: [] },
      ],
    });
  };

  const updateDoc = (index: number, updates: Partial<DocumentEntry>) => {
    const docs = data.documents.map((d, i) => (i === index ? { ...d, ...updates } : d));
    onChange({ documents: docs });
  };

  const removeDoc = (index: number) => {
    onChange({ documents: data.documents.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Project Documents</h2>
          <Button type="button" size="sm" onClick={addDoc} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Add Document
          </Button>
        </div>

        {data.documents.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <FileCheck2 className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No documents added yet. Click "Add Document" to upload project files.</p>
          </div>
        )}

        <div className="space-y-3">
          {data.documents.map((doc, i) => (
            <DocumentRow
              key={i}
              doc={doc}
              index={i}
              onChange={(updates) => updateDoc(i, updates)}
              onRemove={() => removeDoc(i)}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting || isSaving}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          onClick={onFinish ?? onNext}
          disabled={isSubmitting || isSaving}
          className="bg-green-700 text-primary-foreground"
        >
          {isSubmitting || isSaving ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : onFinish ? (
            <FileCheck2 className="h-4 w-4" />
          ) : null}
          {isSubmitting ? "Creating Project..." : isSaving ? "Saving..." : onFinish ? "Finish & Create" : "Save & Continue"}
          {!onFinish && <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
