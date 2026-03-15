"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { getProjectsDb } from "@/lib/api/projects";

const STATUS_ORDER = [
  { key: "planning", label: "Planificacion" },
  { key: "in-progress", label: "En obra" },
  { key: "on-hold", label: "En pausa" },
  { key: "completed", label: "Completados" },
];

interface ProjectsOverviewProps {
  className?: string;
}

export function ProjectsOverview({ className }: ProjectsOverviewProps) {
  const [data, setData] = useState<{ name: string; total: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getProjectsDb()
      .then((projects) => {
        if (!mounted) return;

        const counts = STATUS_ORDER.map((status) => ({
          name: status.label,
          total: projects.filter((project) => project.status === status.key).length,
        }));

        setData(counts);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Resumen de Proyectos</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
            Cargando proyectos...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Bar
                dataKey="total"
                fill="currentColor"
                radius={[4, 4, 0, 0]}
                className="fill-primary"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
