"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, Boxes, CalendarRange, CircleDollarSign } from "lucide-react";
import type {
  BudgetDisbursement,
  BudgetImportRecord,
  BudgetInsumo,
  BudgetTypology,
  BudgetWorkPlanRubro,
} from "@/lib/types/budget-excel";

interface BudgetImportControlPanelProps {
  imports: BudgetImportRecord[];
  insumos: BudgetInsumo[];
  typologies: BudgetTypology[];
  workPlan: BudgetWorkPlanRubro[];
  disbursements: BudgetDisbursement[];
}

const money = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);

const pct = (n: number) => `${n.toFixed(2)}%`;

export function BudgetImportControlPanel({
  imports,
  insumos,
  typologies,
  workPlan,
  disbursements,
}: BudgetImportControlPanelProps) {
  const lastImport = imports[0];
  const months = Math.max(
    workPlan[0]?.monthPercentages.length ?? 0,
    disbursements.length,
    0
  );

  if (!lastImport && insumos.length === 0 && workPlan.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Sin datos importados desde Excel.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {lastImport && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Última Importación</CardTitle>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {lastImport.fileName}
                </p>
              </div>
            </div>
            <Badge variant="outline">
              {new Date(lastImport.importedAt).toLocaleDateString("es-AR")}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-5">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Rubros</p>
                <p className="mt-1 text-lg font-semibold">
                  {lastImport.sourceSummary.rubroCount}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Ítems</p>
                <p className="mt-1 text-lg font-semibold">
                  {lastImport.sourceSummary.itemCount}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Costo directo</p>
                <p className="mt-1 text-lg font-semibold">
                  {money(lastImport.sourceSummary.directCostTotal)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Precio final</p>
                <p className="mt-1 text-lg font-semibold">
                  {money(lastImport.sourceSummary.finalPrice)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Coeficiente</p>
                <p className="mt-1 text-lg font-semibold">
                  {lastImport.sourceSummary.coefficient.toFixed(4)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Boxes className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Catálogo de Insumos</CardTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {insumos.length} registros importados
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-80 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cód.</TableHead>
                    <TableHead>Designación</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead className="text-right">P. Unitario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insumos.slice(0, 80).map((insumo) => (
                    <TableRow key={`${insumo.code}-${insumo.description}`}>
                      <TableCell className="font-mono text-xs">{insumo.code}</TableCell>
                      <TableCell className="text-sm">{insumo.description}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {insumo.unit ?? "-"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {money(insumo.unitPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <CircleDollarSign className="h-5 w-5 text-green-600" />
            <div>
              <CardTitle>Tipologías y Desembolsos</CardTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {typologies.length} tipologías, {disbursements.length} meses
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {typologies.map((typology) => (
              <div
                key={typology.code}
                className="grid gap-3 rounded-md border p-3 sm:grid-cols-4"
              >
                <div>
                  <p className="text-xs text-muted-foreground">Código</p>
                  <p className="font-semibold">{typology.code}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cantidad</p>
                  <p className="font-semibold">{typology.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Costo directo</p>
                  <p className="font-semibold">{money(typology.directCost)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Oferta</p>
                  <p className="font-semibold">{money(typology.offerPrice)}</p>
                </div>
              </div>
            ))}

            <div className="max-h-64 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mes</TableHead>
                    <TableHead className="text-right">Mensual</TableHead>
                    <TableHead className="text-right">Acumulado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disbursements.map((row) => (
                    <TableRow key={row.monthNumber}>
                      <TableCell>Mes {row.monthNumber}</TableCell>
                      <TableCell className="text-right">{money(row.monthlyAmount)}</TableCell>
                      <TableCell className="text-right">{money(row.accumulatedAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <CalendarRange className="h-5 w-5 text-orange-600" />
          <div>
            <CardTitle>Plan de Trabajos</CardTitle>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {workPlan.length} rubros distribuidos en {months} meses
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[260px]">Rubro</TableHead>
                  <TableHead className="text-right">% Incid.</TableHead>
                  {Array.from({ length: months }, (_, index) => (
                    <TableHead key={index} className="text-right">
                      M{index + 1}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {workPlan.map((row) => (
                  <TableRow key={row.rubroNumber}>
                    <TableCell className="text-sm">
                      <span className="mr-2 font-mono text-muted-foreground">
                        {row.rubroNumber}
                      </span>
                      {row.rubroName}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {pct(row.incidencePct)}
                    </TableCell>
                    {Array.from({ length: months }, (_, index) => (
                      <TableCell key={index} className="text-right text-sm">
                        {row.monthPercentages[index]
                          ? pct(row.monthPercentages[index])
                          : "-"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
