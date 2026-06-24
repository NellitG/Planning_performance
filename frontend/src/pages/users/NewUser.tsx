import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RoleOption {
  value: string;
  label: string;
}

const ROLES: RoleOption[] = [
  { value: "system_admin", label: "System Admin" },
  { value: "national_me", label: "National M&E" },
  { value: "high_level", label: "High Level" },
  { value: "business_logic", label: "Business Logic" },
  { value: "project_manager", label: "Project Manager" },
  { value: "department_head", label: "Department Head" },
  { value: "staff_user", label: "Staff User" },
];

const DEPARTMENTS = ["ICT", "M&E", "Planning", "Strategy", "Projects", "Research", "Finance", "Administration"];

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, error, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label}{required && <span className="ml-0.5 text-red-600">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

interface FormState {
  name: string;
  email: string;
  role: string;
  department: string;
  password: string;
  confirmPassword: string;
}

export default function NewUser() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    name: "", email: "", role: "staff_user", department: "", password: "", confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const update = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Partial<FormState> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email address";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 8) errs.password = "At least 8 characters";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("Please fix the errors before submitting");
      return;
    }
    toast.success("User created successfully");
    navigate("/user-management");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add New User"
        description="Create a new KALRO PPM system user account."
        actions={
          <Button asChild variant="outline">
            <Link to="/user-management"><ArrowLeft className="h-4 w-4" /> Back</Link>
          </Button>
        }
      />

      <form onSubmit={submit} className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">User Details</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Full Name" error={errors.name} required>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="John Doe" />
          </Field>
          <Field label="Email Address" error={errors.email} required>
            <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="john@kalro.go.ke" />
          </Field>
          <Field label="Role" required>
            <Select value={form.role} onValueChange={(v) => update("role", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Department">
            <Select value={form.department} onValueChange={(v) => update("department", v)}>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Password" error={errors.password} required>
            <Input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Min. 8 characters" />
          </Field>
          <Field label="Confirm Password" error={errors.confirmPassword} required>
            <Input type="password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} placeholder="Re-enter password" />
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/user-management")}>Cancel</Button>
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="h-4 w-4" /> Create User
          </Button>
        </div>
      </form>
    </div>
  );
}
