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
import {
  DEFAULT_RUBROS,
  DEFAULT_LABOR_RATES,
} from "@/lib/types/budget-computo";

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
  ] = await Promise.all([
    supabase.from("budget_rubros").select("*").eq("budget_id", budgetId).order("sort_order"),
    supabase.from("budget_sub_items").select("*").order("sort_order"),
    supabase.from("budget_sub_item_materials").select("*").order("sort_order"),
    supabase.from("budget_sub_item_labor").select("*").order("sort_order"),
    supabase.from("budget_offer_structure").select("*").eq("budget_id", budgetId).maybeSingle(),
    supabase.from("budget_labor_rates").select("*").eq("budget_id", budgetId),
    supabase.from("budget_general_expenses").select("*").eq("budget_id", budgetId).order("sort_order"),
  ]);

  const rubroIds = (rubrosData ?? []).map((r: any) => r.id);

  // Filter sub-items to only those belonging to this budget's rubros
  const subItems = (subItemsData ?? []).filter((si: any) => rubroIds.includes(si.rubro_id));
  const subItemIds = subItems.map((si: any) => si.id);

  // Filter materials and labor to only this budget's sub-items
  const materials = (materialsData ?? []).filter((m: any) => subItemIds.includes(m.sub_item_id));
  const labor = (laborData ?? []).filter((l: any) => subItemIds.includes(l.sub_item_id));

  // Build nested structure
  const rubros: BudgetRubro[] = (rubrosData ?? []).map((r: any) => {
    const rubroSubItems: BudgetSubItem[] = subItems
      .filter((si: any) => si.rubro_id === r.id)
      .map((si: any): BudgetSubItem => ({
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
          .filter((m: any) => m.sub_item_id === si.id)
          .map((m: any): SubItemMaterial => ({
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
          .filter((l: any) => l.sub_item_id === si.id)
          .map((l: any): SubItemLabor => ({
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

  const offerStructure: BudgetOfferStructure | null = offerData
    ? {
        id: offerData.id,
        budgetId: offerData.budget_id,
        subtotalConstruction: Number(offerData.subtotal_construction),
        generalExpensesPct: Number(offerData.general_expenses_pct),
        generalExpensesAmount: Number(offerData.general_expenses_amount),
        profitPct: Number(offerData.profit_pct),
        profitAmount: Number(offerData.profit_amount),
        taxesPct: Number(offerData.taxes_pct),
        taxesAmount: Number(offerData.taxes_amount),
        finalPrice: Number(offerData.final_price),
      }
    : null;

  const laborRates: BudgetLaborRate[] = (ratesData ?? []).map((r: any) => ({
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

  const generalExpenses: BudgetGeneralExpense[] = (expensesData ?? []).map((e: any) => ({
    id: e.id,
    budgetId: e.budget_id,
    concept: e.concept,
    monthAmounts: (e.month_amounts ?? []).map(Number),
    total: Number(e.total),
    sortOrder: e.sort_order,
  }));

  return { rubros, offerStructure, laborRates, generalExpenses, grandTotal };
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

  return {
    id: row.id,
    budgetId: row.budget_id,
    number: row.number,
    name: row.name,
    sortOrder: row.sort_order,
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

  return {
    id: row.id,
    rubroId: row.rubro_id,
    code: row.code,
    description: row.description,
    unit: row.unit,
    quantity: Number(row.quantity),
    subtotalMaterials: 0,
    subtotalLabor: 0,
    costNetTotal: 0,
    sortOrder: row.sort_order,
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
