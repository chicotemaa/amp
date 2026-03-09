"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getProjectById } from "@/lib/api/projects";

interface ScheduleOverviewProps {
  projectId: string;
}

export function ScheduleOverview({ projectId }: ScheduleOverviewProps) {
  const project = getProjectById(Number(projectId));
  if (!project) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cronograma de Obra</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Proyecto no encontrado.</p>
        </CardContent>
      </Card>
    );
  }

  const stages = [
    { name: "Replanteo", progress: Math.min(project.progress * 1.6, 100), offset: [0, 15] as const },
    { name: "Cimentación", progress: Math.max(0, Math.min((project.progress - 15) * 1.5, 100)), offset: [16, 45] as const },
    { name: "Estructura", progress: Math.max(0, Math.min((project.progress - 40) * 1.6, 100)), offset: [46, 75] as const },
    { name: "Acabados", progress: Math.max(0, Math.min((project.progress - 70) * 3.3, 100)), offset: [76, 100] as const },
  ].map((stage) => {
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const totalDays = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );
    const startDate = new Date(start.getTime() + Math.round((totalDays * stage.offset[0]) / 100) * 24 * 60 * 60 * 1000);
    const endDate = new Date(start.getTime() + Math.round((totalDays * stage.offset[1]) / 100) * 24 * 60 * 60 * 1000);

    return {
    ...stage,
    startDate: startDate.toLocaleDateString("es-AR"),
    endDate: endDate.toLocaleDateString("es-AR"),
    status: stage.progress >= 100 ? "completed" : stage.progress > 0 ? "in-progress" : "pending",
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cronograma de Obra</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {stages.map((stage, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{stage.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {stage.startDate} - {stage.endDate}
                  </p>
                </div>
                <Badge
                  variant={
                    stage.status === "completed" ? "default" :
                    stage.status === "in-progress" ? "secondary" :
                    "outline"
                  }
                >
                  {stage.status === "completed" ? "Completado" :
                   stage.status === "in-progress" ? "En Progreso" :
                   "Pendiente"}
                </Badge>
              </div>
              <Progress value={stage.progress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Progreso: {stage.progress}%
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
