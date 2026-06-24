import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronRight, Plus, Trash2, Upload, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

function Field({ label, ...props }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <Input {...props} />
    </div>
  );
}

interface SectionProps {
  index: number;
  title: string;
  children: React.ReactNode;
}

function Section({ index, title, children }: SectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--brand-green)] text-xs font-bold text-white">
            {index}
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

interface ActivityRow {
  id: string;
  output: string;
  activity: string;
  achievement: string;
}

export default function NewReport() {
  const [activities, setActivities] = useState<ActivityRow[]>([
    { id: crypto.randomUUID(), output: "", activity: "", achievement: "" },
  ]);
  const [allocated, setAllocated] = useState(0);
  const [received, setReceived] = useState(0);
  const [utilized, setUtilized] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const absorbed = useMemo(
    () => (received > 0 ? ((utilized / received) * 100).toFixed(1) : "0.0"),
    [received, utilized],
  );

  const addActivity = () =>
    setActivities((a) => [
      ...a,
      { id: crypto.randomUUID(), output: "", activity: "", achievement: "" },
    ]);
  const removeActivity = (id: string) =>
    setActivities((a) => (a.length > 1 ? a.filter((x) => x.id !== id) : a));

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setFiles((f) => [...f, ...Array.from(e.dataTransfer.files)]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Report submitted for review");
  };

  return (
    <>
      <div className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Dashboard</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/technical-reports" className="hover:text-foreground">Technical Reports</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">New Report</span>
      </div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Project Reporting Form</h1>
          <p className="text-sm text-muted-foreground">
            Generated from the official KALRO Project Reporting Template.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/technical-reports">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={submit} className="bg-[var(--brand-navy)] hover:opacity-90">
            Submit Report
          </Button>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <Section index={1} title="Project Information">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Quarter" placeholder="Q1" />
            <Field label="Financial Year" placeholder="2025/2026" />
            <Field label="Source of Fund" placeholder="GoK / Donor" />
            <Field label="Donor" placeholder="World Bank" />
            <Field label="Project" placeholder="Project name" />
            <Field label="Sub-Component" placeholder="Sub-component" />
            <Field label="Value Chain" placeholder="Dairy" />
            <Field label="Project Title" placeholder="Full title" />
          </div>
        </Section>

        <Section index={2} title="Strategic Alignment">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Key Result Area" />
            <Field label="Strategic Objective" />
            <Field label="Strategies" />
          </div>
        </Section>

        <Section index={3} title="Project Duration">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Start Date" type="date" />
            <Field label="End Date" type="date" />
            <Field label="Duration" placeholder="e.g. 36 months" />
          </div>
        </Section>

        <Section index={4} title="Team Information">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Lead Institute / Centre" />
            <Field label="Principal Investigator" />
            <Field label="Co-Principal Investigator" />
            <Field label="Address" />
            <Field label="Email" type="email" />
            <Field label="Telephone" type="tel" />
          </div>
        </Section>

        <Section index={5} title="Beneficiary Information">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Counties Targeted" />
            <Field label="Sub-county" />
            <Field label="Ward" />
            <Field label="Number of Beneficiaries" type="number" />
            <Field label="Women" type="number" />
            <Field label="Youths" type="number" />
            <Field label="VMGs" type="number" />
            <Field label="PWDs" type="number" />
          </div>
        </Section>

        <Section index={6} title="Project Progress">
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {activities.map((a, idx) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/20 p-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                    <Field label={`Output #${idx + 1}`} />
                    <Field label="Activity" />
                    <Field label="Achievement" />
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeActivity(a.id)}
                        disabled={activities.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <Button type="button" variant="outline" onClick={addActivity} className="gap-1.5">
              <Plus className="h-4 w-4" /> Add Activity Row
            </Button>
          </div>
        </Section>

        <Section index={7} title="Outcomes & Sustainability">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Expected outcomes</Label>
              <Textarea rows={4} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Achievements</Label>
              <Textarea rows={4} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Sustainability measures</Label>
              <Textarea rows={4} />
            </div>
          </div>
        </Section>

        <Section index={8} title="Financial Tracking">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Funds allocated (b)</Label>
              <Input type="number" value={allocated || ""} onChange={(e) => setAllocated(+e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Funds received</Label>
              <Input type="number" value={received || ""} onChange={(e) => setReceived(+e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Funds utilized (c)</Label>
              <Input type="number" value={utilized || ""} onChange={(e) => setUtilized(+e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Proportion absorbed (c/b × 100)</Label>
              <div className="grid h-9 place-items-center rounded-md border bg-muted/40 text-sm font-semibold text-[var(--brand-green)]">
                {absorbed}%
              </div>
            </div>
          </div>
        </Section>

        {[
          { i: 9, t: "Challenges & Corrective Actions" },
          { i: 10, t: "Lessons Learned" },
          { i: 11, t: "Recommendations" },
          { i: 12, t: "Way Forward" },
        ].map((s) => (
          <Section key={s.i} index={s.i} title={s.t}>
            <Textarea rows={4} placeholder={`Describe ${s.t.toLowerCase()}…`} />
          </Section>
        ))}

        <Section index={13} title="Publications">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`grid place-items-center rounded-lg border-2 border-dashed p-8 text-center transition ${
              dragOver ? "border-[var(--brand-green)] bg-green-50" : "border-muted-foreground/30"
            }`}
          >
            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
            <div className="text-sm font-medium">Drag &amp; drop publications here</div>
            <div className="text-xs text-muted-foreground">PDF, DOCX, PPTX up to 25 MB each</div>
            <label className="mt-3 inline-flex">
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setFiles((f) => [...f, ...Array.from(e.target.files ?? [])])}
              />
              <span className="cursor-pointer rounded-md bg-[var(--brand-navy)] px-3 py-1.5 text-xs font-medium text-white">
                Browse files
              </span>
            </label>
          </div>
          {files.length > 0 && (
            <ul className="mt-4 space-y-2">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2 text-sm">
                  <span className="truncate">{f.name}</span>
                  <button type="button" onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))}>
                    <X className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline">Save Draft</Button>
          <Button type="submit" className="bg-[var(--brand-navy)] hover:opacity-90">Submit Report</Button>
        </div>
      </form>
    </>
  );
}
