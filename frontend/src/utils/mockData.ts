import type { Project, FundUtilization, ProjectCategory, QuarterlyProgress, Notification, ActivityItem, FinancialReport, User, UserRole, UserStatus, ProjectStatus } from "./types";

export const projects: Project[] = [
  { id: "P-001", name: "Project 1", startDate: "2023-01-15", endDate: "2026-12-31", status: "Active", logo: "NAPP" },
  { id: "P-002", name: "Project 2", startDate: "2022-06-01", endDate: "2025-05-31", status: "Active", logo: "YMAP" },
  { id: "P-003", name: "Project 3", startDate: "2021-03-10", endDate: "2024-09-30", status: "Completed", logo: "SIS" },
  { id: "P-004", name: "Project 4", startDate: "2024-02-01", endDate: "2027-01-31", status: "Active", logo: "MKG" },
  { id: "P-005", name: "Project 5", startDate: "2023-09-01", endDate: "2026-08-31", status: "Delayed", logo: "FISP" },
  { id: "P-006", name: "Project 6", startDate: "2024-07-15", endDate: "2027-06-30", status: "Pending", logo: "SFP" },
  { id: "P-007", name: "Project 7", startDate: "2022-11-01", endDate: "2025-10-31", status: "Active", logo: "RVC" },
  { id: "P-008", name: "Project 8", startDate: "2023-04-01", endDate: "2026-03-31", status: "Active", logo: "CSA" },
  { id: "P-009", name: "Project 9", startDate: "2022-02-20", endDate: "2025-02-19", status: "Delayed", logo: "CFR" },
  { id: "P-010", name: "Project 10", startDate: "2023-08-01", endDate: "2026-07-31", status: "Active", logo: "DPE" },
  { id: "P-011", name: "Project 11", startDate: "2024-01-10", endDate: "2026-12-31", status: "Pending", logo: "HEI" },
  { id: "P-012", name: "Project 12", startDate: "2021-11-01", endDate: "2024-10-31", status: "Completed", logo: "AFR" },
];

export const fundUtilization: FundUtilization[] = [
  { quarter: "Q1", allocated: 120, utilized: 95 },
  { quarter: "Q2", allocated: 140, utilized: 128 },
  { quarter: "Q3", allocated: 160, utilized: 142 },
  { quarter: "Q4", allocated: 180, utilized: 151 },
];

export const projectCategories: ProjectCategory[] = [
  { name: "Agriculture", value: 38 },
  { name: "Livestock", value: 22 },
  { name: "Fisheries", value: 14 },
  { name: "Value Chain", value: 18 },
  { name: "Insurance", value: 8 },
];

export const quarterlyProgress: QuarterlyProgress[] = [
  { quarter: "Q1 2024", projects: 24, beneficiaries: 12400 },
  { quarter: "Q2 2024", projects: 31, beneficiaries: 18900 },
  { quarter: "Q3 2024", projects: 36, beneficiaries: 24500 },
  { quarter: "Q4 2024", projects: 42, beneficiaries: 31200 },
  { quarter: "Q1 2025", projects: 48, beneficiaries: 37800 },
];

export const notifications: Notification[] = [
  { id: 1, title: "New report submitted", desc: "YMAP Q1 2025 technical report awaiting review", time: "10m ago" },
  { id: 2, title: "Funds disbursed", desc: "KES 24M released for Mama Kitchen Garden", time: "1h ago" },
  { id: 3, title: "Partner onboarded", desc: "Equity Foundation added as implementing partner", time: "3h ago" },
  { id: 4, title: "Deadline reminder", desc: "FISP quarterly submission due in 2 days", time: "Yesterday" },
];

export const activity: ActivityItem[] = [
  { id: 1, user: "J. Mwangi", action: "submitted Technical Report", target: "NAPP – Q1 2025", time: "12m" },
  { id: 2, user: "A. Otieno", action: "approved Financial Report", target: "YMAP – Q4 2024", time: "1h" },
  { id: 3, user: "S. Kamau", action: "added new Partner", target: "Equity Foundation", time: "2h" },
  { id: 4, user: "L. Wanjiku", action: "updated Project", target: "Mama Kitchen Garden", time: "5h" },
  { id: 5, user: "D. Kiprono", action: "uploaded Publication", target: "Climate-Smart AG Brief", time: "1d" },
];

export const financialReports: FinancialReport[] = [
  { id: "FR-001", budgetCode: "KALRO-2024-NAPP-01", project: "National Agricultural Productivity Project", fyStart: "2024-07-01", fyEnd: "2025-06-30", approvedBudget: 480000000, utilized: 312000000 },
  { id: "FR-002", budgetCode: "KALRO-2024-YMAP-02", project: "Youth Mainstreaming in Agriculture Program", fyStart: "2024-07-01", fyEnd: "2025-06-30", approvedBudget: 215000000, utilized: 198000000 },
  { id: "FR-003", budgetCode: "KALRO-2023-SIS-03", project: "Smallholder Insurance Scheme", fyStart: "2023-07-01", fyEnd: "2024-06-30", approvedBudget: 95000000, utilized: 92500000 },
  { id: "FR-004", budgetCode: "KALRO-2024-MKG-04", project: "Mama Kitchen Garden Initiative", fyStart: "2024-07-01", fyEnd: "2025-06-30", approvedBudget: 145000000, utilized: 64000000 },
  { id: "FR-005", budgetCode: "KALRO-2024-FISP-05", project: "Farm Inputs Subsidy Programme", fyStart: "2024-07-01", fyEnd: "2025-06-30", approvedBudget: 620000000, utilized: 410000000 },
  { id: "FR-006", budgetCode: "KALRO-2024-RVC-06", project: "Rural Value Chain Development", fyStart: "2024-07-01", fyEnd: "2025-06-30", approvedBudget: 180000000, utilized: 121500000 },
  { id: "FR-007", budgetCode: "KALRO-2024-CSA-07", project: "Climate-Smart Agriculture Initiative", fyStart: "2024-07-01", fyEnd: "2025-06-30", approvedBudget: 260000000, utilized: 184000000 },
  { id: "FR-008", budgetCode: "KALRO-2024-DPE-08", project: "Dairy Productivity Enhancement", fyStart: "2024-07-01", fyEnd: "2025-06-30", approvedBudget: 130000000, utilized: 47000000 },
  { id: "FR-009", budgetCode: "KALRO-2023-AFR-09", project: "Agro-Forestry Restoration Plan", fyStart: "2023-07-01", fyEnd: "2024-06-30", approvedBudget: 78000000, utilized: 76000000 },
  { id: "FR-010", budgetCode: "KALRO-2024-CFR-10", project: "Coastal Fisheries Resilience Program", fyStart: "2024-07-01", fyEnd: "2025-06-30", approvedBudget: 110000000, utilized: 39000000 },
];

export const users: User[] = [
  { id: "U-001", name: "Jane Mwangi", email: "jane.mwangi@kalro.org", status: "Active", dateCreated: "2024-01-15", role: "System Admin" },
  { id: "U-002", name: "Alex Otieno", email: "alex.otieno@kalro.org", status: "Active", dateCreated: "2024-02-04", role: "M&E" },
  { id: "U-003", name: "Sarah Kamau", email: "sarah.kamau@kalro.org", status: "Active", dateCreated: "2024-02-19", role: "National M&E" },
  { id: "U-004", name: "Linet Wanjiku", email: "linet.wanjiku@kalro.org", status: "Suspended", dateCreated: "2023-11-22", role: "Business Logic" },
  { id: "U-005", name: "David Kiprono", email: "david.kiprono@kalro.org", status: "Active", dateCreated: "2024-03-11", role: "High Level" },
  { id: "U-006", name: "Mercy Achieng", email: "mercy.achieng@kalro.org", status: "Inactive", dateCreated: "2023-08-09", role: "M&E" },
  { id: "U-007", name: "Peter Njoroge", email: "peter.njoroge@kalro.org", status: "Active", dateCreated: "2024-04-30", role: "National M&E" },
  { id: "U-008", name: "Grace Wambui", email: "grace.wambui@kalro.org", status: "Active", dateCreated: "2024-05-18", role: "Business Logic" },
  { id: "U-009", name: "Brian Cheruiyot", email: "brian.cheruiyot@kalro.org", status: "Inactive", dateCreated: "2023-10-02", role: "High Level" },
  { id: "U-010", name: "Faith Atieno", email: "faith.atieno@kalro.org", status: "Active", dateCreated: "2024-06-21", role: "System Admin" },
];

export const USER_ROLES: UserRole[] = ["National M&E", "High Level", "Business Logic", "M&E", "System Admin"];
export const USER_STATUSES: UserStatus[] = ["Active", "Inactive", "Suspended"];
export const PROJECT_STATUSES: ProjectStatus[] = ["Active", "Completed", "Delayed", "Pending"];
