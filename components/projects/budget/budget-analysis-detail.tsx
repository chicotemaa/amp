"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Layers } from "lucide-react";
import type { BudgetSubItem } from "@/lib/types/budget-computo";
import { LABOR_CATEGORY_LABELS } from "@/lib/types/budget-computo";

interface BudgetAnalysisDetailProps {
  subItem: BudgetSubItem;
}

const money = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(n);

export function BudgetAnalysisDetail({ subItem }: BudgetAnalysisDetailProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Layers className="h-5 w-5 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">
            Análisis de Precios — {subItem.code}
          </h3>
          <p className="text-sm text-muted-foreground">
            {subItem.description} — {subItem.unit} — Cantidad: {subItem.quantity}
          </p>
        </div>
      </div>

      {/* Materials Section */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400"
              >
                A
              </Badge>
              MATERIALES
            </CardTitle>
            <span className="text-sm font-bold">
              Subtotal: {money(subItem.subtotalMaterials)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {subItem.materials.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[8%]">Cód.</TableHead>
                  <TableHead className="w-[40%]">Designación</TableHead>
                  <TableHead className="text-center w-[10%]">Unidad</TableHead>
                  <TableHead className="text-right w-[12%]">Cantidad</TableHead>
                  <TableHead className="text-right w-[15%]">P. Unitario</TableHead>
                  <TableHead className="text-right w-[15%]">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subItem.materials.map((mat) => (
                  <TableRow key={mat.id} className="hover:bg-muted/10">
                    <TableCell className="font-mono text-muted-foreground text-xs">
                      {mat.insumoCode ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {mat.description}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground text-sm">
                      {mat.unit}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {mat.quantity}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {money(mat.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">
                      {money(mat.total)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/20 font-bold">
                  <TableCell colSpan={5} className="text-right text-sm">
                    SUBTOTAL MATERIALES (A)
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {money(subItem.subtotalMaterials)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <div className="px-6 py-4 text-sm text-muted-foreground">
              Sin materiales cargados para este ítem.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Labor Section */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-green-50 text-green-600 border-green-200 dark:bg-green-950 dark:text-green-400"
              >
                B
              </Badge>
              MANO DE OBRA
            </CardTitle>
            <span className="text-sm font-bold">
              Subtotal: {money(subItem.subtotalLabor)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {subItem.labor.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[40%]">Categoría</TableHead>
                  <TableHead className="text-right w-[20%]">Horas</TableHead>
                  <TableHead className="text-right w-[20%]">Precio Hora</TableHead>
                  <TableHead className="text-right w-[20%]">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subItem.labor.map((lab) => (
                  <TableRow key={lab.id} className="hover:bg-muted/10">
                    <TableCell className="font-medium text-sm">
                      {LABOR_CATEGORY_LABELS[lab.laborCategory] ?? lab.laborCategory}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {lab.hours} HS
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {money(lab.hourlyRate)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">
                      {money(lab.total)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/20 font-bold">
                  <TableCell colSpan={3} className="text-right text-sm">
                    SUBTOTAL MANO DE OBRA (B)
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {money(subItem.subtotalLabor)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <div className="px-6 py-4 text-sm text-muted-foreground">
              Sin mano de obra cargada para este ítem.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Net Total */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950 dark:text-purple-400"
              >
                C
              </Badge>
              <span className="font-bold text-sm">
                COSTO NETO TOTAL ({subItem.code})
              </span>
            </div>
            <span className="text-lg font-bold text-primary">
              {money(subItem.costNetTotal)}
            </span>
          </div>
          {subItem.quantity > 1 && (
            <div className="flex justify-end mt-1">
              <span className="text-sm text-muted-foreground">
                × {subItem.quantity} {subItem.unit} ={" "}
                <strong>{money(subItem.costNetTotal * subItem.quantity)}</strong>
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
