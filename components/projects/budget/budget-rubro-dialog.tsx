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
import type { BudgetRubro } from "@/lib/types/budget-computo";

interface BudgetRubroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rubro?: BudgetRubro;
  nextNumber: number;
  onSave: (data: { number: number; name: string }) => void;
}

export function BudgetRubroDialog({
  open,
  onOpenChange,
  rubro,
  nextNumber,
  onSave,
}: BudgetRubroDialogProps) {
  const [number, setNumber] = useState(rubro?.number ?? nextNumber);
  const [name, setName] = useState(rubro?.name ?? "");

  useEffect(() => {
    if (open) {
      setNumber(rubro?.number ?? nextNumber);
      setName(rubro?.name ?? "");
    }
  }, [open, rubro, nextNumber]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ number, name: name.trim().toUpperCase() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>
            {rubro ? "Editar Rubro" : "Nuevo Rubro de Presupuesto"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>N°</Label>
              <Input
                type="number"
                min={1}
                value={number}
                onChange={(e) => setNumber(Number(e.target.value))}
              />
            </div>
            <div className="col-span-3 space-y-1.5">
              <Label>Nombre del Rubro *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: ESTRUCTURA RESISTENTE"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {rubro ? "Guardar cambios" : "Crear rubro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
