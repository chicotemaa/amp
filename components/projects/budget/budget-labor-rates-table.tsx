"use client";

import { useState } from "react";
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
import { HardHat, Save } from "lucide-react";
import type { BudgetLaborRate } from "@/lib/types/budget-computo";
import { LABOR_CATEGORY_LABELS, LaborCategory } from "@/lib/types/budget-computo";

interface BudgetLaborRatesTableProps {
  rates: BudgetLaborRate[];
  onSave: (rates: Omit<BudgetLaborRate, "id" | "budgetId">[]) => void;
}

const money = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(n);

function computeRate(r: {
  baseDailyPrice: number;
  attendanceBonusPct: number;
  socialChargesPct: number;
  artPct: number;
  otherPct: number;
}) {
  const totalImponible = r.baseDailyPrice * (1 + r.attendanceBonusPct / 100);
  const socialCharges = totalImponible * (r.socialChargesPct / 100);
  const art = totalImponible * (r.artPct / 100);
  const other = totalImponible * (r.otherPct / 100);
  const dailyCost = totalImponible + socialCharges + art + other;
  const hourlyCost = dailyCost / 8;
  return { dailyCost, hourlyCost };
}

export function BudgetLaborRatesTable({
  rates: initialRates,
  onSave,
}: BudgetLaborRatesTableProps) {
  const [rates, setRates] = useState(initialRates);

  const updateField = (
    idx: number,
    field: keyof BudgetLaborRate,
    value: number
  ) => {
    setRates((prev) => {
      const next = [...prev];
      const rate = { ...next[idx], [field]: value };

      // Recompute daily/hourly cost
      const computed = computeRate(rate);
      rate.dailyCost = Math.round(computed.dailyCost * 100) / 100;
      rate.hourlyCost = Math.round(computed.hourlyCost * 100) / 100;

      next[idx] = rate;
      return next;
    });
  };

  const handleSave = () => {
    onSave(
      rates.map((r) => ({
        category: r.category,
        baseDailyPrice: r.baseDailyPrice,
        attendanceBonusPct: r.attendanceBonusPct,
        socialChargesPct: r.socialChargesPct,
        artPct: r.artPct,
        otherPct: r.otherPct,
        dailyCost: r.dailyCost,
        hourlyCost: r.hourlyCost,
      }))
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <HardHat className="h-5 w-5 text-green-500" />
          <div>
            <CardTitle>Planilla de Mano de Obra</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Costos por categoría UOCRA — Planilla II
            </p>
          </div>
        </div>
        <Button size="sm" onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Guardar Tarifas
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[4%]">#</TableHead>
                <TableHead className="w-[18%]">Categoría</TableHead>
                <TableHead className="text-right w-[12%]">P. Básico/Día</TableHead>
                <TableHead className="text-right w-[10%]">Premio Asist.</TableHead>
                <TableHead className="text-right w-[10%]">Total Imponible</TableHead>
                <TableHead className="text-right w-[10%]">Cargas Soc.</TableHead>
                <TableHead className="text-right w-[8%]">ART</TableHead>
                <TableHead className="text-right w-[8%]">Otros</TableHead>
                <TableHead className="text-right w-[10%]">Costo Diario</TableHead>
                <TableHead className="text-right w-[10%]">Costo Horario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map((rate, idx) => {
                const totalImponible =
                  rate.baseDailyPrice * (1 + rate.attendanceBonusPct / 100);

                return (
                  <TableRow key={rate.id || idx} className="hover:bg-muted/10">
                    <TableCell className="font-mono text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      <Badge
                        variant="outline"
                        className="text-xs"
                      >
                        {LABOR_CATEGORY_LABELS[rate.category as LaborCategory] ??
                          rate.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={rate.baseDailyPrice}
                        onChange={(e) =>
                          updateField(idx, "baseDailyPrice", Number(e.target.value))
                        }
                        className="w-28 h-8 text-right text-sm ml-auto"
                      />
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {rate.attendanceBonusPct}%
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {money(totalImponible)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {rate.socialChargesPct}%
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {rate.artPct}%
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {rate.otherPct}%
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold text-green-600">
                      {money(rate.dailyCost)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold">
                      {money(rate.hourlyCost)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="px-6 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
          <p>
            <strong>NOTA:</strong> El rubro &quot;OTROS&quot; contempla: Bonificaciones
            Varias, Premios a la Producción, viáticos, etc.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
