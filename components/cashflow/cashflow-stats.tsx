import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { ArrowUpCircle, ArrowDownCircle, Percent, TrendingUp } from "lucide-react";
import { getCashflowStats } from "@/lib/api/cashflow";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export function CashflowStats() {
  const { totalIncome, totalExpenses, margin, projectedNextMonth } = getCashflowStats();

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
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}