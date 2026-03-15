"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart2, Users, FileText, AlertCircle, CloudRain } from "lucide-react";
import { getProjectByIdDb } from "@/lib/api/projects";
import { getEmployeesByProjectDb } from "@/lib/api/employees";
import { getDocumentsByProject } from "@/lib/api/documents";
import { getIncidentSummaryByProjectDb } from "@/lib/api/incidents";
import { getSiteDailyLogSummaryByProjectDb } from "@/lib/api/site-daily-logs";
import { Project } from "@/lib/types/project";
import { Employee } from "@/lib/types/employee";
import type { IncidentSummary } from "@/lib/types/incident";
import type { SiteDailyLogSummary } from "@/lib/types/site-daily-log";
import { ProjectControlSnapshot } from "@/components/projects/project-detail/project-control-snapshot";
import { ProjectContractPanel } from "@/components/projects/project-detail/project-contract-panel";
import { ProjectRevenuePanel } from "@/components/projects/project-detail/project-revenue-panel";

interface ProjectOverviewProps {
  projectId: string;
}

export function ProjectOverview({ projectId }: ProjectOverviewProps) {
  const id = Number(projectId);
  const [project, setProject] = useState<Project | null>(null);
  const [assignedEmployees, setAssignedEmployees] = useState<Employee[]>([]);
  const [docsCount, setDocsCount] = useState(0);
  const [incidentSummary, setIncidentSummary] = useState<IncidentSummary>({
    totalOpen: 0,
    criticalOpen: 0,
    highOpen: 0,
    blocked: 0,
  });
  const [siteLogSummary, setSiteLogSummary] = useState<SiteDailyLogSummary>({
    totalLogs: 0,
    weatherAffectedDays: 0,
    totalHoursWorked: 0,
    totalHoursLost: 0,
    equivalentDelayDays: 0,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [proj, emps, docs, incidents, siteLogs] = await Promise.all([
      getProjectByIdDb(id),
      getEmployeesByProjectDb(id),
      getDocumentsByProject(id).catch(() => []),
      getIncidentSummaryByProjectDb(id).catch(() => ({
        totalOpen: 0,
        criticalOpen: 0,
        highOpen: 0,
        blocked: 0,
      })),
      getSiteDailyLogSummaryByProjectDb(id).catch(() => ({
        totalLogs: 0,
        weatherAffectedDays: 0,
        totalHoursWorked: 0,
        totalHoursLost: 0,
        equivalentDelayDays: 0,
      })),
    ]);
    setProject(proj);
    setAssignedEmployees(emps);
    setDocsCount(docs.length);
    setIncidentSummary(incidents);
    setSiteLogSummary(siteLogs);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handleRefresh = () => {
      void load();
    };

    window.addEventListener("projectProgressUpdated", handleRefresh);
    window.addEventListener("projectPlanningUpdated", handleRefresh);
    window.addEventListener("projectContractsUpdated", handleRefresh);
    return () => {
      window.removeEventListener("projectProgressUpdated", handleRefresh);
      window.removeEventListener("projectPlanningUpdated", handleRefresh);
      window.removeEventListener("projectContractsUpdated", handleRefresh);
    };
  }, [load]);

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Cargando resumen...</div>;
  }

  if (!project) {
    return (
      <p className="text-muted-foreground text-sm mt-4">
        No se encontró información del proyecto.
      </p>
    );
  }

  // Issues derived from project status
  const issues = incidentSummary.totalOpen;
  const issueLabel =
    issues === 0
      ? "Sin incidencias abiertas"
      : `${incidentSummary.criticalOpen} críticas · ${incidentSummary.blocked} bloqueadas`;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {/* Progress */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Progreso Total</CardTitle>
          <BarChart2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={project.progress} />
            <p className="text-xs text-muted-foreground">{project.progress}% Completado</p>
          </div>
        </CardContent>
      </Card>

      {/* Team */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Equipo Activo</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{project.teamSize}</div>
          <p className="text-xs text-muted-foreground">
            {assignedEmployees.length} internos · {project.teamSize - assignedEmployees.length} externos
          </p>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Documentos</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{docsCount}</div>
          <p className="text-xs text-muted-foreground">
            {docsCount === 0 ? "Sin archivos aún" : "Archivos en biblioteca"}
          </p>
        </CardContent>
      </Card>

      {/* Issues */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Incidencias</CardTitle>
          <AlertCircle className={`h-4 w-4 ${issues > 0 ? "text-yellow-500" : "text-green-500"}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{issues}</div>
          <p className={`text-xs mt-1 ${issues > 0 ? "text-yellow-600" : "text-green-600"}`}>
            {issueLabel}
          </p>
        </CardContent>
      </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retraso por Clima</CardTitle>
            <CloudRain className={`h-4 w-4 ${siteLogSummary.totalHoursLost > 0 ? "text-blue-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{siteLogSummary.equivalentDelayDays} d</div>
            <p className="text-xs text-muted-foreground">
              {siteLogSummary.weatherAffectedDays} partes con impacto · {siteLogSummary.totalHoursLost} hs perdidas
            </p>
          </CardContent>
        </Card>
      </div>

      <ProjectControlSnapshot projectId={projectId} />
      <ProjectContractPanel projectId={projectId} />
      <ProjectRevenuePanel projectId={projectId} />
    </div>
  );
}
