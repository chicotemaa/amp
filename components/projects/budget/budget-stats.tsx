"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { BudgetItem, itemTotalActual, itemTotalPlanned } from "@/lib/types/budget";
import { cn } from "@/lib/utils";

interface BudgetStatsProps {
    items: BudgetItem[];
}

export function BudgetStats({ items }: BudgetStatsProps) {
    const totalPlanned = items.reduce((sum, i) => sum + itemTotalPlanned(i), 0);
    const totalActual = items.reduce((sum, i) => sum + itemTotalActual(i), 0);
    const deviation = totalPlanned > 0 ? ((totalActual - totalPlanned) / totalPlanned) * 100 : 0;
    const remaining = totalPlanned - totalActual;

    const deviationColor =
        deviation <= 0
            ? "text-green-500"
            : deviation <= 10
                ? "text-yellow-500"
                : "text-red-500";

    const fmt = (n: number) =>
        new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

    const stats = [
        {
            title: "Presupuestado",
            value: fmt(totalPlanned),
            description: "Total planificado del proyecto",
            icon: Wallet,
            color: "text-blue-500",
        },
        {
            title: "Ejecutado",
            value: fmt(totalActual),
            description: "Gasto real acumulado",
            icon: DollarSign,
            color: "text-purple-500",
        },
        {
            title: "Desviación",
            value: `${deviation >= 0 ? "+" : ""}${deviation.toFixed(1)}%`,
            description: deviation <= 0 ? "Dentro del presupuesto" : "Por encima del presupuesto",
            icon: deviation >= 0 ? TrendingUp : TrendingDown,
            color: deviationColor,
        },
        {
            title: "Saldo Disponible",
            value: fmt(remaining),
            description: remaining >= 0 ? "Margen restante" : "Exceso de gasto",
            icon: TrendingDown,
            color: remaining >= 0 ? "text-green-500" : "text-red-500",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <Card key={stat.title} className="card-modern">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <Icon className={cn("h-4 w-4", stat.color)} />
                        </CardHeader>
                        <CardContent>
                            <div className={cn("text-2xl font-bold", stat.color)}>{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
