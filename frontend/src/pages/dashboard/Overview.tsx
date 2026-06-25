import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { Activity, FolderKanban, TrendingUp, Users, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { activity, fundUtilization, projectCategories, quarterlyProgress } from "@/utils/mockData";
import { motion } from "framer-motion";
import { useProjects, useAllMappings } from "@/hooks/useProjectsApi";

const COLORS = ["#0f7a34", "#1d4ed8", "#d97706", "#7c3aed", "#dc2626"];

interface KPI {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
  tone: string;
}

export default function Overview() {
  const { data: projects = [] } = useProjects();
  const { data: mappings = [] } = useAllMappings();

  const mappedIds = new Set(mappings.map((m) => String(m.project)));
  const activeCount = projects.filter((p) => mappedIds.has(String(p.id))).length;

  const kpis: KPI[] = [
    { label: "Total Projects", value: String(projects.length), change: "Live", icon: FolderKanban, tone: "bg-green-50 text-green-700" },
    { label: "Active Projects", value: String(activeCount), change: "Mapped", icon: Activity, tone: "bg-blue-50 text-blue-700" },
    { label: "Total Beneficiaries", value: "124,560", change: "+12.6%", icon: Users, tone: "bg-amber-50 text-amber-700" },
    { label: "Funds Utilized", value: "KES 516M", change: "84% of budget", icon: Wallet, tone: "bg-violet-50 text-violet-700" },
  ];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">Dashboard › Overview</div>
          <h1 className="mt-1 text-2xl font-semibold">Project Reporting Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Real-time snapshot of programs across all counties.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {k.label}
                  </div>
                  <div className="mt-1 text-2xl font-semibold">{k.value}</div>
                  <div className="mt-1 inline-flex items-center gap-1 text-xs text-green-600">
                    <TrendingUp className="h-3 w-3" /> {k.change}
                  </div>
                </div>
                <div className={`grid h-12 w-12 place-items-center rounded-xl ${k.tone}`}>
                  <k.icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fund Utilization (KES Millions)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fundUtilization}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="allocated" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="utilized" fill="#0f7a34" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Categories</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectCategories}
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {projectCategories.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quarterly Progress</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={quarterlyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="projects" stroke="#0f7a34" strokeWidth={2} />
                <Line type="monotone" dataKey="beneficiaries" stroke="#1d4ed8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activity.map((a) => (
              <div key={a.id} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-[(--brand-green)]" />
                <div className="flex-1 text-sm">
                  <span className="font-medium">{a.user}</span>{" "}
                  <span className="text-muted-foreground">{a.action}</span>{" "}
                  <span className="font-medium">{a.target}</span>
                  <div className="text-xs text-muted-foreground">{a.time} ago</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
