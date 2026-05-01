"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

import { BudgetComputoTable } from "./budget-computo-table";
import { BudgetAnalysisDetail } from "./budget-analysis-detail";
import { BudgetOfferStructureCard } from "./budget-offer-structure";
import { BudgetLaborRatesTable } from "./budget-labor-rates-table";
import { BudgetGeneralExpensesTable } from "./budget-general-expenses";
import { BudgetRubroDialog } from "./budget-rubro-dialog";
import { BudgetSubItemDialog } from "./budget-sub-item-dialog";

import type {
  BudgetComputo,
  BudgetRubro,
  BudgetSubItem,
  SubItemMaterial,
  SubItemLabor,
  BudgetOfferStructure,
  BudgetLaborRate,
  BudgetGeneralExpense,
} from "@/lib/types/budget-computo";

import {
  getBudgetComputo,
  bootstrapBudgetComputo,
  createRubro,
  updateRubro,
  deleteRubro,
  createSubItem,
  updateSubItem,
  deleteSubItem,
  saveSubItemMaterials,
  saveSubItemLabor,
  recalcSubItemTotals,
  saveOfferStructure,
  saveLaborRates,
  saveGeneralExpenses,
} from "@/lib/api/budget-computo";

interface BudgetComputoModuleProps {
  budgetId: string;
  projectId: string;
}

export function BudgetComputoModule({
  budgetId,
  projectId,
}: BudgetComputoModuleProps) {
  const [computo, setComputo] = useState<BudgetComputo | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [rubroDialogOpen, setRubroDialogOpen] = useState(false);
  const [editingRubro, setEditingRubro] = useState<BudgetRubro | undefined>();

  const [subItemDialogOpen, setSubItemDialogOpen] = useState(false);
  const [editingSubItem, setEditingSubItem] = useState<BudgetSubItem | undefined>();
  const [targetRubroId, setTargetRubroId] = useState<string>("");
  const [targetRubroNumber, setTargetRubroNumber] = useState(1);

  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [analysisSubItem, setAnalysisSubItem] = useState<BudgetSubItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBudgetComputo(budgetId);
      setComputo(data);
    } catch (error) {
      console.error("Error loading computo:", error);
    } finally {
      setLoading(false);
    }
  }, [budgetId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Bootstrap ──
  const handleBootstrap = async () => {
    setLoading(true);
    try {
      await bootstrapBudgetComputo(budgetId);
      await loadData();
      toast.success("Estructura de presupuesto inicializada con rubros estándar.");
    } catch (error) {
      toast.error("No se pudo inicializar la estructura.");
    }
  };

  // ── Rubro handlers ──
  const handleAddRubro = () => {
    setEditingRubro(undefined);
    setRubroDialogOpen(true);
  };

  const handleEditRubro = (rubro: BudgetRubro) => {
    setEditingRubro(rubro);
    setRubroDialogOpen(true);
  };

  const handleSaveRubro = async (data: { number: number; name: string }) => {
    if (editingRubro) {
      await updateRubro(editingRubro.id, data);
      toast.success("Rubro actualizado.");
    } else {
      await createRubro(budgetId, data);
      toast.success("Rubro creado.");
    }
    await loadData();
  };

  const handleDeleteRubro = async (rubroId: string) => {
    if (!confirm("¿Eliminar este rubro y todos sus ítems?")) return;
    await deleteRubro(rubroId);
    toast.success("Rubro eliminado.");
    await loadData();
  };

  // ── Sub-item handlers ──
  const handleAddSubItem = (rubroId: string, rubroNumber: number) => {
    setEditingSubItem(undefined);
    setTargetRubroId(rubroId);
    setTargetRubroNumber(rubroNumber);
    setSubItemDialogOpen(true);
  };

  const handleEditSubItem = (subItem: BudgetSubItem) => {
    setEditingSubItem(subItem);
    // Find the rubro for this sub-item
    const rubro = computo?.rubros.find((r) => r.id === subItem.rubroId);
    setTargetRubroId(subItem.rubroId);
    setTargetRubroNumber(rubro?.number ?? 1);
    setSubItemDialogOpen(true);
  };

  const handleSaveSubItem = async (
    data: { code: string; description: string; unit: string; quantity: number },
    materials: Omit<SubItemMaterial, "id" | "subItemId">[],
    labor: Omit<SubItemLabor, "id" | "subItemId">[]
  ) => {
    try {
      let subItemId: string;

      if (editingSubItem) {
        subItemId = editingSubItem.id;
        await updateSubItem(subItemId, {
          code: data.code,
          description: data.description,
          unit: data.unit,
          quantity: data.quantity,
        });
      } else {
        const created = await createSubItem(targetRubroId, data);
        if (!created) throw new Error("No se pudo crear el ítem.");
        subItemId = created.id;
      }

      // Save materials + labor
      await saveSubItemMaterials(subItemId, materials);
      await saveSubItemLabor(subItemId, labor);
      await recalcSubItemTotals(subItemId);

      toast.success(
        editingSubItem ? "Ítem actualizado." : "Ítem creado."
      );
      await loadData();
    } catch (error: any) {
      toast.error(error?.message ?? "Error al guardar el ítem.");
    }
  };

  const handleDeleteSubItem = async (subItemId: string) => {
    if (!confirm("¿Eliminar este ítem?")) return;
    await deleteSubItem(subItemId);
    toast.success("Ítem eliminado.");
    await loadData();
  };

  // ── Analysis dialog ──
  const handleViewAnalysis = (subItem: BudgetSubItem) => {
    setAnalysisSubItem(subItem);
    setAnalysisDialogOpen(true);
  };

  // ── Offer structure ──
  const handleSaveOffer = async (
    data: Omit<BudgetOfferStructure, "id" | "budgetId">
  ) => {
    await saveOfferStructure(budgetId, data);
    toast.success("Estructura de oferta guardada.");
    await loadData();
  };

  // ── Labor rates ──
  const handleSaveLaborRates = async (
    rates: Omit<BudgetLaborRate, "id" | "budgetId">[]
  ) => {
    await saveLaborRates(budgetId, rates);
    toast.success("Tarifas de mano de obra guardadas.");
    await loadData();
  };

  // ── General expenses ──
  const handleSaveGeneralExpenses = async (
    expenses: Omit<BudgetGeneralExpense, "id" | "budgetId">[]
  ) => {
    await saveGeneralExpenses(budgetId, expenses);
    toast.success("Gastos generales guardados.");
    await loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Cargando cómputo y presupuesto...
        </span>
      </div>
    );
  }

  // Empty state: no rubros
  if (!computo || computo.rubros.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center space-y-3">
        <h3 className="text-lg font-semibold">
          Sin estructura de cómputo cargada
        </h3>
        <p className="text-sm text-muted-foreground">
          Inicializá la estructura con los 16 rubros estándar de obra
          (Terreno, Estructura, Albañilería, etc.) y las tarifas de mano de obra UOCRA.
        </p>
        <Button onClick={handleBootstrap}>
          Inicializar estructura estándar
        </Button>
      </div>
    );
  }

  const existingSubItemCount =
    computo.rubros
      .find((r) => r.id === targetRubroId)
      ?.subItems.length ?? 0;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="computo" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="computo">Cómputo</TabsTrigger>
          <TabsTrigger value="offer">Estr. Oferta</TabsTrigger>
          <TabsTrigger value="labor">Mano de Obra</TabsTrigger>
          <TabsTrigger value="expenses">Gastos Grales.</TabsTrigger>
          <TabsTrigger value="summary">Resumen</TabsTrigger>
        </TabsList>

        {/* Tab 1: Computo y Presupuesto */}
        <TabsContent value="computo" className="space-y-4">
          <BudgetComputoTable
            rubros={computo.rubros}
            grandTotal={computo.grandTotal}
            onAddSubItem={handleAddSubItem}
            onEditSubItem={handleEditSubItem}
            onDeleteSubItem={handleDeleteSubItem}
            onViewAnalysis={handleViewAnalysis}
            onAddRubro={handleAddRubro}
            onEditRubro={handleEditRubro}
            onDeleteRubro={handleDeleteRubro}
          />
        </TabsContent>

        {/* Tab 2: Estructura de Oferta */}
        <TabsContent value="offer">
          <BudgetOfferStructureCard
            offer={computo.offerStructure}
            constructionSubtotal={computo.grandTotal}
            onSave={handleSaveOffer}
          />
        </TabsContent>

        {/* Tab 3: Mano de Obra */}
        <TabsContent value="labor">
          <BudgetLaborRatesTable
            rates={computo.laborRates}
            onSave={handleSaveLaborRates}
          />
        </TabsContent>

        {/* Tab 4: Gastos Generales */}
        <TabsContent value="expenses">
          <BudgetGeneralExpensesTable
            expenses={computo.generalExpenses}
            projectMonths={7}
            onSave={handleSaveGeneralExpenses}
          />
        </TabsContent>

        {/* Tab 5: Summary (reuses the offer structure for quick overview) */}
        <TabsContent value="summary">
          <div className="grid gap-6 lg:grid-cols-2">
            <BudgetOfferStructureCard
              offer={computo.offerStructure}
              constructionSubtotal={computo.grandTotal}
              onSave={handleSaveOffer}
            />
            <div className="space-y-4">
              {/* Quick rubro summary */}
              <div className="rounded-lg border p-4 space-y-2">
                <h3 className="font-semibold text-sm mb-3">
                  Resumen por Rubro
                </h3>
                {computo.rubros.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between text-sm py-1 border-b last:border-0"
                  >
                    <span>
                      <span className="font-mono text-muted-foreground mr-2">
                        {r.number}.
                      </span>
                      {r.name}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        {new Intl.NumberFormat("es-AR", {
                          style: "currency",
                          currency: "ARS",
                          maximumFractionDigits: 0,
                        }).format(r.total)}
                      </span>
                      <span className="text-xs text-muted-foreground w-14 text-right">
                        {r.incidencePct.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Rubro Dialog */}
      <BudgetRubroDialog
        open={rubroDialogOpen}
        onOpenChange={setRubroDialogOpen}
        rubro={editingRubro}
        nextNumber={
          (computo.rubros.reduce(
            (max, r) => Math.max(max, r.number),
            0
          ) ?? 0) + 1
        }
        onSave={handleSaveRubro}
      />

      {/* Sub-item Dialog */}
      <BudgetSubItemDialog
        open={subItemDialogOpen}
        onOpenChange={setSubItemDialogOpen}
        subItem={editingSubItem}
        rubroNumber={targetRubroNumber}
        existingSubItemCount={existingSubItemCount}
        laborRates={computo.laborRates}
        onSave={handleSaveSubItem}
      />

      {/* Analysis Detail Dialog */}
      <Dialog open={analysisDialogOpen} onOpenChange={setAnalysisDialogOpen}>
        <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto">
          {analysisSubItem && (
            <BudgetAnalysisDetail subItem={analysisSubItem} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
