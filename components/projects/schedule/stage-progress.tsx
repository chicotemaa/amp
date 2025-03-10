"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface StageProgressProps {
  projectId: string;
}

const progressData = [
  {
    stage: "Replanteo",
    progress: 100,
    status: "completed",
    laborData: {
      planned: { official: 5, medioOficial: 3, ayudante: 4 },
      actual: { official: 4, medioOficial: 3, ayudante: 4 },
      efficiency: 110,
    },
  },
  {
    stage: "Cimentación",
    progress: 65,
    status: "in-progress",
    laborData: {
      planned: { official: 15, medioOficial: 10, ayudante: 20 },
      actual: { official: 17, medioOficial: 12, ayudante: 22 },
      efficiency: 85,
    },
  },
  {
    stage: "Estructura",
    progress: 0,
    status: "pending",
    laborData: {
      planned: { official: 20, medioOficial: 15, ayudante: 25 },
      actual: { official: 0, medioOficial: 0, ayudante: 0 },
      efficiency: 0,
    },
  },
];

const efficiencyData = [
  { day: "1", efficiency: 95 },
  { day: "2", efficiency: 98 },
  { day: "3", efficiency: 92 },
  { day: "4", efficiency: 88 },
  { day: "5", efficiency: 95 },
  { day: "6", efficiency: 85 },
  { day: "7", efficiency: 90 },
];

export function StageProgress({ projectId }: StageProgressProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Eficiencia del Proyecto</CardTitle>
          <CardDescription>Tendencia de rendimiento en los últimos 7 días</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={efficiencyData}>
                <XAxis dataKey="day" />
                <YAxis domain={[80, 100]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="efficiency"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {progressData.map((stage, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{stage.stage}</CardTitle>
                <CardDescription>Estado de avance y recursos</CardDescription>
              </div>
              <Badge
                variant={
                  stage.status === "completed"
                    ? "default"
                    : stage.status === "in-progress"
                    ? "secondary"
                    : "outline"
                }
              >
                {stage.progress}% Completado
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Progress value={stage.progress} />
              </div>

              {stage.status !== "pending" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Jornales Planificados</h4>
                      <dl className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <dt>Oficial:</dt>
                          <dd>{stage.laborData.planned.official}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Medio Oficial:</dt>
                          <dd>{stage.laborData.planned.medioOficial}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Ayudante:</dt>
                          <dd>{stage.laborData.planned.ayudante}</dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Jornales Reales</h4>
                      <dl className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <dt>Oficial:</dt>
                          <dd>{stage.laborData.actual.official}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Medio Oficial:</dt>
                          <dd>{stage.laborData.actual.medioOficial}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Ayudante:</dt>
                          <dd>{stage.laborData.actual.ayudante}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Eficiencia</span>
                      <Badge
                        variant={stage.laborData.efficiency >= 100 ? "default" : "destructive"}
                      >
                        {stage.laborData.efficiency}%
                      </Badge>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}