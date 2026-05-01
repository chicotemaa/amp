"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReceiptText, Calculator, RefreshCcw } from "lucide-react";
import type { BudgetOfferStructure } from "@/lib/types/budget-computo";

interface BudgetOfferStructureCardProps {
  offer: BudgetOfferStructure | null;
  constructionSubtotal: number;
  onSave: (data: Omit<BudgetOfferStructure, "id" | "budgetId">) => void;
}

const money = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(n);

export function BudgetOfferStructureCard({
  offer,
  constructionSubtotal,
  onSave,
}: BudgetOfferStructureCardProps) {
  const [ggPct, setGgPct] = useState(offer?.generalExpensesPct ?? 15);
  const [profitPct, setProfitPct] = useState(offer?.profitPct ?? 10);
  const [taxesPct, setTaxesPct] = useState(offer?.taxesPct ?? 10.5);

  useEffect(() => {
    if (offer) {
      setGgPct(offer.generalExpensesPct);
      setProfitPct(offer.profitPct);
      setTaxesPct(offer.taxesPct);
    }
  }, [offer]);

  const ggAmount = constructionSubtotal * (ggPct / 100);
  const subtotal2 = constructionSubtotal + ggAmount;
  const profitAmount = subtotal2 * (profitPct / 100);
  const subtotal3 = subtotal2 + profitAmount;
  const taxesAmount = subtotal3 * (taxesPct / 100);
  const finalPrice = subtotal3 + taxesAmount;

  const handleRecalculate = () => {
    onSave({
      subtotalConstruction: constructionSubtotal,
      generalExpensesPct: ggPct,
      generalExpensesAmount: ggAmount,
      profitPct,
      profitAmount,
      taxesPct,
      taxesAmount,
      finalPrice,
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <ReceiptText className="h-5 w-5 text-primary" />
          <CardTitle>Estructura de Oferta</CardTitle>
        </div>
        <Button size="sm" variant="outline" onClick={handleRecalculate}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Recalcular y Guardar
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Row: Subtotal Viviendas */}
        <div className="flex items-center justify-between py-3 border-b">
          <span className="text-sm font-medium">Subtotal de Construcción</span>
          <span className="text-sm font-bold">{money(constructionSubtotal)}</span>
        </div>

        {/* Subtotal 1 */}
        <div className="flex items-center justify-between py-2 bg-muted/30 rounded px-3">
          <span className="text-sm font-semibold">Subtotal 1</span>
          <span className="text-sm font-bold">{money(constructionSubtotal)}</span>
        </div>

        {/* Gastos Generales */}
        <div className="flex items-center justify-between py-3 border-b">
          <div className="flex items-center gap-3">
            <span className="text-sm">Gastos Generales</span>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={ggPct}
                onChange={(e) => setGgPct(Number(e.target.value))}
                className="w-20 h-8 text-right text-sm"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <span className="text-sm font-medium">{money(ggAmount)}</span>
        </div>

        {/* Subtotal 2 */}
        <div className="flex items-center justify-between py-2 bg-muted/30 rounded px-3">
          <span className="text-sm font-semibold">Subtotal 2</span>
          <span className="text-sm font-bold">{money(subtotal2)}</span>
        </div>

        {/* Beneficio */}
        <div className="flex items-center justify-between py-3 border-b">
          <div className="flex items-center gap-3">
            <span className="text-sm">Beneficio</span>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={profitPct}
                onChange={(e) => setProfitPct(Number(e.target.value))}
                className="w-20 h-8 text-right text-sm"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <span className="text-sm font-medium">{money(profitAmount)}</span>
        </div>

        {/* Subtotal 3 */}
        <div className="flex items-center justify-between py-2 bg-muted/30 rounded px-3">
          <span className="text-sm font-semibold">Subtotal 3</span>
          <span className="text-sm font-bold">{money(subtotal3)}</span>
        </div>

        {/* Impuestos */}
        <div className="flex items-center justify-between py-3 border-b">
          <div className="flex items-center gap-3">
            <span className="text-sm">Impuestos</span>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={taxesPct}
                onChange={(e) => setTaxesPct(Number(e.target.value))}
                className="w-20 h-8 text-right text-sm"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <span className="text-sm font-medium">{money(taxesAmount)}</span>
        </div>

        {/* Final Price */}
        <div className="flex items-center justify-between py-4 bg-primary/5 border border-primary/20 rounded-lg px-4">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <span className="text-base font-bold">PRECIO FINAL</span>
          </div>
          <span className="text-xl font-bold text-primary">
            {money(finalPrice)}
          </span>
        </div>

        {/* Coefficient */}
        {constructionSubtotal > 0 && (
          <div className="text-right text-xs text-muted-foreground">
            Coeficiente: {(finalPrice / constructionSubtotal).toFixed(6)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
