"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

const transactions = [
  {
    id: 1,
    type: "ingreso",
    description: "Pago inicial - Torre Residencial",
    amount: 150000,
    date: "2024-03-18",
    category: "contracts",
    project: "Torre Residencial Marina"
  },
  {
    id: 2,
    type: "egreso",
    description: "Compra de materiales construcción",
    amount: 45000,
    date: "2024-03-17",
    category: "materials",
    project: "Centro Comercial Plaza Norte"
  },
  {
    id: 3,
    type: "egreso",
    description: "Pago nómina empleados",
    amount: 35000,
    date: "2024-03-16",
    category: "labor",
    project: "Complejo Deportivo Olímpico"
  },
  {
    id: 4,
    type: "egreso",
    description: "Servicios públicos",
    amount: 2500,
    date: "2024-03-15",
    category: "services",
    project: "General"
  },
  {
    id: 5,
    type: "ingreso",
    description: "Pago parcial - Centro Comercial",
    amount: 200000,
    date: "2024-03-14",
    category: "contracts",
    project: "Centro Comercial Plaza Norte"
  }
];

export function CashflowTransactions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Últimas Transacciones</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {transaction.type === "ingreso" ? (
                    <ArrowUpCircle className="h-8 w-8 text-success" />
                  ) : (
                    <ArrowDownCircle className="h-8 w-8 text-destructive" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{transaction.description}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {transaction.project}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={`text-sm font-medium ${
                  transaction.type === "ingreso" ? "text-success" : "text-destructive"
                }`}>
                  {transaction.type === "ingreso" ? "+" : "-"}
                  ${transaction.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}