import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const queryClient = new QueryClient();

const LoginPortal = lazy(() => import("@/pages/auth/LoginPortal"));
const LoginProjects = lazy(() => import("@/pages/auth/LoginProjects"));
const LoginPC = lazy(() => import("@/pages/auth/LoginPC"));
const LoginStrategic = lazy(() => import("@/pages/auth/LoginStrategic"));
const LogoutPage = lazy(() => import("@/pages/Logout"));

const Overview = lazy(() => import("@/pages/dashboard/Overview"));

const Projects = lazy(() => import("@/pages/projects/Projects"));
const ProjectWizard = lazy(() => import("@/pages/projects/wizard/ProjectWizard"));

const SODashboard = lazy(() => import("@/pages/strategic-objectives/SODashboard"));
const SOKPIs = lazy(() => import("@/pages/strategic-objectives/KPIs"));
const SOObjectives = lazy(() => import("@/pages/strategic-objectives/Objectives"));
const SOPlans = lazy(() => import("@/pages/strategic-objectives/Plans"));
const SOProgress = lazy(() => import("@/pages/strategic-objectives/Progress"));
const SOReports = lazy(() => import("@/pages/strategic-objectives/SOReports"));

const PCDashboard = lazy(() => import("@/pages/performance-contracts/PCDashboard"));
const MDADetails = lazy(() => import("@/pages/performance-contracts/MDADetails"));
const MDASignatories = lazy(() => import("@/pages/performance-contracts/MDASignatories"));
const CoreMandateIndicators = lazy(() => import("@/pages/performance-contracts/CoreMandateIndicators"));
const MatrixFinancial = lazy(() => import("@/pages/performance-contracts/MatrixFinancial"));
const MatrixService = lazy(() => import("@/pages/performance-contracts/MatrixService"));
const MatrixCore = lazy(() => import("@/pages/performance-contracts/MatrixCore"));
const MatrixPresidential = lazy(() => import("@/pages/performance-contracts/MatrixPresidential"));
const MatrixAffirmative = lazy(() => import("@/pages/performance-contracts/MatrixAffirmative"));
const MatrixCross = lazy(() => import("@/pages/performance-contracts/MatrixCross"));
const ExplanatoryFinancial = lazy(() => import("@/pages/performance-contracts/ExplanatoryFinancial"));
const ExplanatoryService = lazy(() => import("@/pages/performance-contracts/ExplanatoryService"));
const ExplanatoryCore = lazy(() => import("@/pages/performance-contracts/ExplanatoryCore"));
const ExplanatoryPresidential = lazy(() => import("@/pages/performance-contracts/ExplanatoryPresidential"));
const ExplanatoryAffirmative = lazy(() => import("@/pages/performance-contracts/ExplanatoryAffirmative"));
const ExplanatoryCross = lazy(() => import("@/pages/performance-contracts/ExplanatoryCross"));
const ProjectsMatrix = lazy(() => import("@/pages/performance-contracts/ProjectsMatrix"));
const PresidentialMatrix = lazy(() => import("@/pages/performance-contracts/PresidentialMatrix"));
const ReportsDraft = lazy(() => import("@/pages/performance-contracts/ReportsDraft"));
const ReportsFinal = lazy(() => import("@/pages/performance-contracts/ReportsFinal"));
const ReportsPrevious = lazy(() => import("@/pages/performance-contracts/ReportsPrevious"));
const PCStatus = lazy(() => import("@/pages/performance-contracts/PCStatus"));
const SubmitNegotiation = lazy(() => import("@/pages/performance-contracts/SubmitNegotiation"));
const CaptureAchievement = lazy(() => import("@/pages/performance-contracts/CaptureAchievement"));
const SubmitAchievements = lazy(() => import("@/pages/performance-contracts/SubmitAchievements"));
const MonReportsCumulative = lazy(() => import("@/pages/performance-contracts/MonReportsCumulative"));
const MonReportsFeedback = lazy(() => import("@/pages/performance-contracts/MonReportsFeedback"));
const MonReportsMidyear = lazy(() => import("@/pages/performance-contracts/MonReportsMidyear"));
const MonReportsPrev = lazy(() => import("@/pages/performance-contracts/MonReportsPrev"));
const SelfEvalMatrix = lazy(() => import("@/pages/performance-contracts/SelfEvalMatrix"));
const SelfEvalUncaptured = lazy(() => import("@/pages/performance-contracts/SelfEvalUncaptured"));
const SelfEvalReport = lazy(() => import("@/pages/performance-contracts/SelfEvalReport"));
const SubmitModeration = lazy(() => import("@/pages/performance-contracts/SubmitModeration"));
const PCTargets = lazy(() => import("@/pages/performance-contracts/PCTargets"));
const PCIndicators = lazy(() => import("@/pages/performance-contracts/PCIndicators"));
const PCContracts = lazy(() => import("@/pages/performance-contracts/PCContracts"));
const PCEvaluations = lazy(() => import("@/pages/performance-contracts/PCEvaluations"));
const PCReports = lazy(() => import("@/pages/performance-contracts/PCReports"));

const ProjectDetail = lazy(() => import("@/pages/projects/ProjectDetail"));
const ProjectView = lazy(() => import("@/pages/projects/ProjectView"));
const ProjectComponents = lazy(() => import("@/pages/projects/components/Components"));
const ComponentForm = lazy(() => import("@/pages/projects/components/ComponentForm"));
const ComponentView = lazy(() => import("@/pages/projects/components/ComponentView"));
const ProjectObjectives = lazy(() => import("@/pages/projects/strategic-objectives/ProjectObjectives"));
const ProjectObjectiveForm = lazy(() => import("@/pages/projects/strategic-objectives/ProjectObjectiveForm"));
const ProjectStrategy = lazy(() => import("@/pages/projects/strategy/Strategy"));
const StrategyForm = lazy(() => import("@/pages/projects/strategy/StrategyForm"));
const KeyActivities = lazy(() => import("@/pages/projects/key-activities/KeyActivities"));
const KeyActivityForm = lazy(() => import("@/pages/projects/key-activities/KeyActivityForm"));
const ExpectedOutputs = lazy(() => import("@/pages/projects/expected-outputs/ExpectedOutputs"));
const ExpectedOutputForm = lazy(() => import("@/pages/projects/expected-outputs/ExpectedOutputForm"));
const OutputIndicators = lazy(() => import("@/pages/projects/output-indicators/OutputIndicators"));
const OutputIndicatorForm = lazy(() => import("@/pages/projects/output-indicators/OutputIndicatorForm"));
const Outcomes = lazy(() => import("@/pages/projects/outcomes/Outcomes"));
const OutcomeForm = lazy(() => import("@/pages/projects/outcomes/OutcomeForm"));
const ImplementationMatrix = lazy(() => import("@/pages/projects/strategic-plan/ImplementationMatrix"));
const OutcomeMatrix = lazy(() => import("@/pages/projects/strategic-plan/OutcomeMatrix"));
const MainActivities = lazy(() => import("@/pages/projects/main-activities/MainActivities"));
const MainActivityForm = lazy(() => import("@/pages/projects/main-activities/MainActivityForm"));
const SubActivities = lazy(() => import("@/pages/projects/sub-activities/SubActivities"));
const SubActivityForm = lazy(() => import("@/pages/projects/sub-activities/SubActivityForm"));
const SubSubActivities = lazy(() => import("@/pages/projects/sub-sub-activities/SubSubActivities"));
const SubSubActivityForm = lazy(() => import("@/pages/projects/sub-sub-activities/SubSubActivityForm"));
const ReportComponents = lazy(() => import("@/pages/projects/report-components/ReportComponents"));
const ReportComponentForm = lazy(() => import("@/pages/projects/report-components/ReportComponentForm"));
const SubComponents = lazy(() => import("@/pages/projects/sub-components/SubComponents"));
const SubComponentForm = lazy(() => import("@/pages/projects/sub-components/SubComponentForm"));
const ActivityIndicators = lazy(() => import("@/pages/projects/activity-indicators/ActivityIndicators"));
const ActivityIndicatorForm = lazy(() => import("@/pages/projects/activity-indicators/ActivityIndicatorForm"));

const FinancialReports = lazy(() => import("@/pages/reports/FinancialReports"));
const TechnicalReports = lazy(() => import("@/pages/reports/TechnicalReports"));
const NewReport = lazy(() => import("@/pages/reports/NewReport"));

const Notifications = lazy(() => import("@/pages/notifications/Notifications"));
const UserManagement = lazy(() => import("@/pages/users/UserManagement"));
const Partners = lazy(() => import("@/pages/partners/Partners"));
const ProjectStaff = lazy(() => import("@/pages/project-staff/ProjectStaff"));

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading…</div>
    </div>
  );
}

function ProtectedLayout() {
  const { auth, hydrated, login } = useAuth();

  useEffect(() => {
    if (hydrated && !auth) {
      login({ email: "guest@kalro.go.ke", moduleKey: "projects", role: "Guest" });
    }
  }, [hydrated, auth, login]);

  if (!hydrated || !auth) {
    return <LoadingFallback />;
  }
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPortal />} />
      <Route path="/login/projects" element={<LoginProjects />} />
      <Route path="/login/performance-contracts" element={<LoginPC />} />
      <Route path="/login/strategic-objectives" element={<LoginStrategic />} />
      <Route path="/logout" element={<LogoutPage />} />

      <Route element={<ProtectedLayout />}>
        <Route index element={<Overview />} />

        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/new" element={<ProjectWizard mode="create" />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/projects/:id/view" element={<ProjectView />} />
        <Route path="/projects/:id/edit" element={<ProjectWizard mode="edit" />} />

        <Route path="/projects/components" element={<ProjectComponents />} />
        <Route path="/projects/components/new" element={<ComponentForm mode="create" />} />
        <Route path="/projects/components/:id/view" element={<ComponentView />} />
        <Route path="/projects/components/:id/edit" element={<ComponentForm mode="edit" />} />

        <Route path="/projects/strategic-objectives" element={<ProjectObjectives />} />
        <Route path="/projects/strategic-objectives/new" element={<ProjectObjectiveForm mode="create" />} />
        <Route path="/projects/strategic-objectives/:id/edit" element={<ProjectObjectiveForm mode="edit" />} />

        <Route path="/projects/strategy" element={<ProjectStrategy />} />
        <Route path="/projects/strategy/new" element={<StrategyForm mode="create" />} />
        <Route path="/projects/strategy/:id/edit" element={<StrategyForm mode="edit" />} />

        <Route path="/projects/key-activities" element={<KeyActivities />} />
        <Route path="/projects/key-activities/new" element={<KeyActivityForm mode="create" />} />
        <Route path="/projects/key-activities/:id/edit" element={<KeyActivityForm mode="edit" />} />

        <Route path="/projects/expected-outputs" element={<ExpectedOutputs />} />
        <Route path="/projects/expected-outputs/new" element={<ExpectedOutputForm mode="create" />} />
        <Route path="/projects/expected-outputs/:id/edit" element={<ExpectedOutputForm mode="edit" />} />

        <Route path="/projects/output-indicators" element={<OutputIndicators />} />
        <Route path="/projects/output-indicators/new" element={<OutputIndicatorForm mode="create" />} />
        <Route path="/projects/output-indicators/:id/edit" element={<OutputIndicatorForm mode="edit" />} />

        <Route path="/projects/outcomes" element={<Outcomes />} />
        <Route path="/projects/outcomes/new" element={<OutcomeForm mode="create" />} />
        <Route path="/projects/outcomes/:id/edit" element={<OutcomeForm mode="edit" />} />

        <Route path="/projects/strategic-plan/implementation-matrix" element={<ImplementationMatrix />} />
        <Route path="/projects/strategic-plan/outcome-matrix" element={<OutcomeMatrix />} />

        <Route path="/projects/main-activities" element={<MainActivities />} />
        <Route path="/projects/main-activities/new" element={<MainActivityForm mode="create" />} />
        <Route path="/projects/main-activities/:id/view" element={<MainActivityForm mode="view" />} />
        <Route path="/projects/main-activities/:id/edit" element={<MainActivityForm mode="edit" />} />

        <Route path="/projects/report-components" element={<ReportComponents />} />
        <Route path="/projects/report-components/new" element={<ReportComponentForm mode="create" />} />
        <Route path="/projects/report-components/:id/view" element={<ReportComponentForm mode="view" />} />
        <Route path="/projects/report-components/:id/edit" element={<ReportComponentForm mode="edit" />} />

        <Route path="/projects/sub-components" element={<SubComponents />} />
        <Route path="/projects/sub-components/new" element={<SubComponentForm mode="create" />} />
        <Route path="/projects/sub-components/:id/view" element={<SubComponentForm mode="view" />} />
        <Route path="/projects/sub-components/:id/edit" element={<SubComponentForm mode="edit" />} />

        <Route path="/projects/sub-activities" element={<SubActivities />} />
        <Route path="/projects/sub-activities/new" element={<SubActivityForm mode="create" />} />
        <Route path="/projects/sub-activities/:id/view" element={<SubActivityForm mode="view" />} />
        <Route path="/projects/sub-activities/:id/edit" element={<SubActivityForm mode="edit" />} />

        <Route path="/projects/sub-sub-activities" element={<SubSubActivities />} />
        <Route path="/projects/sub-sub-activities/new" element={<SubSubActivityForm mode="create" />} />
        <Route path="/projects/sub-sub-activities/:id/view" element={<SubSubActivityForm mode="view" />} />
        <Route path="/projects/sub-sub-activities/:id/edit" element={<SubSubActivityForm mode="edit" />} />

        <Route path="/projects/activity-indicators" element={<ActivityIndicators />} />
        <Route path="/projects/activity-indicators/new" element={<ActivityIndicatorForm mode="create" />} />
        <Route path="/projects/activity-indicators/:id/view" element={<ActivityIndicatorForm mode="view" />} />
        <Route path="/projects/activity-indicators/:id/edit" element={<ActivityIndicatorForm mode="edit" />} />

        <Route path="/strategic-objectives/dashboard" element={<SODashboard />} />
        <Route path="/strategic-objectives/kpis" element={<SOKPIs />} />
        <Route path="/strategic-objectives/objectives" element={<SOObjectives />} />
        <Route path="/strategic-objectives/plans" element={<SOPlans />} />
        <Route path="/strategic-objectives/progress" element={<SOProgress />} />
        <Route path="/strategic-objectives/reports" element={<SOReports />} />

        <Route path="/performance-contracts/dashboard" element={<PCDashboard />} />
        <Route path="/performance-contracts/mda-details" element={<MDADetails />} />
        <Route path="/performance-contracts/mda-signatories" element={<MDASignatories />} />
        <Route path="/performance-contracts/core-mandate-indicators" element={<CoreMandateIndicators />} />
        <Route path="/performance-contracts/matrix-financial" element={<MatrixFinancial />} />
        <Route path="/performance-contracts/matrix-service" element={<MatrixService />} />
        <Route path="/performance-contracts/matrix-core" element={<MatrixCore />} />
        <Route path="/performance-contracts/matrix-presidential" element={<MatrixPresidential />} />
        <Route path="/performance-contracts/matrix-affirmative" element={<MatrixAffirmative />} />
        <Route path="/performance-contracts/matrix-cross" element={<MatrixCross />} />
        <Route path="/performance-contracts/explanatory-financial" element={<ExplanatoryFinancial />} />
        <Route path="/performance-contracts/explanatory-service" element={<ExplanatoryService />} />
        <Route path="/performance-contracts/explanatory-core" element={<ExplanatoryCore />} />
        <Route path="/performance-contracts/explanatory-presidential" element={<ExplanatoryPresidential />} />
        <Route path="/performance-contracts/explanatory-affirmative" element={<ExplanatoryAffirmative />} />
        <Route path="/performance-contracts/explanatory-cross" element={<ExplanatoryCross />} />
        <Route path="/performance-contracts/projects-matrix" element={<ProjectsMatrix />} />
        <Route path="/performance-contracts/presidential-matrix" element={<PresidentialMatrix />} />
        <Route path="/performance-contracts/reports-draft" element={<ReportsDraft />} />
        <Route path="/performance-contracts/reports-final" element={<ReportsFinal />} />
        <Route path="/performance-contracts/reports-previous" element={<ReportsPrevious />} />
        <Route path="/performance-contracts/pc-status" element={<PCStatus />} />
        <Route path="/performance-contracts/submit-negotiation" element={<SubmitNegotiation />} />
        <Route path="/performance-contracts/capture-achievement" element={<CaptureAchievement />} />
        <Route path="/performance-contracts/submit-achievements" element={<SubmitAchievements />} />
        <Route path="/performance-contracts/mon-reports-cumulative" element={<MonReportsCumulative />} />
        <Route path="/performance-contracts/mon-reports-feedback" element={<MonReportsFeedback />} />
        <Route path="/performance-contracts/mon-reports-midyear" element={<MonReportsMidyear />} />
        <Route path="/performance-contracts/mon-reports-prev" element={<MonReportsPrev />} />
        <Route path="/performance-contracts/self-eval-matrix" element={<SelfEvalMatrix />} />
        <Route path="/performance-contracts/self-eval-uncaptured" element={<SelfEvalUncaptured />} />
        <Route path="/performance-contracts/self-eval-report" element={<SelfEvalReport />} />
        <Route path="/performance-contracts/submit-moderation" element={<SubmitModeration />} />
        <Route path="/performance-contracts/targets" element={<PCTargets />} />
        <Route path="/performance-contracts/indicators" element={<PCIndicators />} />
        <Route path="/performance-contracts/contracts" element={<PCContracts />} />
        <Route path="/performance-contracts/evaluations" element={<PCEvaluations />} />
        <Route path="/performance-contracts/reports" element={<PCReports />} />

        <Route path="/financial-reports" element={<FinancialReports />} />
        <Route path="/technical-reports" element={<TechnicalReports />} />
        <Route path="/new-report" element={<NewReport />} />

        <Route path="/notifications" element={<Notifications />} />
        <Route path="/user-management/*" element={<UserManagement />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/project-staff" element={<ProjectStaff />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <AppRoutes />
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
