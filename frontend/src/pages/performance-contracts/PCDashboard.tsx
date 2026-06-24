import { FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import type { LucideIcon } from "lucide-react";

interface KpiCard {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: string;
}

interface DeptProgress {
  dept: string;
  target: number;
  achieved: number;
}

const kpis: KpiCard[] = [
  { label: "Total Contracts", value: "24", icon: FileText, tone: "bg-emerald-50 text-emerald-700" },
  { label: "Approved", value: "18", icon: CheckCircle2, tone: "bg-green-50 text-green-700" },
  { label: "Pending Review", value: "4", icon: Clock, tone: "bg-amber-50 text-amber-700" },
  { label: "Flagged", value: "2", icon: AlertCircle, tone: "bg-red-50 text-red-700" },
];

const progress: DeptProgress[] = [
  { dept: "Research", target: 100, achieved: 84 },
  { dept: "Extension", target: 100, achieved: 72 },
  { dept: "Admin", target: 100, achieved: 91 },
  { dept: "Finance", target: 100, achieved: 68 },
  { dept: "ICT", target: 100, achieved: 95 },
];

export default function PCDashboard() {
  return (
    <>
      <PageHeader
        title="Performance Contracts Dashboard"
        description="Overview of MDA performance contract cycle status."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</div>
                <div className="mt-1 text-2xl font-semibold">{k.value}</div>
              </div>
              <div className={`grid h-12 w-12 place-items-center rounded-xl ${k.tone}`}>
                <k.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Departmental Achievement vs Target (%)</CardTitle></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={progress}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="dept" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="target" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="achieved" fill="#0f7a34" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}
