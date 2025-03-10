"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LaborCostsProps {
  projectId: string;
}

const laborData = [
  {
    category: "Oficial",
    assigned: 5,
    daysWorked: 45,
    plannedDays: 40,
    costPerDay: 250,
    totalCost: 11250,
    variance: -1250,
  },
  {
    category: "Medio Oficial",
    assigned: 8,
    daysWorked: 42,
    plannedDays: 40,
    costPerDay: 200,
    totalCost: 67200,
    variance: -3200,
  },
  {
    category: "Ayudante",
    assigned: 12,
    daysWorked: 38,
    plannedDays: 40,
    costPerDay: 150,
    totalCost: 68400,
    variance: 3600,
  },
  {
    category: "Encargado",
    assigned: 2,
    daysWorked: 45,
    plannedDays: 45,
    costPerDay: 300,
    totalCost: 27000,
    variance: 0,
  },
];

export function LaborCosts({ projectId }: LaborCostsProps) {
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