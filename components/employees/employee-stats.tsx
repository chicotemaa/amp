"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Clock, Briefcase } from "lucide-react";
import { getEmployeeStatsDb } from "@/lib/api/employees";

export function EmployeeStats() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inProject: 0,
    hoursThisWeek: 0,
    activeProjects: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getEmployeeStatsDb()
      .then((nextStats) => {
        if (!mounted) return;
        setStats(nextStats);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const inProjectRatio = stats.total > 0 ? Math.round((stats.inProject / stats.total) * 100) : 0;

  const cards = [
    {
      title: "Total Empleados",
      value: String(stats.total),
      description: "Equipo registrado",
      icon: Users,
    },
    {
      title: "Activos en Proyectos",
      value: String(stats.inProject),
      description: `${inProjectRatio}% del equipo`,
      icon: UserCheck,
    },
    {
      title: "Horas Registradas",
      value: stats.hoursThisWeek.toLocaleString(),
      description: "Esta semana",
      icon: Clock,
    },
    {
      title: "Proyectos Activos",
      value: String(stats.activeProjects),
      description: "Con personal asignado",
      icon: Briefcase,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "..." : card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
