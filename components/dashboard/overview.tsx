"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, FileText, Activity } from "lucide-react";
import { useTheme } from "next-themes";

const stats = [
  {
    title: "Proyectos Activos",
    value: "12",
    description: "3 nuevos este mes",
    icon: Building2,
    color: "text-blue-500",
  },
  {
    title: "Clientes",
    value: "48",
    description: "+12% desde el último mes",
    icon: Users,
    color: "text-green-500",
  },
  {
    title: "Reportes",
    value: "24",
    description: "8 pendientes de revisión",
    icon: FileText,
    color: "text-orange-500",
  },
  {
    title: "Tasa de Progreso",
    value: "92%",
    description: "Por encima del objetivo",
    icon: Activity,
    color: "text-purple-500",
  },
];

export function Overview() {
  const { theme } = useTheme();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}