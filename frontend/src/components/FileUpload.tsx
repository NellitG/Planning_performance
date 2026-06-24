import { useCallback, useRef, useState } from "react";
import { Upload, FileText, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPTED = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg";
const ACCEPTED_DISPLAY = "PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (max 25MB)";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  done: boolean;
}

interface FileUploadProps {
  title?: string;
  description?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function FileUpload({
  title = "Upload Documents",
  description = "Drag & drop project proposals, contracts and supporting documents.",
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((fileList: FileList) => {
    const incoming: UploadedFile[] = Array.from(fileList).map((f) => ({
      id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
      name: f.name,
      size: f.size,
      progress: 0,
      done: false,
    }));
    setFiles((prev) => [...incoming, ...prev]);
    incoming.forEach((file) => {
      const interval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) => {
            if (f.id !== file.id) return f;
            const next = Math.min(100, f.progress + Math.random() * 25 + 10);
            return { ...f, progress: next, done: next >= 100 };
          }),
        );
      }, 250);
      setTimeout(() => clearInterval(interval), 3000);
    });
  }, []);

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Button onClick={() => inputRef.current?.click()} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Upload className="h-4 w-4" /> Select files
        </Button>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
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
        <div className="text-xs text-muted-foreground">Accepted: {ACCEPTED_DISPLAY}</div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-foreground">{f.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatSize(f.size)}</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-all" style={{ width: `${f.progress}%` }} />
                </div>
              </div>
              {f.done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
              ) : (
                <button onClick={() => removeFile(f.id)} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
