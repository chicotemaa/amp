"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package } from "lucide-react";

interface MaterialsTrackingProps {
  projectId: string;
}

const materialsData = [
  {
    name: "Cemento Portland",
    quantity: "200 bolsas",
    location: "Almacén Principal",
    status: "in-stock",
    nextDelivery: "2024-04-01",
    allocated: "Cimentación",
  },
  {
    name: "Hierro 12mm",
    quantity: "1500 metros",
    location: "Zona de Obra",
    status: "in-use",
    nextDelivery: "2024-04-15",
    allocated: "Estructura",
  },
  {
    name: "Ladrillos",
    quantity: "5000 unidades",
    location: "Pendiente",
    status: "ordered",
    nextDelivery: "2024-04-10",
    allocated: "Mampostería",
  },
  {
    name: "Arena Fina",
    quantity: "30 m³",
    location: "Almacén Secundario",
    status: "low",
    nextDelivery: "2024-04-05",
    allocated: "Revoque",
  },
];

export function MaterialsTracking({ projectId }: MaterialsTrackingProps) {
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