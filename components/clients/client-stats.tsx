"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, Building, Bell } from "lucide-react";
import { getClientStatsDb } from "@/lib/api/clients";

export function ClientStats() {
  const [clientStats, setClientStats] = useState({
    total: 0,
    active: 0,
    potential: 0,
    totalProjects: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getClientStatsDb()
      .then((nextStats) => {
        if (!mounted) return;
        setClientStats(nextStats);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const { total, active, potential, totalProjects } = clientStats;
  const activeRatio = total > 0 ? Math.round((active / total) * 100) : 0;

  const cards = [
    {
      title: "Total Clientes",
      value: String(total),
      description: "Clientes registrados",
      icon: Users,
    },
    {
      title: "Clientes Activos",
      value: String(active),
      description: `${activeRatio}% del total`,
      icon: UserPlus,
    },
    {
      title: "Proyectos Asociados",
      value: String(totalProjects),
      description: "Entre todos los clientes",
      icon: Building,
    },
    {
      title: "Potenciales",
      value: String(potential),
      description: "En proceso de captación",
      icon: Bell,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "..." : stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
