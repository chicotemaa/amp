"use client";

import { useEffect, useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getTransactionsDb } from "@/lib/api/cashflow";
import { MonthlyCashflow } from "@/lib/types/cashflow";
import { useFilters } from "@/contexts/filter-context";

const fmt = (v: number) => `$${(v / 1000).toFixed(0)}k`;

export function CashflowOverview() {
  const [data, setData] = useState<MonthlyCashflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { filters } = useFilters();

  useEffect(() => {
    let mounted = true;
    getTransactionsDb()
      .then((txns) => {
        if (!mounted) return;

        // Apply filters
        let filtered = txns;
        if (filters.status && filters.status.length > 0 && !filters.status.includes("all")) {
          filtered = filtered.filter(t => t.projectId != null && filters.status.includes(t.projectId.toString()));
        }

        // Group by month
        const monthlyGroups: Record<string, MonthlyCashflow> = {};

        filtered.forEach(t => {
          const d = new Date(t.date);
          const monthKey = d.toLocaleString('es-AR', { month: 'short' });
          if (!monthlyGroups[monthKey]) {
            monthlyGroups[monthKey] = { month: monthKey, ingresos: 0, egresos: 0 };
          }
          if (t.type === 'ingreso') {
            monthlyGroups[monthKey].ingresos += t.amount;
          } else {
            monthlyGroups[monthKey].egresos += t.amount;
          }
        });

        // We want a sorted array of the last 6 months or similar, 
        // for simplicity let's just use the chronological order present in the data keys
        // assuming standard months. A proper implementation would sort by date.
        const result = Object.values(monthlyGroups);

        // Very basic sort by keeping the original chronological month order if possible,
        // or just by mapping from a predefined list of months:
        const monthOrder = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
        result.sort((a, b) => monthOrder.indexOf(a.month.toLowerCase().replace('.', '')) - monthOrder.indexOf(b.month.toLowerCase().replace('.', '')));

        setData(result);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [filters]);

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
