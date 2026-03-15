"use client";

import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getCashflowChartDataDb } from "@/lib/api/cashflow";
import type { MonthlyCashflow } from "@/lib/types/cashflow";

const MONTH_ORDER = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function getMonthRank(month: string) {
  return MONTH_ORDER.indexOf(month.toLowerCase().replace(".", ""));
}

export function RevenueChart() {
  const [data, setData] = useState<Array<{ month: string; revenue: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const rows = await getCashflowChartDataDb();
        if (!mounted) return;

        const revenueSeries = [...rows]
          .sort((a, b) => getMonthRank(a.month) - getMonthRank(b.month))
          .map((row: MonthlyCashflow) => ({
            month: row.month,
            revenue: row.ingresos,
          }));

        setData(revenueSeries);
        if (mounted) setIsLoading(false);
    };

    void load();

    const handleUpdated = () => {
      setIsLoading(true);
      void load();
    };

    window.addEventListener("transactionCreated", handleUpdated);
    window.addEventListener("projectLaborUpdated", handleUpdated);
    window.addEventListener("projectProcurementUpdated", handleUpdated);
    window.addEventListener("projectRevenueUpdated", handleUpdated);

    return () => {
      mounted = false;
      window.removeEventListener("transactionCreated", handleUpdated);
      window.removeEventListener("projectLaborUpdated", handleUpdated);
      window.removeEventListener("projectProcurementUpdated", handleUpdated);
      window.removeEventListener("projectRevenueUpdated", handleUpdated);
    };
  }, []);

  return (
    <div className="h-[400px]">
      {isLoading ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Cargando ingresos...
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
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Ingresos"]} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ strokeWidth: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
