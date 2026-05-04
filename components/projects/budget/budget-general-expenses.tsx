"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Landmark, Save, Plus, Trash2 } from "lucide-react";
import type { BudgetGeneralExpense } from "@/lib/types/budget-computo";

interface BudgetGeneralExpensesTableProps {
  expenses: BudgetGeneralExpense[];
  projectMonths: number;
  onSave: (expenses: Omit<BudgetGeneralExpense, "id" | "budgetId">[]) => void;
}

const money = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);

export function BudgetGeneralExpensesTable({
  expenses: initialExpenses,
  projectMonths,
  onSave,
}: BudgetGeneralExpensesTableProps) {
  const months = Math.max(projectMonths, 1);
  const [expenses, setExpenses] = useState<
    Omit<BudgetGeneralExpense, "id" | "budgetId">[]
  >(
    initialExpenses.map((e) => ({
      concept: e.concept,
      monthAmounts: [
        ...e.monthAmounts,
        ...Array(Math.max(0, months - e.monthAmounts.length)).fill(0),
      ].slice(0, months),
      total: e.total,
      sortOrder: e.sortOrder,
    }))
  );

  useEffect(() => {
    setExpenses(
      initialExpenses.map((e) => ({
        concept: e.concept,
        monthAmounts: [
          ...e.monthAmounts,
          ...Array(Math.max(0, months - e.monthAmounts.length)).fill(0),
        ].slice(0, months),
        total: e.total,
        sortOrder: e.sortOrder,
      }))
    );
  }, [initialExpenses, months]);

  const updateMonthAmount = (
    expIdx: number,
    monthIdx: number,
    value: number
  ) => {
    setExpenses((prev) => {
      const next = [...prev];
      const exp = { ...next[expIdx] };
      exp.monthAmounts = [...exp.monthAmounts];
      exp.monthAmounts[monthIdx] = value;
      exp.total = exp.monthAmounts.reduce((s, v) => s + v, 0);
      next[expIdx] = exp;
      return next;
    });
  };

  const updateConcept = (expIdx: number, concept: string) => {
    setExpenses((prev) => {
      const next = [...prev];
      next[expIdx] = { ...next[expIdx], concept };
      return next;
    });
  };

  const addExpense = () => {
    setExpenses((prev) => [
      ...prev,
      {
        concept: "",
        monthAmounts: Array(months).fill(0),
        total: 0,
        sortOrder: prev.length,
      },
    ]);
  };

  const removeExpense = (idx: number) => {
    setExpenses((prev) => prev.filter((_, i) => i !== idx));
  };

  const monthTotals = Array.from({ length: months }, (_, monthIdx) =>
    expenses.reduce((sum, exp) => sum + (exp.monthAmounts[monthIdx] ?? 0), 0)
  );

  const grandTotal = expenses.reduce((sum, exp) => sum + exp.total, 0);

  const handleSave = () => {
    onSave(expenses.map((e, i) => ({ ...e, sortOrder: i })));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Landmark className="h-5 w-5 text-orange-500" />
          <div>
            <CardTitle>Gastos Generales</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Desglose mensual — {months} meses de obra
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-base font-bold px-3 py-1">
            Total: {money(grandTotal)}
          </Badge>
          <Button size="sm" variant="outline" onClick={addExpense}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[250px] sticky left-0 bg-muted/30 z-10">
                  Concepto
                </TableHead>
                {Array.from({ length: months }, (_, i) => (
                  <TableHead key={i} className="text-right min-w-[120px]">
                    MES {i + 1}
                  </TableHead>
                ))}
                <TableHead className="text-right min-w-[130px] font-bold">
                  TOTAL
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((exp, expIdx) => (
                <TableRow key={expIdx} className="hover:bg-muted/10">
                  <TableCell className="sticky left-0 bg-background z-10">
                    <Input
                      value={exp.concept}
                      onChange={(e) => updateConcept(expIdx, e.target.value)}
                      placeholder="Concepto..."
                      className="h-8 text-sm w-full"
                    />
                  </TableCell>
                  {Array.from({ length: months }, (_, monthIdx) => (
                    <TableCell key={monthIdx} className="text-right">
                      <Input
                        type="number"
                        min={0}
                        step={100}
                        value={exp.monthAmounts[monthIdx] ?? 0}
                        onChange={(e) =>
                          updateMonthAmount(expIdx, monthIdx, Number(e.target.value))
                        }
                        className="w-28 h-8 text-right text-sm ml-auto"
                      />
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold text-sm">
                    {money(exp.total)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => removeExpense(expIdx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {/* Monthly totals row */}
              <TableRow className="bg-muted/20 font-bold border-t-2">
                <TableCell className="sticky left-0 bg-muted/20 z-10 text-sm">
                  TOTAL MENSUAL
                </TableCell>
                {monthTotals.map((total, i) => (
                  <TableCell key={i} className="text-right text-sm">
                    {money(total)}
                  </TableCell>
                ))}
                <TableCell className="text-right text-sm text-primary font-bold">
                  {money(grandTotal)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
