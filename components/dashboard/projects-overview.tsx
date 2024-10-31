"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

const data = [
  {
    name: "Ene",
    total: 12,
  },
  {
    name: "Feb",
    total: 15,
  },
  {
    name: "Mar",
    total: 18,
  },
  {
    name: "Abr",
    total: 14,
  },
  {
    name: "May",
    total: 16,
  },
  {
    name: "Jun",
    total: 20,
  },
];

interface ProjectsOverviewProps {
  className?: string;
}

export function ProjectsOverview({ className }: ProjectsOverviewProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Resumen de Proyectos</CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}