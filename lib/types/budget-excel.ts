import type {
  BudgetGeneralExpense,
  BudgetLaborRate,
  BudgetOfferStructure,
  BudgetRubro,
  BudgetSubItem,
  SubItemLabor,
  SubItemMaterial,
} from "@/lib/types/budget-computo";

export type BudgetExcelWarningSeverity = "info" | "warning" | "error";

export interface BudgetExcelWarning {
  severity: BudgetExcelWarningSeverity;
  code: string;
  message: string;
  sheetName?: string;
  row?: number;
  cell?: string;
}

export interface BudgetInsumo {
  id?: string;
  budgetId?: string;
  code: number;
  category: string | null;
  description: string;
  unit: string | null;
  unitPrice: number;
  sourceSheet?: string;
  sourceRow?: number;
}

export interface BudgetTypology {
  id?: string;
  budgetId?: string;
  code: string;
  name: string;
  quantity: number;
  directCost: number;
  offerPrice: number;
  coefficient: number;
  sourceSheet?: string;
}

export interface BudgetWorkPlanRubro {
  id?: string;
  budgetId?: string;
  rubroNumber: number;
  rubroName: string;
  incidencePct: number;
  monthPercentages: number[];
  cashAmounts: number[];
  sourceSheet?: string;
  sourceRow?: number;
}

export interface BudgetDisbursement {
  id?: string;
  budgetId?: string;
  monthNumber: number;
  nationalAmount: number;
  provincialAmount: number;
  monthlyAmount: number;
  accumulatedAmount: number;
  sourceSheet?: string;
  sourceRow?: number;
}

export interface BudgetImportRecord {
  id: string;
  budgetId: string;
  fileName: string;
  fileSize: number;
  sheetNames: string[];
  sourceSummary: BudgetExcelSourceSummary;
  warnings: BudgetExcelWarning[];
  importedAt: string;
}

export interface BudgetExcelSourceSummary {
  rubroCount: number;
  itemCount: number;
  materialLineCount: number;
  laborLineCount: number;
  insumoCount: number;
  generalExpenseCount: number;
  directCostTotal: number;
  finalPrice: number;
  coefficient: number;
  workPlanMonthCount: number;
  disbursementCount: number;
  externalFormulaRefCount: number;
  formulaErrorCount: number;
}

export interface BudgetExcelParsedSubItem
  extends Omit<
    BudgetSubItem,
    "id" | "rubroId" | "materials" | "labor" | "sortOrder"
  > {
  sourceSheet?: string;
  sourceRow?: number;
  materials: Omit<SubItemMaterial, "id" | "subItemId">[];
  labor: Omit<SubItemLabor, "id" | "subItemId">[];
}

export interface BudgetExcelParsedRubro
  extends Omit<BudgetRubro, "id" | "budgetId" | "subItems" | "sortOrder"> {
  sourceSheet?: string;
  sourceRow?: number;
  subItems: BudgetExcelParsedSubItem[];
}

export interface BudgetExcelImportPreview {
  fileName: string;
  fileSize: number;
  sheetNames: string[];
  rubros: BudgetExcelParsedRubro[];
  offerStructure: Omit<BudgetOfferStructure, "id" | "budgetId"> | null;
  laborRates: Omit<BudgetLaborRate, "id" | "budgetId">[];
  generalExpenses: Omit<BudgetGeneralExpense, "id" | "budgetId">[];
  insumos: BudgetInsumo[];
  typologies: BudgetTypology[];
  workPlan: BudgetWorkPlanRubro[];
  disbursements: BudgetDisbursement[];
  warnings: BudgetExcelWarning[];
  sourceSummary: BudgetExcelSourceSummary;
}
