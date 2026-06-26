import type { LucideIcon } from "lucide-react";

export type ProjectStatus = "Active" | "Completed" | "Delayed" | "Pending";
export type UserRole = "National M&E" | "High Level" | "Business Logic" | "M&E" | "System Admin";
export type UserStatus = "Active" | "Inactive" | "Suspended";
export type ModuleKey = "strategic-objectives" | "performance-contracts" | "projects";

export interface Project {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  logo: string;
}

export interface FundUtilization {
  quarter: string;
  allocated: number;
  utilized: number;
}

export interface ProjectCategory {
  name: string;
  value: number;
}

export interface QuarterlyProgress {
  quarter: string;
  projects: number;
  beneficiaries: number;
}

export interface Notification {
  id: number;
  title: string;
  desc: string;
  time: string;
}

export interface NotificationWithRead extends Notification {
  read: boolean;
}

export interface ActivityItem {
  id: number;
  user: string;
  action: string;
  target: string;
  time: string;
}

export interface FinancialReport {
  id: string;
  budgetCode: string;
  project: string;
  fyStart: string;
  fyEnd: string;
  approvedBudget: number;
  utilized: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  dateCreated: string;
  role: UserRole;
}

export interface StoreItem {
  id: string;
  createdAt: string;
}

export interface MainActivity {
  id: string;
  name: string;
  createdAt: string;
}

export interface SubActivity {
  id: string;
  name: string;
  createdAt: string;
}

export interface KRAComponent extends StoreItem {
  title: string;
}

export interface ProjectObjective extends StoreItem {
  componentId: string;
  text: string;
}

export interface ProjectStrategy extends StoreItem {
  componentId: string;
  objectiveId: string;
  text: string;
}

export interface KeyActivity extends StoreItem {
  strategyId: string;
  text: string;
}

export interface ExpectedOutput extends StoreItem {
  strategyId: string;
  keyActivityId: string;
  text: string;
}

export interface OutputIndicator extends StoreItem {
  strategyId: string;
  keyActivityId: string;
  expectedOutputId: string;
  text: string;
}

export interface TrackingEntry {
  year: number;
  target: string;
  achievement: string;
  evidenceName: string | null;
  evidenceId: string | null;
}

export interface ProjectTrackingRecord {
  entries: TrackingEntry[];
  updatedAt: string;
}

export interface ProjectDocument extends StoreItem {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  fileUrl?: string | null;
}

export interface ProjectMapping {
  kraIds: string[];
  objectiveIds: string[];
  strategyIds: string[];
  keyActivityIds: string[];
  expectedOutputIds: string[];
  outputIndicatorIds: string[];
  savedAt: string;
}

export interface AuthUser {
  email: string;
  name: string;
  role: string;
  initials: string;
}

export interface AuthState {
  user: AuthUser;
  module: string;
  token: string;
  issuedAt: string;
}

export interface LoginParams {
  email: string;
  moduleKey: string;
  role?: string;
}

export interface AuthContextValue {
  auth: AuthState | null;
  hydrated: boolean;
  login: (params: LoginParams) => AuthState;
  logout: () => void;
}

export interface ModuleConfig {
  key: ModuleKey;
  label: string;
  short: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  dashboard: string;
  loginPath: string;
}

export interface NavLeafNode {
  label: string;
  to: string;
  icon: LucideIcon;
  children?: never;
}

export interface NavGroupNode {
  label: string;
  icon?: LucideIcon;
  to?: never;
  children: NavNode[];
}

export type NavNode = NavLeafNode | NavGroupNode;

export interface SidebarSectionItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export interface SidebarSection {
  title: string;
  items: SidebarSectionItem[];
}

export interface PCTableColumn {
  key: string;
  label: string;
  link?: boolean;
}
