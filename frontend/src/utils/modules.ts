import {
  Target,
  ClipboardCheck,
  FolderKanban,
  LayoutDashboard,
  FileBarChart2,
  TrendingUp,
  Goal,
  ScrollText,
  Building2,
  Gauge,
  Wallet,
  Handshake,
  Users,
  ShieldCheck,
  Bell,
  ClipboardList,
  FileText,
  Table2,
  BookOpen,
  DollarSign,
  Truck,
  Flag,
  Scale,
  Layers,
  FilePen,
  FileCheck,
  Archive,
  Send,
  MessageSquare,
  BarChart3,
  Star,
  PlusCircle,
  Upload,
  Award,
  MessageCircle,
  CalendarDays,
  AlertCircle,
  UserCheck,
  CheckCircle2,
  GitBranch,
  Boxes,
  Activity,
  PackageOpen,
  BarChart2,
  LineChart,
} from "lucide-react";
import type { ModuleConfig, NavNode, SidebarSection, ModuleKey } from "./types";

export const MODULES: Record<ModuleKey, ModuleConfig> = {
  "strategic-objectives": {
    key: "strategic-objectives",
    label: "Strategic Objectives",
    short: "Strategic Plan Management",
    tagline: "KPI monitoring & strategic objective tracking",
    description: "Manage KALRO's long-range strategic plans, objectives and KPIs across the organization.",
    icon: Target,
    accent: "from-emerald-700 to-emerald-500",
    dashboard: "/strategic-objectives/dashboard",
    loginPath: "/login/strategic-objectives",
  },
  "performance-contracts": {
    key: "performance-contracts",
    label: "Performance Contracts",
    short: "PC Management",
    tagline: "Departmental performance evaluation & reporting",
    description: "Track performance contracts, indicators, department targets, and quarterly evaluations.",
    icon: ClipboardCheck,
    accent: "from-emerald-800 to-emerald-600",
    dashboard: "/performance-contracts/dashboard",
    loginPath: "/login/performance-contracts",
  },
  projects: {
    key: "projects",
    label: "Projects",
    short: "Project Reporting",
    tagline: "Project monitoring, budgets & deliverables",
    description: "Existing KALRO PPM system for projects, milestones, budgets, risks and reports.",
    icon: FolderKanban,
    accent: "from-green-700 to-lime-500",
    dashboard: "/",
    loginPath: "/login/projects",
  },
};

export const MODULE_LIST: ModuleConfig[] = Object.values(MODULES);

export const SIDEBAR_SECTIONS: Record<string, SidebarSection[]> = {
  "strategic-objectives": [
    {
      title: "Strategic",
      items: [
        { label: "Dashboard", to: "/strategic-objectives/dashboard", icon: LayoutDashboard },
        { label: "Strategic Plans", to: "/strategic-objectives/plans", icon: ScrollText },
        { label: "Objectives", to: "/strategic-objectives/objectives", icon: Goal },
        { label: "KPIs", to: "/strategic-objectives/kpis", icon: Gauge },
        { label: "KPI Progress", to: "/strategic-objectives/progress", icon: TrendingUp },
        { label: "Strategic Reports", to: "/strategic-objectives/reports", icon: FileBarChart2 },
      ],
    },
    {
      title: "Administration",
      items: [
        { label: "User Management", to: "/user-management", icon: ShieldCheck },
      ],
    },
  ],
  projects: [
    {
      title: "Analytics",
      items: [
        { label: "Overview", to: "/", icon: LayoutDashboard },
        { label: "Projects", to: "/projects", icon: FolderKanban },
        { label: "Notifications", to: "/notifications", icon: Bell },
        { label: "Partners", to: "/partners", icon: Handshake },
      ],
    },
    {
      title: "Planning",
      items: [
        { label: "Key Result Areas", to: "/projects/components", icon: Boxes },
        { label: "Strategic Objectives", to: "/projects/strategic-objectives", icon: Target },
        { label: "Strategy", to: "/projects/strategy", icon: GitBranch },
        { label: "Key Activities", to: "/projects/key-activities", icon: Activity },
        { label: "Expected Outputs", to: "/projects/expected-outputs", icon: PackageOpen },
        { label: "Output Indicators", to: "/projects/output-indicators", icon: BarChart2 },
        { label: "Baseline", to: "/projects/baseline", icon: LineChart },
      ],
    },
    {
      title: "PMIS",
      items: [
        { label: "Technical Reports", to: "/technical-reports", icon: FileBarChart2 },
        { label: "Financial Reports", to: "/financial-reports", icon: Wallet },
        { label: "Project Staff", to: "/project-staff", icon: Users },
      ],
    },
    {
      title: "Administration",
      items: [
        { label: "User Management", to: "/user-management", icon: ShieldCheck },
      ],
    },
  ],
};

export const SIDEBAR_TREE: Record<string, NavNode[]> = {
  "performance-contracts": [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      to: "/performance-contracts/dashboard",
    },
    {
      label: "PC Preparation",
      icon: ClipboardList,
      children: [
        {
          label: "PC Preamble",
          icon: FileText,
          children: [
            { label: "MDA Details", icon: Building2, to: "/performance-contracts/mda-details" },
            { label: "MDA Signatories", icon: UserCheck, to: "/performance-contracts/mda-signatories" },
          ],
        },
        { label: "Core Mandate Performance Indicators", icon: Target, to: "/performance-contracts/core-mandate-indicators" },
        {
          label: "PC Matrix",
          icon: Table2,
          children: [
            { label: "Financial Stewardship", icon: DollarSign, to: "/performance-contracts/matrix-financial" },
            { label: "Service Delivery", icon: Truck, to: "/performance-contracts/matrix-service" },
            { label: "Core Mandate", icon: Target, to: "/performance-contracts/matrix-core" },
            { label: "Presidential Directives", icon: Flag, to: "/performance-contracts/matrix-presidential" },
            { label: "Affirmative Action in Procurement", icon: Scale, to: "/performance-contracts/matrix-affirmative" },
            { label: "Cross Cutting", icon: Layers, to: "/performance-contracts/matrix-cross" },
          ],
        },
        {
          label: "Explanatory Notes",
          icon: BookOpen,
          children: [
            { label: "Financial Stewardship", icon: DollarSign, to: "/performance-contracts/explanatory-financial" },
            { label: "Service Delivery", icon: Truck, to: "/performance-contracts/explanatory-service" },
            { label: "Core Mandate", icon: Target, to: "/performance-contracts/explanatory-core" },
            { label: "Presidential Directives", icon: Flag, to: "/performance-contracts/explanatory-presidential" },
            { label: "Affirmative Action in Procurement", icon: Scale, to: "/performance-contracts/explanatory-affirmative" },
            { label: "Cross Cutting", icon: Layers, to: "/performance-contracts/explanatory-cross" },
          ],
        },
        { label: "Projects Matrix", icon: GitBranch, to: "/performance-contracts/projects-matrix" },
        { label: "Presidential Directives Matrix", icon: Flag, to: "/performance-contracts/presidential-matrix" },
        {
          label: "Reports",
          icon: FileBarChart2,
          children: [
            { label: "Draft PC", icon: FilePen, to: "/performance-contracts/reports-draft" },
            { label: "Final PC", icon: FileCheck, to: "/performance-contracts/reports-final" },
            { label: "Final PC Previous Years", icon: Archive, to: "/performance-contracts/reports-previous" },
          ],
        },
        { label: "Submit for Negotiation", icon: Send, to: "/performance-contracts/submit-negotiation" },
        { label: "PC Status & Draft PC Remarks", icon: MessageSquare, to: "/performance-contracts/pc-status" },
      ],
    },
    {
      label: "Monitoring and Reporting",
      icon: BarChart3,
      children: [
        { label: "Capture Cumulative Achievement", icon: PlusCircle, to: "/performance-contracts/capture-achievement" },
        { label: "Submit Cumulative Achievements", icon: Upload, to: "/performance-contracts/submit-achievements" },
        {
          label: "Reports",
          icon: FileBarChart2,
          children: [
            { label: "Cumulative Achievements", icon: Award, to: "/performance-contracts/mon-reports-cumulative" },
            { label: "Cumulative Feedback", icon: MessageCircle, to: "/performance-contracts/mon-reports-feedback" },
            { label: "Mid Year Review", icon: CalendarDays, to: "/performance-contracts/mon-reports-midyear" },
            { label: "Previous Cumulative Achievements", icon: Archive, to: "/performance-contracts/mon-reports-prev" },
          ],
        },
      ],
    },
    {
      label: "Self-Performance Evaluation",
      icon: Star,
      children: [
        { label: "PC Matrix", icon: Table2, to: "/performance-contracts/self-eval-matrix" },
        { label: "Uncaptured Self-performance Evaluation Scores", icon: AlertCircle, to: "/performance-contracts/self-eval-uncaptured" },
        {
          label: "Reports",
          icon: FileBarChart2,
          children: [
            { label: "Self Evaluation Report", icon: FileCheck, to: "/performance-contracts/self-eval-report" },
          ],
        },
        { label: "Submit for Moderation", icon: CheckCircle2, to: "/performance-contracts/submit-moderation" },
      ],
    },
  ],
};
