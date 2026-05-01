"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Eye,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BudgetRubro, BudgetSubItem } from "@/lib/types/budget-computo";

interface BudgetComputoTableProps {
  rubros: BudgetRubro[];
  grandTotal: number;
  onAddSubItem: (rubroId: string, rubroNumber: number) => void;
  onEditSubItem: (subItem: BudgetSubItem) => void;
  onDeleteSubItem: (subItemId: string) => void;
  onViewAnalysis: (subItem: BudgetSubItem) => void;
  onAddRubro: () => void;
  onEditRubro: (rubro: BudgetRubro) => void;
  onDeleteRubro: (rubroId: string) => void;
}

const money = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(n);

const pct = (n: number) => `${n.toFixed(2)}%`;

export function BudgetComputoTable({
  rubros,
  grandTotal,
  onAddSubItem,
  onEditSubItem,
  onDeleteSubItem,
  onViewAnalysis,
  onAddRubro,
  onEditRubro,
  onDeleteRubro,
}: BudgetComputoTableProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    rubros.forEach((r) => { initial[r.id] = true; });
    return initial;
  });

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Cómputo y Presupuesto</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Presupuesto Resumen — {rubros.length} rubros
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-base font-bold px-3 py-1">
            Total: {money(grandTotal)}
          </Badge>
          <Button size="sm" onClick={onAddRubro}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Rubro
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Header row */}
        <div className="grid grid-cols-12 gap-2 px-6 py-2 bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <div className="col-span-1">N°</div>
          <div className="col-span-5">Designación</div>
          <div className="col-span-1 text-center">Unidad</div>
          <div className="col-span-1 text-right">Cant.</div>
          <div className="col-span-1 text-right">P.U. Neto</div>
          <div className="col-span-1 text-right">Precio Total</div>
          <div className="col-span-1 text-right">% Incid.</div>
          <div className="col-span-1 text-right">Acciones</div>
        </div>

        {rubros.map((rubro) => {
          const isExpanded = expanded[rubro.id] ?? true;

          return (
            <div key={rubro.id} className="border-b last:border-0">
              {/* Rubro header */}
              <div
                className="grid grid-cols-12 gap-2 px-6 py-3 cursor-pointer hover:bg-muted/30 transition-colors items-center"
                onClick={() => toggle(rubro.id)}
              >
                <div className="col-span-1 flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-bold text-primary">{rubro.number}</span>
                </div>
                <div className="col-span-5">
                  <span className="font-semibold text-sm">{rubro.name}</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {rubro.subItems.length} ítems
                  </Badge>
                </div>
                <div className="col-span-1" />
                <div className="col-span-1" />
                <div className="col-span-1" />
                <div className="col-span-1 text-right">
                  <span className="font-bold text-sm">{money(rubro.total)}</span>
                </div>
                <div className="col-span-1 text-right">
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-mono text-xs",
                      rubro.incidencePct > 10
                        ? "border-blue-300 text-blue-600 bg-blue-50 dark:bg-blue-950"
                        : "border-gray-200"
                    )}
                  >
                    {pct(rubro.incidencePct)}
                  </Badge>
                </div>
                <div className="col-span-1 text-right">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onAddSubItem(rubro.id, rubro.number)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEditRubro(rubro)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => onDeleteRubro(rubro.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Sub-items */}
              {isExpanded && rubro.subItems.length > 0 && (
                <Table>
                  <TableBody>
                    {rubro.subItems.map((si) => (
                      <TableRow
                        key={si.id}
                        className="hover:bg-muted/10 text-sm"
                      >
                        <TableCell className="pl-14 w-[8%]">
                          <span className="text-muted-foreground font-mono">
                            {si.code}
                          </span>
                        </TableCell>
                        <TableCell className="w-[42%]">
                          <span className="font-medium">{si.description}</span>
                        </TableCell>
                        <TableCell className="text-center w-[8%] text-muted-foreground">
                          {si.unit}
                        </TableCell>
                        <TableCell className="text-right w-[8%]">
                          {si.quantity}
                        </TableCell>
                        <TableCell className="text-right w-[8%]">
                          {money(si.costNetTotal)}
                        </TableCell>
                        <TableCell className="text-right w-[10%] font-medium">
                          {money(si.costNetTotal * si.quantity)}
                        </TableCell>
                        <TableCell className="w-[6%]" />
                        <TableCell className="text-right w-[10%]">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Ver Análisis de Precios"
                              onClick={() => onViewAnalysis(si)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => onEditSubItem(si)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => onDeleteSubItem(si.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {isExpanded && rubro.subItems.length === 0 && (
                <div className="pl-14 py-3 text-sm text-muted-foreground">
                  Sin ítems en este rubro.{" "}
                  <button
                    className="underline hover:text-foreground transition-colors"
                    onClick={() => onAddSubItem(rubro.id, rubro.number)}
                  >
                    Agregar uno
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {rubros.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-sm">No hay rubros cargados.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={onAddRubro}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar primer rubro
            </Button>
          </div>
        )}

        {/* Grand total footer */}
        {rubros.length > 0 && (
          <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-muted/30 border-t font-bold">
            <div className="col-span-1" />
            <div className="col-span-5 text-sm">PRESUPUESTO TOTAL</div>
            <div className="col-span-1" />
            <div className="col-span-1" />
            <div className="col-span-1" />
            <div className="col-span-1 text-right text-sm">{money(grandTotal)}</div>
            <div className="col-span-1 text-right">
              <Badge variant="default" className="font-mono text-xs">
                100%
              </Badge>
            </div>
            <div className="col-span-1" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
