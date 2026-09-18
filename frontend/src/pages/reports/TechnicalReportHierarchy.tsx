import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMainProject, useTechnicalReports } from "@/hooks/useProjectsApi";

export function TechnicalReportMainProject() {
  const { id } = useParams<{ id: string }>(); const { data: project, isLoading } = useMainProject(id);
  if (isLoading) return <p className="p-8 text-sm text-muted-foreground">Loading Main Project…</p>;
  if (!project) return <p className="p-8 text-sm text-red-700">Main Project not found.</p>;
  return <div className="space-y-5"><Button asChild variant="outline"><Link to="/technical-reports"><ArrowLeft className="h-4 w-4" /> Technical Reports</Link></Button><Card className="p-6"><h1 className="text-2xl font-semibold">{project.name}</h1><p className="mt-1 text-sm text-muted-foreground">Select a Project Title to view only its technical reports.</p><div className="mt-5 divide-y rounded-lg border">{project.projectTitles.map((title, index) => <Link key={title.id} to={`/technical-reports/main/${project.id}/title/${title.id}`} className="flex items-center gap-3 p-4 hover:bg-muted/40"><span className="text-muted-foreground">{index + 1}.</span><FileText className="h-4 w-4 text-primary" /><span className="flex-1 font-medium">{title.name}</span><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link>)}{!project.projectTitles.length && <p className="p-4 text-sm text-muted-foreground">No Project Titles are available.</p>}</div></Card></div>;
}

export function TechnicalReportProjectTitle() {
  const { mainId, projectId } = useParams<{ mainId: string; projectId: string }>();
  const { data: project } = useMainProject(mainId); const { data: reports = [], isLoading } = useTechnicalReports();
  const title = project?.projectTitles.find((item) => item.id === projectId);
  const scoped = reports.filter((report) => report.projectId === projectId);
  return <div className="space-y-5"><Button asChild variant="outline"><Link to={`/technical-reports/main/${mainId}`}><ArrowLeft className="h-4 w-4" /> {project?.name || "Main Project"}</Link></Button><Card className="p-6"><p className="text-xs font-medium uppercase text-muted-foreground">Project Title</p><h1 className="mt-1 text-2xl font-semibold">{title?.name || "Loading…"}</h1><div className="mt-5 space-y-3">{isLoading ? <p className="text-sm text-muted-foreground">Loading reports…</p> : scoped.map((report) => <div key={report.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-4"><FileText className="h-4 w-4 text-primary" /><div className="min-w-48 flex-1"><Link to={`/technical-reports/${report.id}`} className="font-medium hover:underline">{report.title}</Link><p className="text-xs text-muted-foreground">{report.financialYear} · {report.quarter} · {report.status}</p></div><Button asChild variant="outline" size="sm"><Link to={`/technical-reports/${report.id}`}>View</Link></Button><Button asChild variant="outline" size="sm"><Link to={`/technical-reports/${report.id}/edit`}>Edit</Link></Button></div>)}{!isLoading && !scoped.length && <p className="text-sm text-muted-foreground">No technical reports have been created for this Project Title.</p>}</div></Card></div>;
}
