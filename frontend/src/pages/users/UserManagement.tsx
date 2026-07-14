import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  type ManagedUser,
  type ManagedUserInput,
  type UserRoleKey,
  type ValueChain,
  type ValueChainInput,
  roleLabel,
  useCreateManagedUser,
  useCreateStrategicPlanDocument,
  useCreateValueChain,
  useDeleteManagedUser,
  useDeleteStrategicPlanDocument,
  useDeleteValueChain,
  useManagedUser,
  useManagedUsers,
  useStrategicPlanDocuments,
  useUpdateManagedUser,
  useUpdateStrategicPlanDocument,
  useUpdateValueChain,
  useValueChain,
  useValueChains,
} from "@/hooks/useUserManagementApi";

type SortDirection = "asc" | "desc";
type UserSortKey = "fullName" | "email" | "role" | "institute" | "status";
type ValueChainSortKey = "name" | "category" | "priority" | "projects" | "status";

const PAGE_SIZE = 8;
const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx", ".xls", ".xlsx"];

const ROLES: Array<{ value: UserRoleKey; label: string }> = [
  { value: "system_admin", label: "System Admin" },
  { value: "national_me", label: "National M&E" },
  { value: "high_level", label: "High Level" },
  { value: "business_logic", label: "Business Logic" },
  { value: "project_manager", label: "Project Manager" },
  { value: "department_head", label: "Department Head" },
  { value: "staff_user", label: "Staff User" },
];

const INSTITUTES = ["Headquarters", "ICT", "M&E", "Planning", "Strategy", "Projects", "Research", "Finance", "Administration"];

const emptyUserForm: ManagedUserInput = {
  fullName: "",
  email: "",
  role: "staff_user",
  institute: "",
  password: "",
  active: true,
};

const emptyValueChainForm: ValueChainInput = {
  name: "",
  category: "Crops",
  priority: "Medium",
  active: true,
};

function statusBadge(active: boolean) {
  return (
    <Badge variant={active ? "default" : "secondary"} className={active ? "bg-primary text-primary-foreground" : ""}>
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SortButton<T extends string>({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
}: {
  label: string;
  sortKey: T;
  activeKey: T;
  direction: SortDirection;
  onSort: (key: T) => void;
}) {
  const Icon = direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <button type="button" className="inline-flex items-center gap-1 font-medium" onClick={() => onSort(sortKey)}>
      {label}
      {activeKey === sortKey && <Icon className="h-3.5 w-3.5" />}
    </button>
  );
}

function LoadingState({ label = "Loading records..." }: { label?: string }) {
  return <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">{label}</div>;
}

function ErrorState({ label = "Unable to load data from the backend." }: { label?: string }) {
  return <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">{label}</div>;
}

function Pagination({
  page,
  total,
  current,
  onPage,
}: {
  page: number;
  total: number;
  current: number;
  onPage: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <div className="flex items-center justify-between border-t border-border p-4 text-sm">
      <span className="text-muted-foreground">
        {total === 0 ? "0" : `${(page - 1) * PAGE_SIZE + 1}-${(page - 1) * PAGE_SIZE + current}`} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <span className="text-muted-foreground">Page {page} / {totalPages}</span>
        <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => onPage(page + 1)}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ModuleTabs() {
  const location = useLocation();
  const tabs = [
    { label: "Users", to: "/user-management/users", match: "/user-management/users" },
    { label: "Development Partners", to: "/user-management/development-partners", match: "/user-management/development-partners" },
    { label: "Value Chains", to: "/user-management/value-chains", match: "/user-management/value-chains" },
    { label: "Reference Data", to: "/user-management/reference-data", match: "/user-management/reference-data" },
    { label: "Strategic Plan", to: "/user-management/strategic-plan", match: "/user-management/strategic-plan" },
    { label: "Audit Log", to: "/user-management/audit-log", match: "/user-management/audit-log" },
  ];

  return (
    <div className="overflow-x-auto rounded-md border bg-card p-1">
      <div className="flex min-w-max gap-1">
        {tabs.map((tab) => {
          const active = location.pathname.startsWith(tab.match);
          return (
            <Button
              key={tab.to}
              asChild
              variant={active ? "default" : "ghost"}
              className={active ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
            >
              <Link to={tab.to}>{tab.label}</Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="rounded-xl border bg-card p-10 text-center shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">This module will be implemented later.</p>
    </div>
  );
}

function UsersList() {
  const { data = [], isLoading, isError } = useManagedUsers();
  const deleteUser = useDeleteManagedUser();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: UserSortKey; direction: SortDirection }>({ key: "fullName", direction: "asc" });

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data
      .filter((user) => [user.fullName, user.email, roleLabel(user.role), user.institute, user.status].some((value) => value.toLowerCase().includes(q)))
      .sort((a, b) => {
        const av = sort.key === "role" ? roleLabel(a.role) : a[sort.key];
        const bv = sort.key === "role" ? roleLabel(b.role) : b[sort.key];
        return sort.direction === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
  }, [data, query, sort]);

  const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const changeSort = (key: UserSortKey) => setSort((current) => ({ key, direction: current.key === key && current.direction === "asc" ? "desc" : "asc" }));
  const handleDelete = async (id: string) => {
    try {
      await deleteUser.mutateAsync(id);
      toast.success("User deleted successfully");
      setDeleteId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    }
  };

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        description="List, search and manage registered system users from the Django backend."
        actions={
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/user-management/users/new"><Plus className="h-4 w-4" /> Add New User</Link>
          </Button>
        }
      />
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search users..." className="pl-9" />
          </div>
          <span className="text-sm text-muted-foreground">{sorted.length} user{sorted.length === 1 ? "" : "s"}</span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortButton label="Name" sortKey="fullName" activeKey={sort.key} direction={sort.direction} onSort={changeSort} /></TableHead>
                <TableHead><SortButton label="Email" sortKey="email" activeKey={sort.key} direction={sort.direction} onSort={changeSort} /></TableHead>
                <TableHead><SortButton label="Role" sortKey="role" activeKey={sort.key} direction={sort.direction} onSort={changeSort} /></TableHead>
                <TableHead><SortButton label="Institute" sortKey="institute" activeKey={sort.key} direction={sort.direction} onSort={changeSort} /></TableHead>
                <TableHead><SortButton label="Status" sortKey="status" activeKey={sort.key} direction={sort.direction} onSort={changeSort} /></TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">No users found.</TableCell>
                </TableRow>
              )}
              {pageItems.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{roleLabel(user.role)}</TableCell>
                  <TableCell>{user.institute}</TableCell>
                  <TableCell>{statusBadge(user.active)}</TableCell>
                  <TableCell className="text-right">
                    {deleteId === user.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-muted-foreground">Confirm delete?</span>
                        <Button size="sm" variant="destructive" disabled={deleteUser.isPending} onClick={() => handleDelete(user.id)}>Yes</Button>
                        <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>No</Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Button asChild size="sm" variant="ghost"><Link to={`/user-management/users/${user.id}`}><Eye className="h-4 w-4" /></Link></Button>
                        <Button asChild size="sm" variant="ghost"><Link to={`/user-management/users/${user.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button>
                        <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setDeleteId(user.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Pagination page={page} total={sorted.length} current={pageItems.length} onPage={setPage} />
      </div>
    </div>
  );
}

function UserFormPage({ mode }: { mode: "create" | "edit" }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: user, isLoading, isError } = useManagedUser(mode === "edit" ? id : undefined);
  const createUser = useCreateManagedUser();
  const updateUser = useUpdateManagedUser();
  const [form, setForm] = useState<ManagedUserInput>(emptyUserForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ManagedUserInput, string>>>({});

  useEffect(() => {
    if (mode === "edit" && user) {
      setForm({ fullName: user.fullName, email: user.email, role: user.role, institute: user.institute, password: "", active: user.active });
    }
  }, [mode, user]);

  const validate = () => {
    const next: Partial<Record<keyof ManagedUserInput, string>> = {};
    if (!form.fullName.trim()) next.fullName = "Full name is required";
    if (!form.email.trim()) next.email = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email address";
    if (!form.role) next.role = "Role is required";
    if (!form.institute) next.institute = "Institute is required";
    if (mode === "create" && !form.password) next.password = "Password is required";
    if (form.password && form.password.length < 8) next.password = "Password must be at least 8 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    try {
      if (mode === "create") {
        await createUser.mutateAsync(form);
        toast.success("User created successfully");
      } else {
        await updateUser.mutateAsync({ ...form, id: id! });
        toast.success("User updated successfully");
      }
      navigate("/user-management/users");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save user");
    }
  };

  if (mode === "edit" && isLoading) return <LoadingState label="Loading user..." />;
  if (mode === "edit" && isError) return <ErrorState label="Unable to load this user." />;

  const saving = createUser.isPending || updateUser.isPending;
  return (
    <form onSubmit={submit} className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Create User" : "Edit User"}
        description={mode === "create" ? "Create a backend-backed KALRO PPM user." : "Update this user account through the Django API."}
        actions={<Button asChild variant="outline"><Link to="/user-management/users"><ArrowLeft className="h-4 w-4" /> Back</Link></Button>}
      />
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full Name" error={errors.fullName} required>
            <Input value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} />
          </Field>
          <Field label="Email Address" error={errors.email} required>
            <Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          </Field>
          <Field label="Role" error={errors.role} required>
            <Select value={form.role} onValueChange={(value) => setForm((current) => ({ ...current, role: value as UserRoleKey }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ROLES.map((role) => <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Institute" error={errors.institute} required>
            <Select value={form.institute} onValueChange={(value) => setForm((current) => ({ ...current, institute: value }))}>
              <SelectTrigger><SelectValue placeholder="Select institute" /></SelectTrigger>
              <SelectContent>{INSTITUTES.map((institute) => <SelectItem key={institute} value={institute}>{institute}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Password" error={errors.password} required={mode === "create"}>
            <Input type="password" value={form.password || ""} placeholder={mode === "edit" ? "Leave blank to keep existing password" : "Minimum 8 characters"} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          </Field>
          <div className="flex items-end">
            <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
              <Checkbox checked={form.active} onCheckedChange={(checked) => setForm((current) => ({ ...current, active: Boolean(checked) }))} />
              Active User
            </label>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate("/user-management/users")}>Cancel</Button>
        <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90"><Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}</Button>
      </div>
    </form>
  );
}

function UserDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: user, isLoading, isError } = useManagedUser(id);
  const deleteUser = useDeleteManagedUser();
  const [confirm, setConfirm] = useState(false);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteUser.mutateAsync(id);
      toast.success("User deleted successfully");
      navigate("/user-management/users");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    }
  };

  if (isLoading) return <LoadingState label="Loading user..." />;
  if (isError || !user) return <ErrorState label="Unable to load this user." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.fullName}
        description="User details retrieved from the Django backend."
        actions={<Button asChild variant="outline"><Link to="/user-management/users"><ArrowLeft className="h-4 w-4" /> Back</Link></Button>}
      />
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <p><span className="font-medium">Email:</span> {user.email}</p>
          <p><span className="font-medium">Role:</span> {roleLabel(user.role)}</p>
          <p><span className="font-medium">Institute:</span> {user.institute}</p>
          <p><span className="font-medium">Status:</span> {user.status}</p>
          <p><span className="font-medium">Date Created:</span> {new Date(user.createdAt).toLocaleString()}</p>
          <p><span className="font-medium">Date Updated:</span> {new Date(user.updatedAt).toLocaleString()}</p>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90"><Link to={`/user-management/users/${user.id}/edit`}><Pencil className="h-4 w-4" /> Edit User</Link></Button>
        {confirm ? (
          <>
            <Button variant="destructive" disabled={deleteUser.isPending} onClick={handleDelete}>Confirm Delete</Button>
            <Button variant="outline" onClick={() => setConfirm(false)}>Cancel</Button>
          </>
        ) : (
          <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => setConfirm(true)}><Trash2 className="h-4 w-4" /> Delete User</Button>
        )}
      </div>
    </div>
  );
}

function ValueChainsList() {
  const { data = [], isLoading, isError } = useValueChains();
  const deleteValueChain = useDeleteValueChain();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: ValueChainSortKey; direction: SortDirection }>({ key: "name", direction: "asc" });

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data
      .filter((chain) => [chain.name, chain.category, chain.priority, String(chain.projects), chain.status].some((value) => value.toLowerCase().includes(q)))
      .sort((a, b) => {
        const av = a[sort.key];
        const bv = b[sort.key];
        if (typeof av === "number" && typeof bv === "number") return sort.direction === "asc" ? av - bv : bv - av;
        return sort.direction === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
  }, [data, query, sort]);

  const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const changeSort = (key: ValueChainSortKey) => setSort((current) => ({ key, direction: current.key === key && current.direction === "asc" ? "desc" : "asc" }));
  const handleDelete = async (id: string) => {
    try {
      await deleteValueChain.mutateAsync(id);
      toast.success("Value Chain deleted successfully");
      setDeleteId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete value chain");
    }
  };

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Value Chains"
        description="Manage configured Value Chains from the Django backend."
        actions={<Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90"><Link to="/user-management/value-chains/new"><Plus className="h-4 w-4" /> Create Value Chain</Link></Button>}
      />
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search value chains..." className="pl-9" />
          </div>
          <span className="text-sm text-muted-foreground">{sorted.length} value chain{sorted.length === 1 ? "" : "s"}</span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortButton label="Name" sortKey="name" activeKey={sort.key} direction={sort.direction} onSort={changeSort} /></TableHead>
                <TableHead><SortButton label="Category" sortKey="category" activeKey={sort.key} direction={sort.direction} onSort={changeSort} /></TableHead>
                <TableHead><SortButton label="Priority" sortKey="priority" activeKey={sort.key} direction={sort.direction} onSort={changeSort} /></TableHead>
                <TableHead><SortButton label="Projects" sortKey="projects" activeKey={sort.key} direction={sort.direction} onSort={changeSort} /></TableHead>
                <TableHead><SortButton label="Status" sortKey="status" activeKey={sort.key} direction={sort.direction} onSort={changeSort} /></TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 && <TableRow><TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">No value chains found.</TableCell></TableRow>}
              {pageItems.map((chain) => (
                <TableRow key={chain.id}>
                  <TableCell className="font-medium">{chain.name}</TableCell>
                  <TableCell>{chain.category}</TableCell>
                  <TableCell>{chain.priority}</TableCell>
                  <TableCell>{chain.projects}</TableCell>
                  <TableCell>{statusBadge(chain.active)}</TableCell>
                  <TableCell className="text-right">
                    {deleteId === chain.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-muted-foreground">Confirm delete?</span>
                        <Button size="sm" variant="destructive" disabled={deleteValueChain.isPending} onClick={() => handleDelete(chain.id)}>Yes</Button>
                        <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>No</Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Button asChild size="sm" variant="ghost"><Link to={`/user-management/value-chains/${chain.id}`}><Eye className="h-4 w-4" /></Link></Button>
                        <Button asChild size="sm" variant="ghost"><Link to={`/user-management/value-chains/${chain.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button>
                        <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setDeleteId(chain.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Pagination page={page} total={sorted.length} current={pageItems.length} onPage={setPage} />
      </div>
    </div>
  );
}

function ValueChainFormPage({ mode }: { mode: "create" | "edit" }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: chain, isLoading, isError } = useValueChain(mode === "edit" ? id : undefined);
  const createValueChain = useCreateValueChain();
  const updateValueChain = useUpdateValueChain();
  const [form, setForm] = useState<ValueChainInput>(emptyValueChainForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ValueChainInput, string>>>({});

  useEffect(() => {
    if (mode === "edit" && chain) {
      setForm({ name: chain.name, category: chain.category, priority: chain.priority, active: chain.active });
    }
  }, [mode, chain]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: Partial<Record<keyof ValueChainInput, string>> = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.category) next.category = "Category is required";
    if (!form.priority) next.priority = "Priority is required";
    setErrors(next);
    if (Object.keys(next).length) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    try {
      if (mode === "create") {
        await createValueChain.mutateAsync(form);
        toast.success("Value Chain created successfully");
      } else {
        await updateValueChain.mutateAsync({ ...form, id: id! });
        toast.success("Value Chain updated successfully");
      }
      navigate("/user-management/value-chains");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save value chain");
    }
  };

  if (mode === "edit" && isLoading) return <LoadingState label="Loading value chain..." />;
  if (mode === "edit" && isError) return <ErrorState label="Unable to load this value chain." />;

  const saving = createValueChain.isPending || updateValueChain.isPending;
  return (
    <form onSubmit={submit} className="space-y-6">
      <PageHeader
        title={mode === "create" ? "Create Value Chain" : "Edit Value Chain"}
        description="Persist Value Chain details through the Django REST API."
        actions={<Button asChild variant="outline"><Link to="/user-management/value-chains"><ArrowLeft className="h-4 w-4" /> Back</Link></Button>}
      />
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name" error={errors.name} required><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></Field>
          <Field label="Category" error={errors.category} required>
            <Select value={form.category} onValueChange={(value) => setForm((current) => ({ ...current, category: value as ValueChain["category"] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Crops">Crops</SelectItem><SelectItem value="Fisheries">Fisheries</SelectItem><SelectItem value="Livestock">Livestock</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label="Priority" error={errors.priority} required>
            <Select value={form.priority} onValueChange={(value) => setForm((current) => ({ ...current, priority: value as ValueChain["priority"] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent>
            </Select>
          </Field>
          <div className="flex items-end">
            <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
              <Checkbox checked={form.active} onCheckedChange={(checked) => setForm((current) => ({ ...current, active: Boolean(checked) }))} />
              Active
            </label>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate("/user-management/value-chains")}>Cancel</Button>
        <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90"><Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}</Button>
      </div>
    </form>
  );
}

function ValueChainDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: chain, isLoading, isError } = useValueChain(id);
  const deleteValueChain = useDeleteValueChain();
  const [confirm, setConfirm] = useState(false);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteValueChain.mutateAsync(id);
      toast.success("Value Chain deleted successfully");
      navigate("/user-management/value-chains");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete value chain");
    }
  };

  if (isLoading) return <LoadingState label="Loading value chain..." />;
  if (isError || !chain) return <ErrorState label="Unable to load this value chain." />;

  return (
    <div className="space-y-6">
      <PageHeader title={chain.name} description="Value Chain details retrieved from the Django backend." actions={<Button asChild variant="outline"><Link to="/user-management/value-chains"><ArrowLeft className="h-4 w-4" /> Back</Link></Button>} />
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <p><span className="font-medium">Category:</span> {chain.category}</p>
          <p><span className="font-medium">Priority:</span> {chain.priority}</p>
          <p><span className="font-medium">Projects:</span> {chain.projects}</p>
          <p><span className="font-medium">Status:</span> {chain.status}</p>
          <p><span className="font-medium">Date Created:</span> {new Date(chain.createdAt).toLocaleString()}</p>
          <p><span className="font-medium">Date Updated:</span> {new Date(chain.updatedAt).toLocaleString()}</p>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90"><Link to={`/user-management/value-chains/${chain.id}/edit`}><Pencil className="h-4 w-4" /> Edit</Link></Button>
        {confirm ? (
          <>
            <Button variant="destructive" disabled={deleteValueChain.isPending} onClick={handleDelete}>Confirm Delete</Button>
            <Button variant="outline" onClick={() => setConfirm(false)}>Cancel</Button>
          </>
        ) : (
          <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => setConfirm(true)}><Trash2 className="h-4 w-4" /> Delete</Button>
        )}
      </div>
    </div>
  );
}

function StrategicPlanPage() {
  const { data = [], isLoading, isError } = useStrategicPlanDocuments();
  const createDocument = useCreateStrategicPlanDocument();
  const updateDocument = useUpdateStrategicPlanDocument();
  const deleteDocument = useDeleteStrategicPlanDocument();
  const latest = data[0] ?? null;
  const [title, setTitle] = useState("Strategic Plan Implementation Matrix");
  const [uploadedBy, setUploadedBy] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (latest) {
      setTitle(latest.documentTitle);
      setUploadedBy(latest.uploadedBy || "");
    }
  }, [latest]);

  const selectFile = (next: File | undefined) => {
    if (!next) return;
    const extension = next.name.slice(next.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      toast.error("Unsupported document format");
      return;
    }
    setFile(next);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("Document title is required");
      return;
    }
    if (!latest && !file) {
      toast.error("Select a Strategic Plan document to upload");
      return;
    }
    try {
      if (latest) {
        await updateDocument.mutateAsync({ id: latest.id, documentTitle: title, uploadedBy, file: file || undefined });
        toast.success("Strategic Plan document updated successfully");
      } else {
        await createDocument.mutateAsync({ documentTitle: title, uploadedBy, file: file! });
        toast.success("Strategic Plan document uploaded successfully");
      }
      setFile(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save Strategic Plan document");
    }
  };

  const handleDelete = async () => {
    if (!latest) return;
    try {
      await deleteDocument.mutateAsync(latest.id);
      toast.success("Strategic Plan document deleted successfully");
      setConfirmDelete(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete Strategic Plan document");
    }
  };

  if (isLoading) return <LoadingState label="Loading Strategic Plan document..." />;
  if (isError) return <ErrorState label="Unable to load Strategic Plan documents." />;

  const saving = createDocument.isPending || updateDocument.isPending;
  return (
    <div className="space-y-6">
      <PageHeader title="Strategic Plan" description="Upload, view, replace and delete the Strategic Plan Implementation Matrix document." />
      {latest && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary"><FileText className="h-5 w-5" /></div>
              <div>
                <h2 className="font-semibold">{latest.documentTitle}</h2>
                <p className="text-sm text-muted-foreground">{latest.fileName} · {(latest.fileSize / 1024).toFixed(1)} KB · {new Date(latest.dateUploaded).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {latest.fileUrl && <Button asChild variant="outline"><a href={latest.fileUrl} download><Download className="h-4 w-4" /> Download</a></Button>}
              {confirmDelete ? (
                <>
                  <Button variant="destructive" disabled={deleteDocument.isPending} onClick={handleDelete}>Confirm Delete</Button>
                  <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                </>
              ) : (
                <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => setConfirmDelete(true)}><Trash2 className="h-4 w-4" /> Delete</Button>
              )}
            </div>
          </div>
        </div>
      )}
      <form onSubmit={submit} className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Document Title" required><Input value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
          <Field label="Uploaded By"><Input value={uploadedBy} onChange={(event) => setUploadedBy(event.target.value)} placeholder="Name or office" /></Field>
          <div className="md:col-span-2">
            <Field label={latest ? "Replace Document" : "Upload Document"} required={!latest}>
              <Input type="file" accept={ACCEPTED_EXTENSIONS.join(",")} onChange={(event) => selectFile(event.target.files?.[0])} />
            </Field>
            {file && <p className="mt-2 text-sm text-primary">Selected: {file.name}</p>}
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90"><Upload className="h-4 w-4" /> {saving ? "Saving..." : latest ? "Replace Document" : "Upload Document"}</Button>
        </div>
      </form>
    </div>
  );
}

export default function UserManagement() {
  return (
    <div className="space-y-6">
      <PageHeader title="User Management" description="Manage User Management records through dedicated pages backed by Django REST APIs." />
      <ModuleTabs />
      <Routes>
        <Route index element={<Navigate to="users" replace />} />
        <Route path="users" element={<UsersList />} />
        <Route path="users/new" element={<UserFormPage mode="create" />} />
        <Route path="users/:id" element={<UserDetail />} />
        <Route path="users/:id/edit" element={<UserFormPage mode="edit" />} />
        <Route path="development-partners" element={<PlaceholderPage title="Development Partners" />} />
        <Route path="value-chains" element={<ValueChainsList />} />
        <Route path="value-chains/new" element={<ValueChainFormPage mode="create" />} />
        <Route path="value-chains/:id" element={<ValueChainDetail />} />
        <Route path="value-chains/:id/edit" element={<ValueChainFormPage mode="edit" />} />
        <Route path="reference-data" element={<PlaceholderPage title="Reference Data" />} />
        <Route path="strategic-plan" element={<StrategicPlanPage />} />
        <Route path="audit-log" element={<PlaceholderPage title="Audit Log" />} />
        <Route path="*" element={<Navigate to="users" replace />} />
      </Routes>
    </div>
  );
}
