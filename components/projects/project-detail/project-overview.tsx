"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart2, Users, FileText, AlertCircle } from "lucide-react";
import { getProjectById } from "@/lib/api/projects";
import { getEmployeesByProject } from "@/lib/api/employees";
import { Badge } from "@/components/ui/badge";

interface ProjectOverviewProps {
  projectId: string;
}

export function ProjectOverview({ projectId }: ProjectOverviewProps) {
  const id = Number(projectId);
  const project = useMemo(() => getProjectById(id), [id]);
  const assignedEmployees = useMemo(() => getEmployeesByProject(id), [id]);

  if (!project) {
    return (
      <p className="text-muted-foreground text-sm mt-4">
        No se encontró información del proyecto.
      </p>
    );
  }

  // Issues derived from project status
  const issues = project.onTrack ? 0 : 1;
  const issueLabel = issues === 0 ? "Sin incidencias" : "Retraso en cronograma";

  // Docs: read from localStorage (set by DocumentsModule), fall back to 0
  let docsCount = 0;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(`amp_docs_${projectId}`);
      if (raw) docsCount = JSON.parse(raw).length;
    } catch {
      docsCount = 0;
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
    </div>
  );
}