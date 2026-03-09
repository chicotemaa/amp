"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { ArrowUpCircle, ArrowDownCircle, Percent, TrendingUp } from "lucide-react";
import { getTransactionsDb } from "@/lib/api/cashflow";
import { Transaction } from "@/lib/types/cashflow";
import { useFilters } from "@/contexts/filter-context";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export function CashflowStats() {
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    margin: 0,
    projectedNextMonth: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { filters } = useFilters();

  const fetchStats = useCallback(async () => {
    try {
      const allData = await getTransactionsDb();

      let data = allData;
      // Filter by Project matching the logic standard
      if (filters.status && filters.status.length > 0 && !filters.status.includes("all")) {
        data = data.filter((t) => t.projectId != null && filters.status.includes(t.projectId.toString()));
      }

      const income = data.filter((t) => t.type === "ingreso");
      const expenses = data.filter((t) => t.type === "egreso");

      const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
      const netBalance = totalIncome - totalExpenses;
      const margin = totalIncome > 0 ? ((netBalance / totalIncome) * 100) : 0;
      const projectedNextMonth = Math.round(netBalance * 1.2);

      setStats({
        totalIncome,
        totalExpenses,
        netBalance,
        margin: Math.round(margin * 10) / 10,
        projectedNextMonth,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchStats();

    const handleTransactionCreated = () => {
      fetchStats();
    };
    window.addEventListener("transactionCreated", handleTransactionCreated);
    return () => window.removeEventListener("transactionCreated", handleTransactionCreated);
  }, [fetchStats]);

  const { totalIncome, totalExpenses, margin, projectedNextMonth } = stats;

  const cards = [
    {
      title: "Ingresos Totales",
      value: fmt(totalIncome),
      description: "Cobros del período actual",
      icon: ArrowUpCircle,
      iconClass: "text-green-500",
    },
    {
      title: "Egresos Totales",
      value: fmt(totalExpenses),
      description: "Pagos del período actual",
      icon: ArrowDownCircle,
      iconClass: "text-red-500",
    },
    {
      title: "Margen Neto",
      value: `${margin}%`,
      description: "Sobre el total facturado",
      icon: Percent,
      iconClass: "text-muted-foreground",
    },
    {
      title: "Proyección",
      value: fmt(projectedNextMonth),
      description: "Estimado mes siguiente",
      icon: TrendingUp,
      iconClass: "text-muted-foreground",
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
              <Icon className={`h-4 w-4 ${card.iconClass}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : card.value}
              </div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}