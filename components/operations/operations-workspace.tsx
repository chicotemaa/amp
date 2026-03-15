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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyProgressForm } from "@/components/projects/project-detail/daily-progress-form";
import { IncidentReporter } from "@/components/projects/project-detail/incident-reporter";
import { ProgressReport } from "@/components/projects/project-detail/progress-report";
import { MilestonesBoard } from "@/components/operations/milestones-board";
import { ExecutionPlanner } from "@/components/operations/execution-planner";
import { DailySiteLogForm } from "@/components/operations/daily-site-log-form";
import { DailySiteLogsBoard } from "@/components/operations/daily-site-logs-board";
import { OperationsCommandCenter } from "@/components/operations/operations-command-center";
import { getVisibleOperationsTabs, type AppRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

type OperationsProject = {
  id: number;
  name: string;
  status: string | null;
  progress: number | null;
};

interface OperationsWorkspaceProps {
  projects: OperationsProject[];
  fetchError?: string | null;
  role: AppRole | null;
}

export function OperationsWorkspace({
  projects,
  fetchError = null,
  role,
}: OperationsWorkspaceProps) {
  const defaultProjectId = useMemo(
    () => (projects.length > 0 ? String(projects[0].id) : ""),
    [projects]
  );
  const [selectedProjectId, setSelectedProjectId] = useState(defaultProjectId);
  const visibleTabs = getVisibleOperationsTabs(role);
  const defaultTab = visibleTabs[0] ?? "execution";

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
        <>
          <OperationsCommandCenter projectId={selectedProjectId} role={role} />

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList
              className={cn(
                "grid w-full mb-4",
                visibleTabs.length === 1 && "grid-cols-1",
                visibleTabs.length === 2 && "grid-cols-2",
                visibleTabs.length === 3 && "grid-cols-3",
                visibleTabs.length >= 4 && "grid-cols-4"
              )}
            >
              {visibleTabs.includes("execution") ? (
                <TabsTrigger value="execution">Ejecución</TabsTrigger>
              ) : null}
              {visibleTabs.includes("incidents") ? (
                <TabsTrigger value="incidents">Incidentes</TabsTrigger>
              ) : null}
              {visibleTabs.includes("control") ? (
                <TabsTrigger value="control">Control</TabsTrigger>
              ) : null}
              {visibleTabs.includes("planning") ? (
                <TabsTrigger value="planning">Planificación</TabsTrigger>
              ) : null}
            </TabsList>

            {visibleTabs.includes("execution") ? (
              <TabsContent value="execution" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <DailySiteLogForm projectId={selectedProjectId} />
                  <DailyProgressForm projectId={selectedProjectId} />
                  <MilestonesBoard projectId={selectedProjectId} role={role} />
                  <DailySiteLogsBoard projectId={selectedProjectId} />
                </div>
              </TabsContent>
            ) : null}

            {visibleTabs.includes("incidents") ? (
              <TabsContent value="incidents" className="space-y-6">
                <IncidentReporter projectId={selectedProjectId} />
              </TabsContent>
            ) : null}

            {visibleTabs.includes("control") ? (
              <TabsContent value="control" className="space-y-6">
                <ProgressReport projectId={selectedProjectId} role={role} />
              </TabsContent>
            ) : null}

            {visibleTabs.includes("planning") ? (
              <TabsContent value="planning" className="space-y-6">
                <ExecutionPlanner projectId={selectedProjectId} />
              </TabsContent>
            ) : null}
          </Tabs>
        </>
      ) : null}
    </div>
  );
}
