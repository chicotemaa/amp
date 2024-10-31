"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { month: "Ene", ingresos: 45000, egresos: 32000 },
  { month: "Feb", ingresos: 52000, egresos: 38000 },
  { month: "Mar", ingresos: 48000, egresos: 35000 },
  { month: "Abr", ingresos: 61000, egresos: 42000 },
  { month: "May", ingresos: 55000, egresos: 39000 },
  { month: "Jun", ingresos: 67000, egresos: 45000 },
];

export function CashflowOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen de Cashflow</CardTitle>
        <CardDescription>Flujo de ingresos y egresos mensual</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis
                dataKey="month"
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
                tickFormatter={(value) => `$${value/1000}k`}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              />
              <Line
                type="monotone"
                dataKey="ingresos"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                name="Ingresos"
              />
              <Line
                type="monotone"
                dataKey="egresos"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                name="Egresos"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}