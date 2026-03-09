"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreVertical, Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import {
    BudgetItem,
    BudgetCategory,
    BUDGET_CATEGORY_LABELS,
    BUDGET_CATEGORY_COLORS,
    itemTotalPlanned,
    itemTotalActual,
    itemDeviation,
} from "@/lib/types/budget";
import { cn } from "@/lib/utils";
import { BudgetItemDialog } from "./budget-item-dialog";

interface BudgetItemsTableProps {
    items: BudgetItem[];
    onAdd: (item: Omit<BudgetItem, "id">) => void;
    onEdit: (id: string, item: Omit<BudgetItem, "id">) => void;
    onDelete: (id: string) => void;
}

const fmt = (n: number) =>
    new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(n);

const CATEGORIES: BudgetCategory[] = [
    "materials", "labor", "equipment", "services", "subcontracts", "contingency",
];

function DeviationBadge({ pct }: { pct: number }) {
    const color =
        pct <= 0
            ? "bg-green-500/10 text-green-600 border-green-200"
            : pct <= 10
                ? "bg-yellow-500/10 text-yellow-600 border-yellow-200"
                : "bg-red-500/10 text-red-600 border-red-200";
    return (
        <Badge variant="outline" className={cn("text-xs font-mono", color)}>
            {pct >= 0 ? "+" : ""}
            {pct.toFixed(1)}%
        </Badge>
    );
}

export function BudgetItemsTable({ items, onAdd, onEdit, onDelete }: BudgetItemsTableProps) {
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<BudgetItem | undefined>();
    const [defaultCategory, setDefaultCategory] = useState<BudgetCategory>("materials");

    const toggle = (cat: string) =>
        setCollapsed((c) => ({ ...c, [cat]: !c[cat] }));

    const openAdd = (cat: BudgetCategory) => {
        setEditingItem(undefined);
        setDefaultCategory(cat);
        setDialogOpen(true);
    };

    const openEdit = (item: BudgetItem) => {
        setEditingItem(item);
        setDialogOpen(true);
    };

    const handleSave = (data: Omit<BudgetItem, "id">) => {
        if (editingItem) {
            onEdit(editingItem.id, data);
        } else {
            onAdd({ ...data, category: defaultCategory });
        }
    };

    const dialogItem = editingItem
        ? editingItem
        : { ...({} as BudgetItem), category: defaultCategory };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Ítems del Presupuesto</CardTitle>
                    <Button size="sm" onClick={() => { setEditingItem(undefined); setDialogOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Ítem
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    {CATEGORIES.map((cat) => {
                        const catItems = items.filter((i) => i.category === cat);
                        const catPlanned = catItems.reduce((s, i) => s + itemTotalPlanned(i), 0);
                        const catActual = catItems.reduce((s, i) => s + itemTotalActual(i), 0);
                        const isCollapsed = collapsed[cat];

                        return (
                            <div key={cat} className="border-b last:border-0">
                                {/* Category header row */}
                                <div
                                    className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => toggle(cat)}
                                >
                                    <div className="flex items-center gap-3">
                                        {isCollapsed ? (
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className={cn("text-sm font-semibold", BUDGET_CATEGORY_COLORS[cat])}>
                                            {BUDGET_CATEGORY_LABELS[cat]}
                                        </span>
                                        <Badge variant="secondary" className="text-xs">
                                            {catItems.length} ítems
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm">
                                        <span className="text-muted-foreground">
                                            Plan: <span className="font-medium text-foreground">{fmt(catPlanned)}</span>
                                        </span>
                                        <span className="text-muted-foreground">
                                            Real: <span className="font-medium text-foreground">{fmt(catActual)}</span>
                                        </span>
                                        {catPlanned > 0 && (
                                            <DeviationBadge pct={((catActual - catPlanned) / catPlanned) * 100} />
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 text-xs"
                                            onClick={(e) => { e.stopPropagation(); openAdd(cat); }}
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Agregar
                                        </Button>
                                    </div>
                                </div>

                                {/* Category items */}
                                {!isCollapsed && catItems.length > 0 && (
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/30">
                                                <TableHead className="pl-12">Descripción</TableHead>
                                                <TableHead>Unidad</TableHead>
                                                <TableHead className="text-right">Cant. Plan.</TableHead>
                                                <TableHead className="text-right">P.U. Plan.</TableHead>
                                                <TableHead className="text-right">Total Plan.</TableHead>
                                                <TableHead className="text-right">Cant. Real</TableHead>
                                                <TableHead className="text-right">P.U. Real</TableHead>
                                                <TableHead className="text-right">Total Real</TableHead>
                                                <TableHead className="text-right">Desv.</TableHead>
                                                <TableHead className="w-10" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {catItems.map((item) => {
                                                const planned = itemTotalPlanned(item);
                                                const actual = itemTotalActual(item);
                                                const dev = itemDeviation(item);
                                                return (
                                                    <TableRow key={item.id} className="hover:bg-muted/20">
                                                        <TableCell className="pl-12 font-medium">{item.description}</TableCell>
                                                        <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                                                        <TableCell className="text-right">{item.qtyPlanned}</TableCell>
                                                        <TableCell className="text-right">{fmt(item.priceUnitPlanned)}</TableCell>
                                                        <TableCell className="text-right font-medium">{fmt(planned)}</TableCell>
                                                        <TableCell className="text-right">{item.qtyActual}</TableCell>
                                                        <TableCell className="text-right">{fmt(item.priceUnitActual)}</TableCell>
                                                        <TableCell className="text-right font-medium">{fmt(actual)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <DeviationBadge pct={dev} />
                                                        </TableCell>
                                                        <TableCell>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                                                        <MoreVertical className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => openEdit(item)}>
                                                                        <Pencil className="h-3.5 w-3.5 mr-2" />
                                                                        Editar
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="text-destructive"
                                                                        onClick={() => onDelete(item.id)}
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                                                                        Eliminar
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                )}

                                {!isCollapsed && catItems.length === 0 && (
                                    <div className="pl-12 py-3 text-sm text-muted-foreground">
                                        Sin ítems en esta categoría.{" "}
                                        <button
                                            className="underline hover:text-foreground transition-colors"
                                            onClick={() => openAdd(cat)}
                                        >
                                            Agregar uno
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {items.length === 0 && (
                        <div className="py-12 text-center text-muted-foreground">
                            <p className="text-sm">No hay ítems en este presupuesto aún.</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={() => { setEditingItem(undefined); setDialogOpen(true); }}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Agregar primer ítem
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <BudgetItemDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                item={editingItem}
                onSave={handleSave}
            />
        </>
    );
}
