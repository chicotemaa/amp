"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart,
  CheckCircle2,
  Clock,
  AlertTriangle
} from "lucide-react";

export function ProgressReport() {
  const progressData = {
    overall: 75,
    phases: [
      { name: "Diseño", progress: 100, status: "completed" },
      { name: "Cimentación", progress: 85, status: "inProgress" },
      { name: "Estructura", progress: 60, status: "inProgress" },
      { name: "Acabados", progress: 0, status: "pending" }
    ]
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