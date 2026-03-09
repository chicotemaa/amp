"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, FileText, Activity } from "lucide-react";
import { getProjectsDb } from "@/lib/api/projects";
import { getClientsDb } from "@/lib/api/clients";
import { getReportsDb } from "@/lib/api/reports";
import { Project } from "@/lib/types/project";
import { Client } from "@/lib/types/client";
import { Report } from "@/lib/types/report";

export function Overview() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([getProjectsDb(), getClientsDb(), getReportsDb()])
      .then(([projectsData, clientsData, reportsData]) => {
        if (!mounted) return;
        setProjects(projectsData);
        setClients(clientsData);
        setReports(reportsData);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const { totalProjects, inProgress, inPlanning, completed, progressRate, totalClients, totalReports, pendingReports } = useMemo(() => {
    const active = projects.filter((p) => p.status === "in-progress");
    const progress = active.length > 0
      ? Math.round(active.reduce((sum, p) => sum + p.progress, 0) / active.length)
      : 0;

    return {
      totalProjects: projects.length,
      inProgress: active.length,
      inPlanning: projects.filter((p) => p.status === "planning").length,
      completed: projects.filter((p) => p.status === "completed").length,
      progressRate: progress,
      totalClients: clients.length,
      totalReports: reports.length,
      pendingReports: reports.filter((r) => r.status === "pending").length,
    };
  }, [projects, clients, reports]);

  const stats = [
    {
      title: "Proyectos",
      value: String(totalProjects),
      description: `${inProgress} en ejecución · ${inPlanning} en planificación · ${completed} completado`,
      icon: Building2,
      color: "text-blue-500",
    },
    {
      title: "Clientes",
      value: String(totalClients),
      description: `${clients.filter((c) => c.status === "Activo").length} activos este mes`,
      icon: Users,
      color: "text-green-500",
    },
    {
      title: "Reportes",
      value: String(totalReports),
      description: `${pendingReports} pendientes de revisión`,
      icon: FileText,
      color: "text-orange-500",
    },
    {
      title: "Progreso Promedio",
      value: `${progressRate}%`,
      description: "Proyectos en ejecución",
      icon: Activity,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {isLoading && (
        <div className="col-span-full text-sm text-muted-foreground">Cargando indicadores...</div>
      )}
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
