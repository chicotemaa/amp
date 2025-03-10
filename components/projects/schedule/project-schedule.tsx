"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ProjectScheduleProps {
  projectId: string;
}

const stages = [
  {
    id: 1,
    name: "Replanteo",
    startDate: new Date(2024, 2, 15),
    endDate: new Date(2024, 2, 20),
    status: "completed",
    progress: 100,
  },
  {
    id: 2,
    name: "Cimentación",
    startDate: new Date(2024, 2, 21),
    endDate: new Date(2024, 3, 10),
    status: "in-progress",
    progress: 65,
    delay: 2,
  },
  {
    id: 3,
    name: "Estructura",
    startDate: new Date(2024, 3, 11),
    endDate: new Date(2024, 4, 15),
    status: "pending",
    progress: 0,
  },
];

export function ProjectSchedule({ projectId }: ProjectScheduleProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Etapas de Obra</CardTitle>
          <CardDescription>Cronograma detallado por etapa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {stages.map((stage) => (
              <div key={stage.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{stage.name}</span>
                      {stage.status === "completed" && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {stage.delay && (
                        <Badge variant="destructive" className="text-xs">
                          {stage.delay} días de retraso
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stage.startDate.toLocaleDateString()} - {stage.endDate.toLocaleDateString()}
                    </div>
                  </div>
                  {stage.status === "in-progress" && (
                    <Badge className="bg-blue-500">{stage.progress}%</Badge>
                  )}
                </div>
                {stage.delay && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Impacto en costos detectado</span>
                  </div>
                )}
              </div>
            ))}
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Etapa
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Calendario</CardTitle>
          <CardDescription>Vista mensual del proyecto</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
          />
        </CardContent>
      </Card>
    </div>
  );
}