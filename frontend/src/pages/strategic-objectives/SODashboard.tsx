import { Target, Goal, Gauge, TrendingUp } from "lucide-react";
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

interface PillarProgress {
  pillar: string;
  target: number;
  achieved: number;
}

const kpis: KpiCard[] = [
  { label: "Strategic Plans", value: "4", icon: Target, tone: "bg-emerald-50 text-emerald-700" },
  { label: "Active Objectives", value: "26", icon: Goal, tone: "bg-blue-50 text-blue-700" },
  { label: "Tracked KPIs", value: "112", icon: Gauge, tone: "bg-amber-50 text-amber-700" },
  { label: "On-Track KPIs", value: "78%", icon: TrendingUp, tone: "bg-violet-50 text-violet-700" },
];

const progress: PillarProgress[] = [
  { pillar: "Research", target: 100, achieved: 82 },
  { pillar: "Innovation", target: 100, achieved: 71 },
  { pillar: "Partnerships", target: 100, achieved: 64 },
  { pillar: "Capacity", target: 100, achieved: 88 },
  { pillar: "Service Delivery", target: 100, achieved: 76 },
];

export default function SODashboard() {
  return (
    <>
      <PageHeader
        title="Strategic Objectives Dashboard"
        description="KALRO strategic plan execution across pillars and objectives."
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
        <CardHeader><CardTitle>Pillar Achievement vs Target (%)</CardTitle></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={progress}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="pillar" tick={{ fontSize: 12 }} />
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
