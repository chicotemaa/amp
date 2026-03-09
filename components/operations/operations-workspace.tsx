"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DailyProgressForm } from "@/components/projects/project-detail/daily-progress-form";
import { IncidentReporter } from "@/components/projects/project-detail/incident-reporter";
import { ProgressReport } from "@/components/projects/project-detail/progress-report";
import { MilestonesBoard } from "@/components/operations/milestones-board";

type OperationsProject = {
  id: number;
  name: string;
  status: string | null;
  progress: number | null;
};

interface OperationsWorkspaceProps {
  projects: OperationsProject[];
  fetchError?: string | null;
}

export function OperationsWorkspace({ projects, fetchError = null }: OperationsWorkspaceProps) {
  const defaultProjectId = useMemo(
    () => (projects.length > 0 ? String(projects[0].id) : ""),
    [projects]
  );
  const [selectedProjectId, setSelectedProjectId] = useState(defaultProjectId);

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          No hay proyectos disponibles para operación.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {fetchError ? (
        <Card>
          <CardContent className="py-4 text-sm text-red-600">
            {fetchError}
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Proyecto Operativo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona proyecto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={String(project.id)}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground sm:justify-self-end">
            {selectedProject ? (
              <div className="text-right">
                <p>Estado: {selectedProject.status ?? "Sin estado"}</p>
                <p>Avance: {selectedProject.progress ?? 0}%</p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {selectedProjectId ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <DailyProgressForm projectId={selectedProjectId} />
          <IncidentReporter projectId={selectedProjectId} />
          <MilestonesBoard projectId={selectedProjectId} />
          <div className="lg:col-span-2">
            <ProgressReport projectId={selectedProjectId} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
