import { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RevenueChart } from "@/components/reports/revenue-chart";
import { ProjectTimeline } from "@/components/reports/project-timeline";
import { ResourceUtilization } from "@/components/reports/resource-utilization";

export const metadata: Metadata = {
  title: "Informes | ArchiPro",
  description: "Panel de análisis e informes de proyectos",
};

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="font-montserrat text-3xl font-bold tracking-tight">Informes y Análisis</h1>
        <p className="text-muted-foreground">
          Visión general del rendimiento de proyectos y utilización de recursos
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Ingresos</CardTitle>
            <CardDescription>Desglose mensual de ingresos por proyecto</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Cronograma de Proyectos</CardTitle>
              <CardDescription>Estado de finalización y plazos</CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectTimeline />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Utilización de Recursos</CardTitle>
              <CardDescription>Métricas de asignación de equipo y recursos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResourceUtilization />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}