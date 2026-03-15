"use client";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { getTransactionsDb } from "@/lib/api/cashflow";
import { TRANSACTION_CATEGORY_LABELS, Transaction } from "@/lib/types/cashflow";
import { useEffect, useState, useCallback } from "react";
import { useFilters } from "@/contexts/filter-context";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export function CashflowTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { filters } = useFilters();

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      let data = await getTransactionsDb();
      if (filters.status && filters.status.length > 0 && !filters.status.includes("all")) {
        data = data.filter((t) => t.projectId != null && filters.status.includes(t.projectId.toString()));
      }
      if (filters.type && filters.type.length > 0 && !filters.type.includes("all")) {
        data = data.filter((t) => filters.type.includes(t.type) || filters.type.includes("all"));
      }
      setTransactions(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTransactions();

    const handleUpdated = () => {
      fetchTransactions();
    };
    window.addEventListener("transactionCreated", handleUpdated);
    window.addEventListener("projectLaborUpdated", handleUpdated);
    window.addEventListener("projectProcurementUpdated", handleUpdated);
    window.addEventListener("projectRevenueUpdated", handleUpdated);
    return () => {
      window.removeEventListener("transactionCreated", handleUpdated);
      window.removeEventListener("projectLaborUpdated", handleUpdated);
      window.removeEventListener("projectProcurementUpdated", handleUpdated);
      window.removeEventListener("projectRevenueUpdated", handleUpdated);
    };
  }, [fetchTransactions]);

  if (isLoading) {
    return <div className="text-center p-4">Cargando transacciones...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Proyecto</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Monto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                {t.type === "ingreso" ? (
                  <div className="flex items-center gap-1 text-green-500">
                    <ArrowUpCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Ingreso</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-500">
                    <ArrowDownCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Egreso</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">{t.description}</TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground max-w-[160px] truncate block">
                  {t.projectName}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {TRANSACTION_CATEGORY_LABELS[t.category]}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(t.date).toLocaleDateString("es-AR")}
              </TableCell>
              <TableCell className={`text-right font-bold ${t.type === "ingreso" ? "text-green-500" : "text-red-500"}`}>
                {t.type === "ingreso" ? "+" : "-"}
                {fmt(t.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
