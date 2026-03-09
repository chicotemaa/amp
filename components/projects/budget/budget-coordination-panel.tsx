"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { BudgetItem } from "@/lib/types/budget";
import { BUDGET_CATEGORY_LABELS } from "@/lib/types/budget";
import type { Transaction, TransactionCategory, TransactionType } from "@/lib/types/cashflow";
import { TRANSACTION_CATEGORY_LABELS } from "@/lib/types/cashflow";
import { createTransaction, getTransactionsDb } from "@/lib/api/cashflow";
import { getProjectByIdDb } from "@/lib/api/projects";
import { getMaterialsByProjectDb } from "@/lib/api/materials";

interface BudgetCoordinationPanelProps {
  projectId: string;
  items: BudgetItem[];
  onAddBudgetItem: (item: Omit<BudgetItem, "id">) => void;
}

const money = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export function BudgetCoordinationPanel({
  projectId,
  items,
  onAddBudgetItem,
}: BudgetCoordinationPanelProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [materialsCount, setMaterialsCount] = useState(0);
  const [materialsLowStockCount, setMaterialsLowStockCount] = useState(0);
  const [projectName, setProjectName] = useState<string>("Proyecto");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [txnType, setTxnType] = useState<TransactionType>("egreso");
  const [txnCategory, setTxnCategory] = useState<TransactionCategory>("materials");
  const [txnAmount, setTxnAmount] = useState<number>(0);
  const [txnDate, setTxnDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [txnDescription, setTxnDescription] = useState("");
  const [materialDescription, setMaterialDescription] = useState("");
  const [materialUnit, setMaterialUnit] = useState("u");
  const [materialQtyPlanned, setMaterialQtyPlanned] = useState<number>(0);
  const [materialPricePlanned, setMaterialPricePlanned] = useState<number>(0);
  const [materialQtyActual, setMaterialQtyActual] = useState<number>(0);
  const [materialPriceActual, setMaterialPriceActual] = useState<number>(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [allTx, materials, project] = await Promise.all([
        getTransactionsDb(),
        getMaterialsByProjectDb(Number(projectId)),
        getProjectByIdDb(Number(projectId)),
      ]);

      setTransactions(allTx.filter((tx) => tx.projectId === Number(projectId)));
      setMaterialsCount(materials.length);
      setMaterialsLowStockCount(
        materials.filter((material) => material.currentStock <= material.reorderPoint).length
      );
      setProjectName(project?.name ?? `Proyecto ${projectId}`);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const budgetPlanned = items.reduce(
      (sum, item) => sum + item.qtyPlanned * item.priceUnitPlanned,
      0
    );
    const budgetActual = items.reduce(
      (sum, item) => sum + item.qtyActual * item.priceUnitActual,
      0
    );

    const income = transactions
      .filter((tx) => tx.type === "ingreso")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expenses = transactions
      .filter((tx) => tx.type === "egreso")
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      budgetPlanned,
      budgetActual,
      budgetDelta: budgetActual - budgetPlanned,
      income,
      expenses,
      net: income - expenses,
    };
  }, [items, transactions]);

  const budgetByCategory = useMemo(() => {
    return items.reduce<Record<string, { planned: number; actual: number }>>((acc, item) => {
      const planned = item.qtyPlanned * item.priceUnitPlanned;
      const actual = item.qtyActual * item.priceUnitActual;
      if (!acc[item.category]) acc[item.category] = { planned: 0, actual: 0 };
      acc[item.category].planned += planned;
      acc[item.category].actual += actual;
      return acc;
    }, {});
  }, [items]);

  const handleCreateTransaction = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await createTransaction({
        type: txnType,
        category: txnCategory,
        amount: Number(txnAmount),
        date: txnDate,
        description: txnDescription.trim(),
        projectId: Number(projectId),
        projectName,
      });
      toast.success("Movimiento financiero registrado.");
      setTxnAmount(0);
      setTxnDescription("");
      await load();
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo registrar el movimiento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMaterialCost = (event: React.FormEvent) => {
    event.preventDefault();
    if (!materialDescription.trim()) {
      toast.error("Completá la descripción del material.");
      return;
    }
    if (materialQtyPlanned <= 0 || materialPricePlanned <= 0) {
      toast.error("La cantidad y el costo planificado deben ser mayores a cero.");
      return;
    }

    onAddBudgetItem({
      category: "materials",
      description: materialDescription.trim(),
      unit: materialUnit.trim() || "u",
      qtyPlanned: materialQtyPlanned,
      priceUnitPlanned: materialPricePlanned,
      qtyActual: materialQtyActual > 0 ? materialQtyActual : materialQtyPlanned,
      priceUnitActual: materialPriceActual > 0 ? materialPriceActual : materialPricePlanned,
    });

    setMaterialDescription("");
    setMaterialUnit("u");
    setMaterialQtyPlanned(0);
    setMaterialPricePlanned(0);
    setMaterialQtyActual(0);
    setMaterialPriceActual(0);
    toast.success("Costo de material agregado al presupuesto técnico.");
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Control Presupuestario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Plan: <strong>{money(totals.budgetPlanned)}</strong></p>
            <p>Real: <strong>{money(totals.budgetActual)}</strong></p>
            <p>
              Desvío:{" "}
              <strong className={totals.budgetDelta > 0 ? "text-red-600" : "text-green-600"}>
                {money(totals.budgetDelta)}
              </strong>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingresos / Egresos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Ingresos: <strong>{money(totals.income)}</strong></p>
            <p>Egresos: <strong>{money(totals.expenses)}</strong></p>
            <p>
              Resultado:{" "}
              <strong className={totals.net >= 0 ? "text-green-600" : "text-red-600"}>
                {money(totals.net)}
              </strong>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Materiales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Materiales activos: <strong>{materialsCount}</strong></p>
            <p>Con stock crítico: <strong>{materialsLowStockCount}</strong></p>
            <Badge variant={materialsLowStockCount > 0 ? "destructive" : "secondary"}>
              {materialsLowStockCount > 0 ? "Requiere reposición" : "Stock estable"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Carga Rápida de Costos de Materiales</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3" onSubmit={handleAddMaterialCost}>
              <div className="space-y-1.5">
                <Label htmlFor="materialDescription">Material</Label>
                <Input
                  id="materialDescription"
                  value={materialDescription}
                  onChange={(e) => setMaterialDescription(e.target.value)}
                  placeholder="Ej: Acero ADN 420 - 12mm"
                  required
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="materialUnit">Unidad</Label>
                  <Input
                    id="materialUnit"
                    value={materialUnit}
                    onChange={(e) => setMaterialUnit(e.target.value)}
                    placeholder="kg / m3 / bolsas / un"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="materialQtyPlanned">Cantidad planificada</Label>
                  <Input
                    id="materialQtyPlanned"
                    type="number"
                    min={0}
                    step={0.01}
                    value={materialQtyPlanned}
                    onChange={(e) => setMaterialQtyPlanned(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="materialPricePlanned">Costo unitario plan. (USD)</Label>
                  <Input
                    id="materialPricePlanned"
                    type="number"
                    min={0}
                    step={0.01}
                    value={materialPricePlanned}
                    onChange={(e) => setMaterialPricePlanned(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="materialQtyActual">Cantidad real (opcional)</Label>
                  <Input
                    id="materialQtyActual"
                    type="number"
                    min={0}
                    step={0.01}
                    value={materialQtyActual}
                    onChange={(e) => setMaterialQtyActual(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="materialPriceActual">Costo unitario real (opcional)</Label>
                <Input
                  id="materialPriceActual"
                  type="number"
                  min={0}
                  step={0.01}
                  value={materialPriceActual}
                  onChange={(e) => setMaterialPriceActual(Number(e.target.value))}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit">Agregar al Presupuesto</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registrar Ingreso / Egreso</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3" onSubmit={handleCreateTransaction}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="txnType">Tipo</Label>
                  <select
                    id="txnType"
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={txnType}
                    onChange={(e) => setTxnType(e.target.value as TransactionType)}
                  >
                    <option value="ingreso">Ingreso</option>
                    <option value="egreso">Egreso</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="txnCategory">Categoría</Label>
                  <select
                    id="txnCategory"
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={txnCategory}
                    onChange={(e) => setTxnCategory(e.target.value as TransactionCategory)}
                  >
                    {Object.entries(TRANSACTION_CATEGORY_LABELS).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="txnAmount">Monto (USD)</Label>
                  <Input
                    id="txnAmount"
                    type="number"
                    min={0}
                    step={0.01}
                    value={txnAmount}
                    onChange={(e) => setTxnAmount(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="txnDate">Fecha</Label>
                  <Input
                    id="txnDate"
                    type="date"
                    value={txnDate}
                    onChange={(e) => setTxnDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="txnDescription">Descripción</Label>
                <Textarea
                  id="txnDescription"
                  rows={2}
                  value={txnDescription}
                  onChange={(e) => setTxnDescription(e.target.value)}
                  placeholder="Ej: Compra de hormigón / anticipo de cliente / pago subcontrato..."
                  required
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Registrar Movimiento"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Movimientos del Proyecto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[360px] overflow-auto">
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin movimientos cargados.</p>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="rounded-md border p-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={tx.type === "ingreso" ? "secondary" : "outline"}>
                      {tx.type}
                    </Badge>
                    <span className={tx.type === "ingreso" ? "text-green-600" : "text-red-600"}>
                      {money(tx.amount)}
                    </span>
                  </div>
                  <p className="mt-1">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.date).toLocaleDateString("es-AR")} ·{" "}
                    {TRANSACTION_CATEGORY_LABELS[tx.category]}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumen de Coordinación por Rubro</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {Object.entries(BUDGET_CATEGORY_LABELS).map(([category, label]) => {
            const summary = budgetByCategory[category] ?? { planned: 0, actual: 0 };
            const delta = summary.actual - summary.planned;
            return (
              <div
                key={category}
                className="grid grid-cols-1 gap-1 rounded-md border p-3 text-sm sm:grid-cols-4 sm:items-center"
              >
                <span className="font-medium">{label}</span>
                <span>Plan: {money(summary.planned)}</span>
                <span>Real: {money(summary.actual)}</span>
                <span className={delta > 0 ? "text-red-600" : "text-green-600"}>
                  Desvío: {money(delta)}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
