"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import type {
  BudgetSubItem,
  SubItemMaterial,
  SubItemLabor,
  BudgetLaborRate,
  LaborCategory,
} from "@/lib/types/budget-computo";
import { LABOR_CATEGORY_LABELS } from "@/lib/types/budget-computo";

interface BudgetSubItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subItem?: BudgetSubItem;
  rubroNumber: number;
  existingSubItemCount: number;
  laborRates: BudgetLaborRate[];
  onSave: (
    data: {
      code: string;
      description: string;
      unit: string;
      quantity: number;
    },
    materials: Omit<SubItemMaterial, "id" | "subItemId">[],
    labor: Omit<SubItemLabor, "id" | "subItemId">[]
  ) => void;
}

const UNITS = [
  "GL", "M2", "M3", "ML", "KG", "TON", "UN", "HS",
  "CAÑO", "BARRA", "LT", "BOLSAS", "ROLLO",
];

const money = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(n);

type MatRow = {
  insumoCode: number | null;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
};

type LaborRow = {
  laborCategory: LaborCategory;
  hours: number;
  hourlyRate: number;
};

export function BudgetSubItemDialog({
  open,
  onOpenChange,
  subItem,
  rubroNumber,
  existingSubItemCount,
  laborRates,
  onSave,
}: BudgetSubItemDialogProps) {
  const nextCode = `${rubroNumber}.${existingSubItemCount + 1}`;

  const [code, setCode] = useState(subItem?.code ?? nextCode);
  const [description, setDescription] = useState(subItem?.description ?? "");
  const [unit, setUnit] = useState(subItem?.unit ?? "GL");
  const [quantity, setQuantity] = useState(subItem?.quantity ?? 1);

  const [materials, setMaterials] = useState<MatRow[]>(
    subItem?.materials.map((m) => ({
      insumoCode: m.insumoCode,
      description: m.description,
      unit: m.unit,
      quantity: m.quantity,
      unitPrice: m.unitPrice,
    })) ?? []
  );

  const [labor, setLabor] = useState<LaborRow[]>(
    subItem?.labor.map((l) => ({
      laborCategory: l.laborCategory,
      hours: l.hours,
      hourlyRate: l.hourlyRate,
    })) ?? []
  );

  useEffect(() => {
    if (open) {
      setCode(subItem?.code ?? nextCode);
      setDescription(subItem?.description ?? "");
      setUnit(subItem?.unit ?? "GL");
      setQuantity(subItem?.quantity ?? 1);
      setMaterials(
        subItem?.materials.map((m) => ({
          insumoCode: m.insumoCode,
          description: m.description,
          unit: m.unit,
          quantity: m.quantity,
          unitPrice: m.unitPrice,
        })) ?? []
      );
      setLabor(
        subItem?.labor.map((l) => ({
          laborCategory: l.laborCategory,
          hours: l.hours,
          hourlyRate: l.hourlyRate,
        })) ?? []
      );
    }
  }, [open, subItem, nextCode]);

  // Material helpers
  const addMaterial = () =>
    setMaterials((prev) => [
      ...prev,
      { insumoCode: null, description: "", unit: "KG", quantity: 0, unitPrice: 0 },
    ]);

  const removeMaterial = (idx: number) =>
    setMaterials((prev) => prev.filter((_, i) => i !== idx));

  const updateMaterial = (idx: number, field: keyof MatRow, value: any) =>
    setMaterials((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });

  // Labor helpers
  const addLabor = () => {
    const defaultRate = laborRates.find((r) => r.category === "oficial");
    setLabor((prev) => [
      ...prev,
      {
        laborCategory: "oficial" as LaborCategory,
        hours: 8,
        hourlyRate: defaultRate?.hourlyCost ?? 0,
      },
    ]);
  };

  const removeLabor = (idx: number) =>
    setLabor((prev) => prev.filter((_, i) => i !== idx));

  const updateLabor = (idx: number, field: keyof LaborRow, value: any) => {
    setLabor((prev) => {
      const next = [...prev];
      if (field === "laborCategory") {
        const rate = laborRates.find((r) => r.category === value);
        next[idx] = {
          ...next[idx],
          laborCategory: value as LaborCategory,
          hourlyRate: rate?.hourlyCost ?? next[idx].hourlyRate,
        };
      } else {
        next[idx] = { ...next[idx], [field]: value };
      }
      return next;
    });
  };

  // Computed
  const subtotalMaterials = materials.reduce(
    (s, m) => s + m.quantity * m.unitPrice,
    0
  );
  const subtotalLabor = labor.reduce(
    (s, l) => s + l.hours * l.hourlyRate,
    0
  );
  const costNetTotal = subtotalMaterials + subtotalLabor;

  const handleSave = () => {
    if (!description.trim()) return;

    onSave(
      { code, description: description.trim(), unit, quantity },
      materials.map((m, i) => ({
        insumoCode: m.insumoCode,
        description: m.description,
        unit: m.unit,
        quantity: m.quantity,
        unitPrice: m.unitPrice,
        total: m.quantity * m.unitPrice,
        sortOrder: i,
      })),
      labor.map((l, i) => ({
        laborCategory: l.laborCategory,
        hours: l.hours,
        hourlyRate: l.hourlyRate,
        total: l.hours * l.hourlyRate,
        sortOrder: i,
      }))
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[780px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {subItem
              ? `Editar Ítem ${subItem.code}`
              : "Nuevo Ítem — Análisis de Precios"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Basic info */}
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label>Código</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="1.1"
              />
            </div>
            <div className="col-span-3 space-y-1.5">
              <Label>Descripción *</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Limpieza y Replanteo"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Unidad</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cantidad (cómputo)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Section A: Materials */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950"
                >
                  A
                </Badge>
                <span className="text-sm font-semibold">MATERIALES</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Subtotal: {money(subtotalMaterials)}
                </span>
                <Button size="sm" variant="outline" onClick={addMaterial}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Material
                </Button>
              </div>
            </div>

            {materials.map((mat, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 items-end border rounded p-2 bg-muted/10"
              >
                <div className="col-span-1">
                  <Label className="text-xs">Cód.</Label>
                  <Input
                    type="number"
                    value={mat.insumoCode ?? ""}
                    onChange={(e) =>
                      updateMaterial(
                        idx,
                        "insumoCode",
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className="h-8 text-xs"
                    placeholder="—"
                  />
                </div>
                <div className="col-span-4">
                  <Label className="text-xs">Designación</Label>
                  <Input
                    value={mat.description}
                    onChange={(e) =>
                      updateMaterial(idx, "description", e.target.value)
                    }
                    className="h-8 text-xs"
                    placeholder="Ej: CEMENTO"
                  />
                </div>
                <div className="col-span-1">
                  <Label className="text-xs">Unid.</Label>
                  <Input
                    value={mat.unit}
                    onChange={(e) =>
                      updateMaterial(idx, "unit", e.target.value)
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Cantidad</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={mat.quantity}
                    onChange={(e) =>
                      updateMaterial(idx, "quantity", Number(e.target.value))
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">P.U.</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={mat.unitPrice}
                    onChange={(e) =>
                      updateMaterial(idx, "unitPrice", Number(e.target.value))
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-1 text-right text-xs font-medium pt-5">
                  {money(mat.quantity * mat.unitPrice)}
                </div>
                <div className="col-span-1 flex justify-end pt-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeMaterial(idx)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Section B: Labor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-600 border-green-200 dark:bg-green-950"
                >
                  B
                </Badge>
                <span className="text-sm font-semibold">MANO DE OBRA</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Subtotal: {money(subtotalLabor)}
                </span>
                <Button size="sm" variant="outline" onClick={addLabor}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  MO
                </Button>
              </div>
            </div>

            {labor.map((lab, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 items-end border rounded p-2 bg-muted/10"
              >
                <div className="col-span-4">
                  <Label className="text-xs">Categoría</Label>
                  <Select
                    value={lab.laborCategory}
                    onValueChange={(v) =>
                      updateLabor(idx, "laborCategory", v)
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LABOR_CATEGORY_LABELS).map(
                        ([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">Horas</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={lab.hours}
                    onChange={(e) =>
                      updateLabor(idx, "hours", Number(e.target.value))
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">$/Hora</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={lab.hourlyRate}
                    onChange={(e) =>
                      updateLabor(idx, "hourlyRate", Number(e.target.value))
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-2 text-right text-xs font-medium pt-5">
                  {money(lab.hours * lab.hourlyRate)}
                </div>
                <div className="col-span-1 flex justify-end pt-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeLabor(idx)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Section C: Net Total */}
          <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950"
              >
                C
              </Badge>
              <span className="font-bold text-sm">COSTO NETO TOTAL</span>
            </div>
            <span className="text-lg font-bold text-primary">
              {money(costNetTotal)}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!description.trim()}>
            {subItem ? "Guardar cambios" : "Crear ítem"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
