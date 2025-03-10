"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface ScheduleOverviewProps {
  projectId: string;
}

const stages = [
  {
    name: "Replanteo",
    startDate: "2024-03-15",
    endDate: "2024-03-30",
    progress: 100,
    status: "completed",
  },
  {
    name: "Cimentación",
    startDate: "2024-04-01",
    endDate: "2024-05-15",
    progress: 75,
    status: "in-progress",
  },
  {
    name: "Estructura",
    startDate: "2024-05-16",
    endDate: "2024-07-30",
    progress: 20,
    status: "in-progress",
  },
  {
    name: "Acabados",
    startDate: "2024-08-01",
    endDate: "2024-09-30",
    progress: 0,
    status: "pending",
  },
];

export function ScheduleOverview({ projectId }: ScheduleOverviewProps) {
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