"use client";

import { useState } from "react";
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
import {
    BudgetItem,
    BudgetCategory,
    BUDGET_CATEGORY_LABELS,
} from "@/lib/types/budget";

interface BudgetItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item?: BudgetItem;
    onSave: (item: Omit<BudgetItem, "id">) => void;
}

const UNITS = ["m²", "m³", "ml", "kg", "ton", "un", "horas", "días", "global"];
const CATEGORIES = Object.keys(BUDGET_CATEGORY_LABELS) as BudgetCategory[];

const EMPTY: Omit<BudgetItem, "id"> = {
    category: "materials",
    description: "",
    unit: "un",
    qtyPlanned: 0,
    priceUnitPlanned: 0,
    qtyActual: 0,
    priceUnitActual: 0,
};

export function BudgetItemDialog({
    open,
    onOpenChange,
    item,
    onSave,
}: BudgetItemDialogProps) {
    const [form, setForm] = useState<Omit<BudgetItem, "id">>(
        item ? { ...item } : { ...EMPTY }
    );

    const handleOpen = (val: boolean) => {
        if (val) setForm(item ? { ...item } : { ...EMPTY });
        onOpenChange(val);
    };

    const set = (key: keyof typeof form, value: string | number) =>
        setForm((f) => ({ ...f, [key]: value }));

    const handleSave = () => {
        if (!form.description.trim()) return;
        onSave(form);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpen}>
            <DialogContent className="sm:max-w-[580px]">
                <DialogHeader>
                    <DialogTitle>{item ? "Editar Ítem" : "Nuevo Ítem de Presupuesto"}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    {/* Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Categoría</Label>
                            <Select
                                value={form.category}
                                onValueChange={(v) => set("category", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((c) => (
                                        <SelectItem key={c} value={c}>
                                            {BUDGET_CATEGORY_LABELS[c]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Unidad</Label>
                            <Select
                                value={form.unit}
                                onValueChange={(v) => set("unit", v)}
                            >
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
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label>Descripción *</Label>
                        <Input
                            value={form.description}
                            onChange={(e) => set("description", e.target.value)}
                            placeholder="Ej: Hormigón H30 para losa"
                        />
                    </div>

                    {/* Planned */}
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                            Planificado
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Cantidad</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={form.qtyPlanned}
                                    onChange={(e) => set("qtyPlanned", parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Precio Unitario (USD)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={form.priceUnitPlanned}
                                    onChange={(e) =>
                                        set("priceUnitPlanned", parseFloat(e.target.value) || 0)
                                    }
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                            Total planificado:{" "}
                            <span className="font-semibold">
                                ${(form.qtyPlanned * form.priceUnitPlanned).toLocaleString()}
                            </span>
                        </p>
                    </div>

                    {/* Actual */}
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                            Real / Ejecutado
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Cantidad</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={form.qtyActual}
                                    onChange={(e) => set("qtyActual", parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Precio Unitario (USD)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={form.priceUnitActual}
                                    onChange={(e) =>
                                        set("priceUnitActual", parseFloat(e.target.value) || 0)
                                    }
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                            Total ejecutado:{" "}
                            <span className="font-semibold">
                                ${(form.qtyActual * form.priceUnitActual).toLocaleString()}
                            </span>
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={!form.description.trim()}>
                        {item ? "Guardar cambios" : "Agregar ítem"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
