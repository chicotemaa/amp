"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProjectById } from "@/lib/api/projects";

interface LaborCostsProps {
  projectId: string;
}

export function LaborCosts({ projectId }: LaborCostsProps) {
  const project = getProjectById(Number(projectId));
  if (!project) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Costos de Personal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Proyecto no encontrado.</p>
        </CardContent>
      </Card>
    );
  }

  const plannedDays = Math.max(
    30,
    Math.round(
      (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const laborData = [
    { category: "Oficial", assigned: Math.max(2, Math.round(project.teamSize * 0.3)), costPerDay: 250 },
    { category: "Medio Oficial", assigned: Math.max(2, Math.round(project.teamSize * 0.4)), costPerDay: 200 },
    { category: "Ayudante", assigned: Math.max(2, Math.round(project.teamSize * 0.2)), costPerDay: 150 },
    { category: "Encargado", assigned: Math.max(1, Math.round(project.teamSize * 0.1)), costPerDay: 300 },
  ].map((labor) => {
    const daysWorked = Math.round((plannedDays * project.progress) / 100);
    const plannedCost = labor.assigned * plannedDays * labor.costPerDay;
    const actualCost = labor.assigned * daysWorked * labor.costPerDay;
    return {
      ...labor,
      daysWorked,
      plannedDays,
      totalCost: actualCost,
      variance: plannedCost - actualCost,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Costos de Personal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {laborData.map((labor, index) => (
            <div key={index} className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{labor.category}</h3>
                  <p className="text-sm text-muted-foreground">
                    {labor.assigned} personas asignadas
                  </p>
                </div>
                <Badge variant={labor.variance <= 0 ? "destructive" : "default"}>
                  {labor.variance === 0 ? "En presupuesto" :
                   labor.variance > 0 ? `+$${labor.variance}` :
                   `-$${Math.abs(labor.variance)}`}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Días Trabajados</p>
                  <p className="font-medium">{labor.daysWorked} / {labor.plannedDays}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Costo por Día</p>
                  <p className="font-medium">${labor.costPerDay}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Costo Total</p>
                  <p className="font-medium">${labor.totalCost}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <p className={`font-medium ${labor.variance <= 0 ? "text-destructive" : "text-success"}`}>
                    {labor.variance === 0 ? "En presupuesto" :
                     labor.variance > 0 ? "Bajo presupuesto" :
                     "Sobre presupuesto"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
