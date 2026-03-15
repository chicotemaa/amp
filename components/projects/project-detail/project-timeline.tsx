"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMilestonesByProjectDb, getProjectPhasesDb } from "@/lib/api/progress";
import type { Milestone, ProjectPhase } from "@/lib/types/progress";

interface ProjectTimelineProps {
  projectId: string;
}

export function ProjectTimeline({ projectId }: ProjectTimelineProps) {
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getProjectPhasesDb(Number(projectId)),
      getMilestonesByProjectDb(Number(projectId)),
    ]).then(([phaseData, milestoneData]) => {
      if (!mounted) return;
      setPhases(phaseData);
      setMilestones(milestoneData);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [projectId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cronograma del Proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando cronograma...</p>
        </CardContent>
      </Card>
    );
  }
  if (phases.length === 0 && milestones.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cronograma del Proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No hay fases ni hitos configurados para este proyecto.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cronograma del Proyecto</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Fases</h4>
            {phases
              .sort((a, b) => a.phaseOrder - b.phaseOrder)
              .map((phase) => (
                <div key={phase.id} className="rounded-md border p-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">
                      {phase.phaseOrder}. {phase.name}
                    </p>
                    <Badge variant="outline">{phase.actualProgress}% real</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Plan: {phase.plannedProgress}% ·
                    Inicio: {phase.startDate ? new Date(phase.startDate).toLocaleDateString("es-AR") : "Sin fecha"} ·
                    Cierre: {phase.endDate ? new Date(phase.endDate).toLocaleDateString("es-AR") : "Sin fecha"}
                  </p>
                </div>
              ))}
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Hitos</h4>
            {milestones
              .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
              .map((milestone) => (
                <div key={milestone.id} className="flex gap-4">
                  <div className="relative flex flex-col items-center">
                    <div className="absolute h-full w-px bg-border" />
                    <div className="relative h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium leading-none">{milestone.name}</h4>
                      <Badge variant="outline">{milestone.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Objetivo: {new Date(milestone.dueDate).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
