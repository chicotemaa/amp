"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Building2, CircleDollarSign, FileText, Users } from "lucide-react";
import { getProjectsDb } from "@/lib/api/projects";
import { getClientsDb } from "@/lib/api/clients";
import { getReportsDb } from "@/lib/api/reports";
import { getPortfolioControlSummariesDb } from "@/lib/api/project-control";
import { Project } from "@/lib/types/project";
import { Client } from "@/lib/types/client";
import { Report } from "@/lib/types/report";
import type { ProjectControlSummary } from "@/lib/types/project-control";
import { can, type AppRole } from "@/lib/auth/roles";

interface OverviewProps {
  role: AppRole | null;
}

export function Overview({ role }: OverviewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [projectControlRows, setProjectControlRows] = useState<ProjectControlSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const money = useMemo(
    () =>
      new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }),
    []
  );

  const load = useCallback(() => {
    let mounted = true;

    void Promise.all([
      getProjectsDb(),
      getClientsDb(),
      getReportsDb(),
      getPortfolioControlSummariesDb(),
    ])
      .then(([projectsData, clientsData, reportsData, controlData]) => {
        if (!mounted) return;
        setProjects(projectsData);
        setClients(clientsData);
        setReports(reportsData);
        setProjectControlRows(controlData);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const cleanup = load();
    const handleUpdated = () => {
      setIsLoading(true);
      load();
    };

    window.addEventListener("projectLaborUpdated", handleUpdated);
    window.addEventListener("projectProcurementUpdated", handleUpdated);
    window.addEventListener("projectRevenueUpdated", handleUpdated);
    window.addEventListener("projectContractsUpdated", handleUpdated);

    return () => {
      cleanup();
      window.removeEventListener("projectLaborUpdated", handleUpdated);
      window.removeEventListener("projectProcurementUpdated", handleUpdated);
      window.removeEventListener("projectRevenueUpdated", handleUpdated);
      window.removeEventListener("projectContractsUpdated", handleUpdated);
    };
  }, [load]);

  const {
    totalProjects,
    inProgress,
    inPlanning,
    completed,
    progressRate,
    totalClients,
    totalReports,
    pendingReports,
    pendingCollections,
    overdueCollections,
    projectsWithOverdueCollections,
    projectedMargin,
    projectsWithNegativeMargin,
  } = useMemo(() => {
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
      pendingCollections: projectControlRows.reduce(
        (sum, row) => sum + row.pendingCollectionAmount,
        0
      ),
      overdueCollections: projectControlRows.reduce(
        (sum, row) => sum + row.overdueCollectionAmount,
        0
      ),
      projectsWithOverdueCollections: projectControlRows.filter(
        (row) => row.overdueCollectionAmount > 0
      ).length,
      projectedMargin: projectControlRows.reduce(
        (sum, row) => sum + (row.projectedContractMargin ?? 0),
        0
      ),
      projectsWithNegativeMargin: projectControlRows.filter(
        (row) =>
          row.projectedContractMargin !== null && row.projectedContractMargin < 0
      ).length,
    };
  }, [projects, clients, reports, projectControlRows]);

  const stats = [
    {
      title: "Proyectos",
      value: String(totalProjects),
      description: `${inProgress} en ejecución · ${inPlanning} en planificación · ${completed} completado`,
      icon: Building2,
      color: "text-blue-500",
      visible: true,
    },
    {
      title: "Clientes",
      value: String(totalClients),
      description: `${clients.filter((c) => c.status === "Activo").length} activos este mes`,
      icon: Users,
      color: "text-green-500",
      visible: can(role, "clients.view"),
    },
    {
      title: "Reportes",
      value: String(totalReports),
      description: `${pendingReports} pendientes de revisión`,
      icon: FileText,
      color: "text-orange-500",
      visible: can(role, "reports.view"),
    },
    {
      title: "Progreso Promedio",
      value: `${progressRate}%`,
      description: "Proyectos en ejecución",
      icon: Activity,
      color: "text-purple-500",
      visible: can(role, "dashboard.view_operational"),
    },
    {
      title: "Cobranzas",
      value: money.format(pendingCollections),
      description: `${money.format(overdueCollections)} vencido · ${projectsWithOverdueCollections} obras con alerta`,
      icon: CircleDollarSign,
      color: "text-emerald-500",
      visible: can(role, "dashboard.view_financial"),
    },
    {
      title: "Margen Proyectado",
      value: money.format(projectedMargin),
      description: `${projectsWithNegativeMargin} obras con margen negativo`,
      icon: CircleDollarSign,
      color: "text-cyan-500",
      visible: can(role, "dashboard.view_financial"),
    },
  ].filter((stat) => stat.visible);

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
