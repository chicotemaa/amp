"use client";

import { useEffect, useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getCashflowChartDataDb } from "@/lib/api/cashflow";
import { MonthlyCashflow } from "@/lib/types/cashflow";

const fmt = (v: number) => `$${(v / 1000).toFixed(0)}k`;

export function CashflowOverview() {
  const [data, setData] = useState<MonthlyCashflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getCashflowChartDataDb()
      .then((rows) => {
        if (mounted) setData(rows);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen de Cashflow</CardTitle>
        <CardDescription>Flujo de ingresos y egresos mensual (USD)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Cargando datos...
            </div>
          ) : (
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
                tickFormatter={fmt}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `$${value.toLocaleString()}`,
                  name === "ingresos" ? "Ingresos" : "Egresos",
                ]}
              />
              <Line
                type="monotone"
                dataKey="ingresos"
                stroke="hsl(var(--success, 142 71% 45%))"
                strokeWidth={2}
                name="ingresos"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="egresos"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                name="egresos"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
