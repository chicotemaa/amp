"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package } from "lucide-react";
import { getProjectById } from "@/lib/api/projects";

interface MaterialsTrackingProps {
  projectId: string;
}

export function MaterialsTracking({ projectId }: MaterialsTrackingProps) {
  const project = getProjectById(Number(projectId));
  if (!project) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Control de Materiales</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Proyecto no encontrado.</p>
        </CardContent>
      </Card>
    );
  }

  const materialsData = [
    {
      name: "Cemento Portland",
      quantity: `${Math.max(80, Math.round(project.teamSize * 12))} bolsas`,
      location: "Almacén Principal",
      status: project.progress < 25 ? "in-stock" : "in-use",
      allocated: "Cimentación",
    },
    {
      name: "Hierro 12mm",
      quantity: `${Math.max(600, Math.round(project.teamSize * 90))} metros`,
      location: project.progress > 40 ? "Zona de Obra" : "Almacén Principal",
      status: project.progress > 35 ? "in-use" : "ordered",
      allocated: "Estructura",
    },
    {
      name: "Ladrillos",
      quantity: `${Math.max(3000, Math.round(project.teamSize * 260))} unidades`,
      location: project.progress > 60 ? "Zona de Obra" : "Pendiente",
      status: project.progress > 70 ? "low" : "ordered",
      allocated: "Mampostería",
    },
    {
      name: "Arena Fina",
      quantity: `${Math.max(20, Math.round(project.teamSize * 1.8))} m³`,
      location: "Almacén Secundario",
      status: project.progress > 80 ? "low" : "in-stock",
      allocated: "Acabados",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Control de Materiales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {materialsData.map((material, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <Package className="h-8 w-8 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">{material.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {material.location}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium">{material.quantity}</p>
                  <p className="text-sm text-muted-foreground">
                    Para: {material.allocated}
                  </p>
                </div>
                <Badge
                  variant={
                    material.status === "in-stock" ? "default" :
                    material.status === "in-use" ? "secondary" :
                    material.status === "ordered" ? "outline" :
                    "destructive"
                  }
                >
                  {material.status === "in-stock" ? "En Stock" :
                   material.status === "in-use" ? "En Uso" :
                   material.status === "ordered" ? "Pedido" :
                   "Stock Bajo"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
