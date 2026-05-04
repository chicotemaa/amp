import { supabase } from "@/lib/supabase";
import type {
  BudgetRubro,
  BudgetSubItem,
  SubItemMaterial,
  SubItemLabor,
  BudgetOfferStructure,
  BudgetLaborRate,
  BudgetGeneralExpense,
  BudgetComputo,
  LaborCategory,
} from "@/lib/types/budget-computo";
import type {
  BudgetDisbursement,
  BudgetExcelImportPreview,
  BudgetExcelSourceSummary,
  BudgetExcelWarning,
  BudgetImportRecord,
  BudgetInsumo,
  BudgetTypology,
  BudgetWorkPlanRubro,
} from "@/lib/types/budget-excel";
import {
  DEFAULT_RUBROS,
  DEFAULT_LABOR_RATES,
} from "@/lib/types/budget-computo";
import type { Database } from "@/lib/types/supabase";

type BudgetRubroRow = Database["public"]["Tables"]["budget_rubros"]["Row"];
type BudgetSubItemRow = Database["public"]["Tables"]["budget_sub_items"]["Row"];
type BudgetSubItemMaterialRow =
  Database["public"]["Tables"]["budget_sub_item_materials"]["Row"];
type BudgetSubItemLaborRow =
  Database["public"]["Tables"]["budget_sub_item_labor"]["Row"];
type BudgetOfferStructureRow =
  Database["public"]["Tables"]["budget_offer_structure"]["Row"];
type BudgetLaborRateRow = Database["public"]["Tables"]["budget_labor_rates"]["Row"];
type BudgetGeneralExpenseRow =
  Database["public"]["Tables"]["budget_general_expenses"]["Row"];

type ExtendedBudgetRow = Record<string, any>;

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10);
}

// ─────────────────────────────────────────────
// READ: Full computo for a budget version
// ─────────────────────────────────────────────

export async function getBudgetComputo(budgetId: string): Promise<BudgetComputo> {
  const [
    { data: rubrosData },
    { data: subItemsData },
    { data: materialsData },
    { data: laborData },
    { data: offerData },
    { data: ratesData },
    { data: expensesData },
    { data: importsData },
    { data: insumosData },
    { data: typologiesData },
    { data: workPlanData },
    { data: disbursementsData },
  ] = await Promise.all([
    supabase.from("budget_rubros").select("*").eq("budget_id", budgetId).order("sort_order"),
    supabase.from("budget_sub_items").select("*").order("sort_order"),
    supabase.from("budget_sub_item_materials").select("*").order("sort_order"),
    supabase.from("budget_sub_item_labor").select("*").order("sort_order"),
    supabase.from("budget_offer_structure").select("*").eq("budget_id", budgetId).maybeSingle(),
    supabase.from("budget_labor_rates").select("*").eq("budget_id", budgetId),
    supabase.from("budget_general_expenses").select("*").eq("budget_id", budgetId).order("sort_order"),
    (supabase as any)
      .from("budget_imports")
      .select("*")
      .eq("budget_id", budgetId)
      .order("imported_at", { ascending: false }),
    (supabase as any)
      .from("budget_insumos")
      .select("*")
      .eq("budget_id", budgetId)
      .order("code"),
    (supabase as any)
      .from("budget_typologies")
      .select("*")
      .eq("budget_id", budgetId)
      .order("code"),
    (supabase as any)
      .from("budget_work_plan")
      .select("*")
      .eq("budget_id", budgetId)
      .order("rubro_number"),
    (supabase as any)
      .from("budget_disbursements")
      .select("*")
      .eq("budget_id", budgetId)
      .order("month_number"),
  ]);

  const rubroRows = (rubrosData ?? []) as BudgetRubroRow[];
  const subItemRows = (subItemsData ?? []) as BudgetSubItemRow[];
  const materialRows = (materialsData ?? []) as BudgetSubItemMaterialRow[];
  const laborRows = (laborData ?? []) as BudgetSubItemLaborRow[];
  const offerRow = offerData as BudgetOfferStructureRow | null;
  const rateRows = (ratesData ?? []) as BudgetLaborRateRow[];
  const expenseRows = (expensesData ?? []) as BudgetGeneralExpenseRow[];
  const importRows = (importsData ?? []) as ExtendedBudgetRow[];
  const insumoRows = (insumosData ?? []) as ExtendedBudgetRow[];
  const typologyRows = (typologiesData ?? []) as ExtendedBudgetRow[];
  const workPlanRows = (workPlanData ?? []) as ExtendedBudgetRow[];
  const disbursementRows = (disbursementsData ?? []) as ExtendedBudgetRow[];

  const rubroIds = rubroRows.map((r) => r.id);

  // Filter sub-items to only those belonging to this budget's rubros
  const subItems = subItemRows.filter((si) => rubroIds.includes(si.rubro_id));
  const subItemIds = subItems.map((si) => si.id);

  // Filter materials and labor to only this budget's sub-items
  const materials = materialRows.filter((m) => subItemIds.includes(m.sub_item_id));
  const labor = laborRows.filter((l) => subItemIds.includes(l.sub_item_id));

  // Build nested structure
  const rubros: BudgetRubro[] = rubroRows.map((r) => {
    const rubroSubItems: BudgetSubItem[] = subItems
      .filter((si) => si.rubro_id === r.id)
      .map((si): BudgetSubItem => ({
        id: si.id,
        rubroId: si.rubro_id,
        code: si.code,
        description: si.description,
        unit: si.unit,
        quantity: Number(si.quantity),
        subtotalMaterials: Number(si.subtotal_materials),
        subtotalLabor: Number(si.subtotal_labor),
        costNetTotal: Number(si.cost_net_total),
        sortOrder: si.sort_order,
        materials: materials
          .filter((m) => m.sub_item_id === si.id)
          .map((m): SubItemMaterial => ({
            id: m.id,
            subItemId: m.sub_item_id,
            insumoCode: m.insumo_code,
            description: m.description,
            unit: m.unit,
            quantity: Number(m.quantity),
            unitPrice: Number(m.unit_price),
            total: Number(m.total),
            sortOrder: m.sort_order,
          })),
        labor: labor
          .filter((l) => l.sub_item_id === si.id)
          .map((l): SubItemLabor => ({
            id: l.id,
            subItemId: l.sub_item_id,
            laborCategory: l.labor_category as LaborCategory,
            hours: Number(l.hours),
            hourlyRate: Number(l.hourly_rate),
            total: Number(l.total),
            sortOrder: l.sort_order,
          })),
      }));

    const total = rubroSubItems.reduce((sum, si) => sum + si.costNetTotal * si.quantity, 0);

    return {
      id: r.id,
      budgetId: r.budget_id,
      number: r.number,
      name: r.name,
      sortOrder: r.sort_order,
      subItems: rubroSubItems,
      total,
      incidencePct: 0, // computed after
    };
  });

  const grandTotal = rubros.reduce((sum, r) => sum + r.total, 0);
  rubros.forEach((r) => {
    r.incidencePct = grandTotal > 0 ? (r.total / grandTotal) * 100 : 0;
  });

  const offerStructure: BudgetOfferStructure | null = offerRow
    ? {
        id: offerRow.id,
        budgetId: offerRow.budget_id,
        subtotalConstruction: Number(offerRow.subtotal_construction),
        generalExpensesPct: Number(offerRow.general_expenses_pct),
        generalExpensesAmount: Number(offerRow.general_expenses_amount),
        profitPct: Number(offerRow.profit_pct),
        profitAmount: Number(offerRow.profit_amount),
        taxesPct: Number(offerRow.taxes_pct),
        taxesAmount: Number(offerRow.taxes_amount),
        finalPrice: Number(offerRow.final_price),
      }
    : null;

  const laborRates: BudgetLaborRate[] = rateRows.map((r) => ({
    id: r.id,
    budgetId: r.budget_id,
    category: r.category as LaborCategory,
    baseDailyPrice: Number(r.base_daily_price),
    attendanceBonusPct: Number(r.attendance_bonus_pct),
    socialChargesPct: Number(r.social_charges_pct),
    artPct: Number(r.art_pct),
    otherPct: Number(r.other_pct),
    dailyCost: Number(r.daily_cost),
    hourlyCost: Number(r.hourly_cost),
  }));

  const generalExpenses: BudgetGeneralExpense[] = expenseRows.map((e) => ({
    id: e.id,
    budgetId: e.budget_id,
    concept: e.concept,
    monthAmounts: (e.month_amounts ?? []).map(Number),
    total: Number(e.total),
    sortOrder: e.sort_order,
  }));

  const imports: BudgetImportRecord[] = importRows.map((row) => ({
    id: row.id,
    budgetId: row.budget_id,
    fileName: row.file_name,
    fileSize: Number(row.file_size ?? 0),
    sheetNames: row.sheet_names ?? [],
    sourceSummary: (row.source_summary ?? {}) as BudgetExcelSourceSummary,
    warnings: (row.warnings ?? []) as BudgetExcelWarning[],
    importedAt: row.imported_at,
  }));

  const insumos: BudgetInsumo[] = insumoRows.map((row) => ({
    id: row.id,
    budgetId: row.budget_id,
    code: Number(row.code),
    category: row.category,
    description: row.description,
    unit: row.unit,
    unitPrice: Number(row.unit_price ?? 0),
    sourceSheet: row.source_sheet,
    sourceRow: row.source_row,
  }));

  const typologies: BudgetTypology[] = typologyRows.map((row) => ({
    id: row.id,
    budgetId: row.budget_id,
    code: row.code,
    name: row.name,
    quantity: Number(row.quantity ?? 0),
    directCost: Number(row.direct_cost ?? 0),
    offerPrice: Number(row.offer_price ?? 0),
    coefficient: Number(row.coefficient ?? 0),
    sourceSheet: row.source_sheet,
  }));

  const workPlan: BudgetWorkPlanRubro[] = workPlanRows.map((row) => ({
    id: row.id,
    budgetId: row.budget_id,
    rubroNumber: Number(row.rubro_number),
    rubroName: row.rubro_name,
    incidencePct: Number(row.incidence_pct ?? 0),
    monthPercentages: (row.month_percentages ?? []).map(Number),
    cashAmounts: (row.cash_amounts ?? []).map(Number),
    sourceSheet: row.source_sheet,
    sourceRow: row.source_row,
  }));

  const disbursements: BudgetDisbursement[] = disbursementRows.map((row) => ({
    id: row.id,
    budgetId: row.budget_id,
    monthNumber: Number(row.month_number),
    nationalAmount: Number(row.national_amount ?? 0),
    provincialAmount: Number(row.provincial_amount ?? 0),
    monthlyAmount: Number(row.monthly_amount ?? 0),
    accumulatedAmount: Number(row.accumulated_amount ?? 0),
    sourceSheet: row.source_sheet,
    sourceRow: row.source_row,
  }));

  return {
    rubros,
    offerStructure,
    laborRates,
    generalExpenses,
    imports,
    insumos,
    typologies,
    workPlan,
    disbursements,
    grandTotal,
  };
}

// ─────────────────────────────────────────────
// Bootstrap: Create default rubros + labor rates
// ─────────────────────────────────────────────

export async function bootstrapBudgetComputo(budgetId: string): Promise<void> {
  // Create default rubros
  const rubrosToInsert = DEFAULT_RUBROS.map((r, i) => ({
    id: makeId(),
    budget_id: budgetId,
    number: r.number,
    name: r.name,
    sort_order: i,
  }));

  await supabase.from("budget_rubros").insert(rubrosToInsert);

  // Create default labor rates
  const ratesToInsert = DEFAULT_LABOR_RATES.map((r) => ({
    id: makeId(),
    budget_id: budgetId,
    category: r.category,
    base_daily_price: r.baseDailyPrice,
    attendance_bonus_pct: r.attendanceBonusPct,
    social_charges_pct: r.socialChargesPct,
    art_pct: r.artPct,
    other_pct: r.otherPct,
    daily_cost: r.dailyCost,
    hourly_cost: r.hourlyCost,
  }));

  await supabase.from("budget_labor_rates").insert(ratesToInsert);

  // Create default offer structure
  await supabase.from("budget_offer_structure").insert({
    id: makeId(),
    budget_id: budgetId,
    subtotal_construction: 0,
    general_expenses_pct: 15,
    general_expenses_amount: 0,
    profit_pct: 10,
    profit_amount: 0,
    taxes_pct: 10.5,
    taxes_amount: 0,
    final_price: 0,
  });
}

// ─────────────────────────────────────────────
// CRUD: Rubros
// ─────────────────────────────────────────────

export async function createRubro(
  budgetId: string,
  data: { number: number; name: string }
): Promise<BudgetRubro | null> {
  const { data: existing } = await supabase
    .from("budget_rubros")
    .select("sort_order")
    .eq("budget_id", budgetId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const maxSort = existing?.[0]?.sort_order ?? -1;

  const { data: row, error } = await supabase
    .from("budget_rubros")
    .insert({
      id: makeId(),
      budget_id: budgetId,
      number: data.number,
      name: data.name,
      sort_order: maxSort + 1,
    })
    .select()
    .single();

  if (error || !row) return null;
  const rubroRow = row as BudgetRubroRow;

  return {
    id: rubroRow.id,
    budgetId: rubroRow.budget_id,
    number: rubroRow.number,
    name: rubroRow.name,
    sortOrder: rubroRow.sort_order,
    subItems: [],
    total: 0,
    incidencePct: 0,
  };
}

export async function updateRubro(
  id: string,
  data: { number?: number; name?: string }
): Promise<void> {
  await supabase.from("budget_rubros").update(data).eq("id", id);
}

export async function deleteRubro(id: string): Promise<void> {
  await supabase.from("budget_rubros").delete().eq("id", id);
}

// ─────────────────────────────────────────────
// CRUD: Sub-items
// ─────────────────────────────────────────────

export async function createSubItem(
  rubroId: string,
  data: { code: string; description: string; unit: string; quantity: number }
): Promise<BudgetSubItem | null> {
  const { data: existing } = await supabase
    .from("budget_sub_items")
    .select("sort_order")
    .eq("rubro_id", rubroId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const maxSort = existing?.[0]?.sort_order ?? -1;

  const { data: row, error } = await supabase
    .from("budget_sub_items")
    .insert({
      id: makeId(),
      rubro_id: rubroId,
      code: data.code,
      description: data.description,
      unit: data.unit,
      quantity: data.quantity,
      sort_order: maxSort + 1,
    })
    .select()
    .single();

  if (error || !row) return null;
  const subItemRow = row as BudgetSubItemRow;

  return {
    id: subItemRow.id,
    rubroId: subItemRow.rubro_id,
    code: subItemRow.code,
    description: subItemRow.description,
    unit: subItemRow.unit,
    quantity: Number(subItemRow.quantity),
    subtotalMaterials: 0,
    subtotalLabor: 0,
    costNetTotal: 0,
    sortOrder: subItemRow.sort_order,
    materials: [],
    labor: [],
  };
}

export async function updateSubItem(
  id: string,
  data: Partial<{
    code: string;
    description: string;
    unit: string;
    quantity: number;
    subtotal_materials: number;
    subtotal_labor: number;
    cost_net_total: number;
  }>
): Promise<void> {
  await supabase.from("budget_sub_items").update(data).eq("id", id);
}

export async function deleteSubItem(id: string): Promise<void> {
  await supabase.from("budget_sub_items").delete().eq("id", id);
}

// ─────────────────────────────────────────────
// CRUD: Sub-item materials
// ─────────────────────────────────────────────

export async function saveSubItemMaterials(
  subItemId: string,
  materials: Omit<SubItemMaterial, "id" | "subItemId">[]
): Promise<void> {
  // Delete existing + re-insert for simplicity
  await supabase.from("budget_sub_item_materials").delete().eq("sub_item_id", subItemId);

  if (materials.length === 0) return;

  const rows = materials.map((m, i) => ({
    id: makeId(),
    sub_item_id: subItemId,
    insumo_code: m.insumoCode,
    description: m.description,
    unit: m.unit,
    quantity: m.quantity,
    unit_price: m.unitPrice,
    total: m.total,
    sort_order: i,
  }));

  await supabase.from("budget_sub_item_materials").insert(rows);
}

// ─────────────────────────────────────────────
// CRUD: Sub-item labor
// ─────────────────────────────────────────────

export async function saveSubItemLabor(
  subItemId: string,
  labor: Omit<SubItemLabor, "id" | "subItemId">[]
): Promise<void> {
  await supabase.from("budget_sub_item_labor").delete().eq("sub_item_id", subItemId);

  if (labor.length === 0) return;

  const rows = labor.map((l, i) => ({
    id: makeId(),
    sub_item_id: subItemId,
    labor_category: l.laborCategory,
    hours: l.hours,
    hourly_rate: l.hourlyRate,
    total: l.total,
    sort_order: i,
  }));

  await supabase.from("budget_sub_item_labor").insert(rows);
}

// ─────────────────────────────────────────────
// Recalculate sub-item totals
// ─────────────────────────────────────────────

export async function recalcSubItemTotals(subItemId: string): Promise<void> {
  const [{ data: mats }, { data: labs }] = await Promise.all([
    supabase.from("budget_sub_item_materials").select("total").eq("sub_item_id", subItemId),
    supabase.from("budget_sub_item_labor").select("total").eq("sub_item_id", subItemId),
  ]);

  const subtotalMaterials = (mats ?? []).reduce((s, m: any) => s + Number(m.total), 0);
  const subtotalLabor = (labs ?? []).reduce((s, l: any) => s + Number(l.total), 0);

  await supabase.from("budget_sub_items").update({
    subtotal_materials: subtotalMaterials,
    subtotal_labor: subtotalLabor,
    cost_net_total: subtotalMaterials + subtotalLabor,
  }).eq("id", subItemId);
}

// ─────────────────────────────────────────────
// SAVE: Offer structure
// ─────────────────────────────────────────────

export async function saveOfferStructure(
  budgetId: string,
  data: Omit<BudgetOfferStructure, "id" | "budgetId">
): Promise<void> {
  await supabase.from("budget_offer_structure").upsert({
    id: makeId(),
    budget_id: budgetId,
    subtotal_construction: data.subtotalConstruction,
    general_expenses_pct: data.generalExpensesPct,
    general_expenses_amount: data.generalExpensesAmount,
    profit_pct: data.profitPct,
    profit_amount: data.profitAmount,
    taxes_pct: data.taxesPct,
    taxes_amount: data.taxesAmount,
    final_price: data.finalPrice,
  }, { onConflict: "budget_id" });
}

// ─────────────────────────────────────────────
// SAVE: Labor rates
// ─────────────────────────────────────────────

export async function saveLaborRates(
  budgetId: string,
  rates: Omit<BudgetLaborRate, "id" | "budgetId">[]
): Promise<void> {
  await supabase.from("budget_labor_rates").delete().eq("budget_id", budgetId);

  if (rates.length === 0) return;

  const rows = rates.map((r) => ({
    id: makeId(),
    budget_id: budgetId,
    category: r.category,
    base_daily_price: r.baseDailyPrice,
    attendance_bonus_pct: r.attendanceBonusPct,
    social_charges_pct: r.socialChargesPct,
    art_pct: r.artPct,
    other_pct: r.otherPct,
    daily_cost: r.dailyCost,
    hourly_cost: r.hourlyCost,
  }));

  await supabase.from("budget_labor_rates").insert(rows);
}

// ─────────────────────────────────────────────
// SAVE: General expenses
// ─────────────────────────────────────────────

export async function saveGeneralExpenses(
  budgetId: string,
  expenses: Omit<BudgetGeneralExpense, "id" | "budgetId">[]
): Promise<void> {
  await supabase.from("budget_general_expenses").delete().eq("budget_id", budgetId);

  if (expenses.length === 0) return;

  const rows = expenses.map((e, i) => ({
    id: makeId(),
    budget_id: budgetId,
    concept: e.concept,
    month_amounts: e.monthAmounts,
    total: e.total,
    sort_order: i,
  }));

  await supabase.from("budget_general_expenses").insert(rows);
}

// ─────────────────────────────────────────────
// IMPORT: Excel cómputo/presupuesto
// ─────────────────────────────────────────────

function assertDbResult(result: { error?: { message?: string } | null }, context: string) {
  if (result.error) {
    throw new Error(`${context}: ${result.error.message ?? "Error de base de datos"}`);
  }
}

export async function importBudgetComputoPreview(
  budgetId: string,
  preview: BudgetExcelImportPreview
): Promise<void> {
  const db = supabase as any;

  const cleanupResults = await Promise.all([
    db.from("budget_insumos").delete().eq("budget_id", budgetId),
    db.from("budget_typologies").delete().eq("budget_id", budgetId),
    db.from("budget_work_plan").delete().eq("budget_id", budgetId),
    db.from("budget_disbursements").delete().eq("budget_id", budgetId),
    supabase.from("budget_offer_structure").delete().eq("budget_id", budgetId),
    supabase.from("budget_labor_rates").delete().eq("budget_id", budgetId),
    supabase.from("budget_general_expenses").delete().eq("budget_id", budgetId),
    supabase.from("budget_rubros").delete().eq("budget_id", budgetId),
  ]);

  cleanupResults.forEach((result, index) =>
    assertDbResult(result, `No se pudo limpiar la estructura previa (${index + 1})`)
  );

  const importId = makeId();
  assertDbResult(
    await db.from("budget_imports").insert({
      id: importId,
      budget_id: budgetId,
      file_name: preview.fileName,
      file_size: preview.fileSize,
      sheet_names: preview.sheetNames,
      source_summary: preview.sourceSummary,
      warnings: preview.warnings,
    }),
    "No se pudo registrar la importacion"
  );

  const rubroIds = new Map<number, string>();
  const subItemIds = new Map<string, string>();

  const rubroRows = preview.rubros.map((rubro, index) => {
    const id = makeId();
    rubroIds.set(rubro.number, id);
    return {
      id,
      budget_id: budgetId,
      number: rubro.number,
      name: rubro.name,
      sort_order: index,
    };
  });

  if (rubroRows.length > 0) {
    assertDbResult(
      await supabase.from("budget_rubros").insert(rubroRows),
      "No se pudieron importar los rubros"
    );
  }

  const subItemRows = preview.rubros.flatMap((rubro) =>
    rubro.subItems.map((subItem, index) => {
      const id = makeId();
      subItemIds.set(subItem.code, id);
      return {
        id,
        rubro_id: rubroIds.get(rubro.number) ?? "",
        code: subItem.code,
        description: subItem.description,
        unit: subItem.unit,
        quantity: subItem.quantity,
        subtotal_materials: subItem.subtotalMaterials,
        subtotal_labor: subItem.subtotalLabor,
        cost_net_total: subItem.costNetTotal,
        sort_order: index,
      };
    })
  );

  if (subItemRows.length > 0) {
    assertDbResult(
      await supabase.from("budget_sub_items").insert(subItemRows),
      "No se pudieron importar los items"
    );
  }

  const materialRows = preview.rubros.flatMap((rubro) =>
    rubro.subItems.flatMap((subItem) =>
      subItem.materials.map((material, index) => ({
        id: makeId(),
        sub_item_id: subItemIds.get(subItem.code) ?? "",
        insumo_code: material.insumoCode,
        description: material.description,
        unit: material.unit,
        quantity: material.quantity,
        unit_price: material.unitPrice,
        total: material.total,
        sort_order: index,
      }))
    )
  );

  if (materialRows.length > 0) {
    assertDbResult(
      await supabase.from("budget_sub_item_materials").insert(materialRows),
      "No se pudieron importar los materiales por item"
    );
  }

  const laborRows = preview.rubros.flatMap((rubro) =>
    rubro.subItems.flatMap((subItem) =>
      subItem.labor.map((labor, index) => ({
        id: makeId(),
        sub_item_id: subItemIds.get(subItem.code) ?? "",
        labor_category: labor.laborCategory,
        hours: labor.hours,
        hourly_rate: labor.hourlyRate,
        total: labor.total,
        sort_order: index,
      }))
    )
  );

  if (laborRows.length > 0) {
    assertDbResult(
      await supabase.from("budget_sub_item_labor").insert(laborRows),
      "No se pudo importar la mano de obra por item"
    );
  }

  if (preview.offerStructure) {
    assertDbResult(
      await supabase.from("budget_offer_structure").insert({
        id: makeId(),
        budget_id: budgetId,
        subtotal_construction: preview.offerStructure.subtotalConstruction,
        general_expenses_pct: preview.offerStructure.generalExpensesPct,
        general_expenses_amount: preview.offerStructure.generalExpensesAmount,
        profit_pct: preview.offerStructure.profitPct,
        profit_amount: preview.offerStructure.profitAmount,
        taxes_pct: preview.offerStructure.taxesPct,
        taxes_amount: preview.offerStructure.taxesAmount,
        final_price: preview.offerStructure.finalPrice,
      }),
      "No se pudo importar la estructura de oferta"
    );
  }

  if (preview.laborRates.length > 0) {
    assertDbResult(
      await supabase.from("budget_labor_rates").insert(
        preview.laborRates.map((rate) => ({
          id: makeId(),
          budget_id: budgetId,
          category: rate.category,
          base_daily_price: rate.baseDailyPrice,
          attendance_bonus_pct: rate.attendanceBonusPct,
          social_charges_pct: rate.socialChargesPct,
          art_pct: rate.artPct,
          other_pct: rate.otherPct,
          daily_cost: rate.dailyCost,
          hourly_cost: rate.hourlyCost,
        }))
      ),
      "No se pudieron importar las tarifas de mano de obra"
    );
  }

  if (preview.generalExpenses.length > 0) {
    assertDbResult(
      await supabase.from("budget_general_expenses").insert(
        preview.generalExpenses.map((expense, index) => ({
          id: makeId(),
          budget_id: budgetId,
          concept: expense.concept,
          month_amounts: expense.monthAmounts,
          total: expense.total,
          sort_order: index,
        }))
      ),
      "No se pudieron importar los gastos generales"
    );
  }

  if (preview.insumos.length > 0) {
    assertDbResult(
      await db.from("budget_insumos").insert(
        preview.insumos.map((insumo) => ({
          id: makeId(),
          budget_id: budgetId,
          code: insumo.code,
          category: insumo.category,
          description: insumo.description,
          unit: insumo.unit,
          unit_price: insumo.unitPrice,
          source_sheet: insumo.sourceSheet,
          source_row: insumo.sourceRow,
        }))
      ),
      "No se pudo importar el catalogo de insumos"
    );
  }

  if (preview.typologies.length > 0) {
    assertDbResult(
      await db.from("budget_typologies").insert(
        preview.typologies.map((typology) => ({
          id: makeId(),
          budget_id: budgetId,
          code: typology.code,
          name: typology.name,
          quantity: typology.quantity,
          direct_cost: typology.directCost,
          offer_price: typology.offerPrice,
          coefficient: typology.coefficient,
          source_sheet: typology.sourceSheet,
        }))
      ),
      "No se pudieron importar las tipologias"
    );
  }

  if (preview.workPlan.length > 0) {
    assertDbResult(
      await db.from("budget_work_plan").insert(
        preview.workPlan.map((row) => ({
          id: makeId(),
          budget_id: budgetId,
          rubro_number: row.rubroNumber,
          rubro_name: row.rubroName,
          incidence_pct: row.incidencePct,
          month_percentages: row.monthPercentages,
          cash_amounts: row.cashAmounts,
          source_sheet: row.sourceSheet,
          source_row: row.sourceRow,
        }))
      ),
      "No se pudo importar el plan de trabajos"
    );
  }

  if (preview.disbursements.length > 0) {
    assertDbResult(
      await db.from("budget_disbursements").insert(
        preview.disbursements.map((row) => ({
          id: makeId(),
          budget_id: budgetId,
          month_number: row.monthNumber,
          national_amount: row.nationalAmount,
          provincial_amount: row.provincialAmount,
          monthly_amount: row.monthlyAmount,
          accumulated_amount: row.accumulatedAmount,
          source_sheet: row.sourceSheet,
          source_row: row.sourceRow,
        }))
      ),
      "No se pudo importar el cronograma de desembolsos"
    );
  }
}
