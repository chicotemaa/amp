"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    BudgetItem,
    BudgetCategory,
    BUDGET_CATEGORY_LABELS,
    itemTotalActual,
    itemTotalPlanned,
} from "@/lib/types/budget";

interface BudgetChartProps {
    items: BudgetItem[];
}

export function BudgetChart({ items }: BudgetChartProps) {
    const categories: BudgetCategory[] = [
        "materials",
        "labor",
        "equipment",
        "services",
        "subcontracts",
        "contingency",
    ];

    const data = categories
        .map((cat) => {
            const catItems = items.filter((i) => i.category === cat);
            const planned = catItems.reduce((s, i) => s + itemTotalPlanned(i), 0);
            const actual = catItems.reduce((s, i) => s + itemTotalActual(i), 0);
            return { name: BUDGET_CATEGORY_LABELS[cat], planned, actual };
        })
        .filter((d) => d.planned > 0 || d.actual > 0);

    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Distribución del Presupuesto</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                    Agregá ítems para ver el gráfico
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Planificado vs. Ejecutado por Categoría</CardTitle>
                <CardDescription>Comparativa de gasto presupuestado y real en USD</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                tick={{ fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                formatter={(value: number) =>
                                    new Intl.NumberFormat("es-AR", {
                                        style: "currency",
                                        currency: "USD",
                                        maximumFractionDigits: 0,
                                    }).format(value)
                                }
                            />
                            <Legend />
                            <Bar
                                dataKey="planned"
                                name="Planificado"
                                fill="hsl(var(--primary))"
                                radius={[4, 4, 0, 0]}
                                opacity={0.8}
                            />
                            <Bar
                                dataKey="actual"
                                name="Ejecutado"
                                fill="hsl(var(--secondary))"
                                radius={[4, 4, 0, 0]}
                                opacity={0.9}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
