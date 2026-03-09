"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  CheckCircle2,
  Clock,
  AlertTriangle
} from "lucide-react";
import { getProjectByIdDb } from "@/lib/api/projects";
import { Project } from "@/lib/types/project";
import { useEffect, useState } from "react";

interface ProgressReportProps {
  projectId: string;
}

export function ProgressReport({ projectId }: ProgressReportProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjectByIdDb(Number(projectId)).then(p => {
      setProject(p);
      setLoading(false);
    });
  }, [projectId]);

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Cargando reporte de progreso...</p>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Proyecto no encontrado.</p>
      </Card>
    );
  }

  const phaseTemplate = [
    { name: "Diseño", threshold: 25 },
    { name: "Cimentación", threshold: 50 },
    { name: "Estructura", threshold: 75 },
    { name: "Acabados", threshold: 100 },
  ];

  const progressData = {
    overall: project.progress,
    phases: phaseTemplate.map((phase, index) => {
      const base = index * 25;
      const progress = Math.max(0, Math.min(100, (project.progress - base) * 4));
      return {
        name: phase.name,
        progress,
        status:
          progress >= 100 ? "completed" : progress > 0 ? "inProgress" : "pending",
      };
    }),
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "inProgress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "delayed":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Progreso General</h3>
          <BarChart className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-4">
          <Progress value={progressData.overall} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {progressData.overall}% Completado
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Progreso por Fases</h3>
        <div className="space-y-4">
          {progressData.phases.map((phase, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(phase.status)}
                  <span className="text-sm font-medium">{phase.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {phase.progress}%
                </span>
              </div>
              <Progress value={phase.progress} className="h-2" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
