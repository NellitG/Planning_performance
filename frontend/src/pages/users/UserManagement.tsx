import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { Plus, Search, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";

type RoleKey = "system_admin" | "national_me" | "high_level" | "business_logic" | "project_manager" | "department_head" | "staff_user";

interface RoleConfig {
  label: string;
  color: string;
}

const ROLES: Record<RoleKey, RoleConfig> = {
  system_admin: { label: "System Admin", color: "bg-red-100 text-red-800" },
  national_me: { label: "National M&E", color: "bg-blue-100 text-blue-800" },
  high_level: { label: "High Level", color: "bg-purple-100 text-purple-800" },
  business_logic: { label: "Business Logic", color: "bg-amber-100 text-amber-800" },
  project_manager: { label: "Project Manager", color: "bg-green-100 text-green-800" },
  department_head: { label: "Dept Head", color: "bg-teal-100 text-teal-800" },
  staff_user: { label: "Staff User", color: "bg-slate-100 text-slate-700" },
};

interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: RoleKey;
  status: string;
  dept: string;
}

const users: UserRecord[] = [
  { id: 1, name: "System Administrator", email: "admin@kalro.go.ke", role: "system_admin", status: "Active", dept: "ICT" },
  { id: 2, name: "National M&E Officer", email: "me@kalro.go.ke", role: "national_me", status: "Active", dept: "M&E" },
  { id: 3, name: "Performance Contract Officer", email: "pc@gmail.com", role: "business_logic", status: "Active", dept: "Planning" },
  { id: 4, name: "Strategic Planning Officer", email: "strategic@gmail.com", role: "national_me", status: "Active", dept: "Strategy" },
  { id: 5, name: "Project Manager", email: "project@gmail.com", role: "project_manager", status: "Active", dept: "Projects" },
  { id: 6, name: "Department Head", email: "depthead@kalro.go.ke", role: "department_head", status: "Active", dept: "Research" },
  { id: 7, name: "Staff User", email: "staff@kalro.go.ke", role: "staff_user", status: "Active", dept: "Research" },
];

export default function UserManagement() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() =>
    users.filter((u) =>
      !q ||
      u.name.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase())
    ), [q]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage system users, roles and access permissions."
        actions={
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/user-management/new"><Plus className="h-4 w-4" /> Add User</Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>All Users ({filtered.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const role = ROLES[u.role];
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10">
                          <span className="text-xs font-bold text-primary">
                            {u.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">{u.name}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{u.dept}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${role?.color}`}>
                        {role?.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.status === "Active" ? "default" : "secondary"} className="text-xs">
                        {u.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                        <Shield className="h-3 w-3" /> Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
