// ==========================================================
// Budget Cómputo types — Hierarchical budget model based on
// Argentine construction budget Excel structure
// ==========================================================

// ── Labor categories (UOCRA) ──
export type LaborCategory =
  | "oficial_espec"
  | "oficial"
  | "medio_oficial"
  | "ayudante"
  | "sereno";

export const LABOR_CATEGORY_LABELS: Record<LaborCategory, string> = {
  oficial_espec: "Oficial Especializado",
  oficial: "Oficial",
  medio_oficial: "Medio Oficial",
  ayudante: "Ayudante",
  sereno: "Sereno",
};

// ── Material line inside a sub-item analysis ──
export interface SubItemMaterial {
  id: string;
  subItemId: string;
  insumoCode: number | null;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
  sortOrder: number;
}

// ── Labor line inside a sub-item analysis ──
export interface SubItemLabor {
  id: string;
  subItemId: string;
  laborCategory: LaborCategory;
  hours: number;
  hourlyRate: number;
  total: number;
  sortOrder: number;
}

// ── Sub-item (e.g., "1.1 Limpieza y Replanteo") ──
export interface BudgetSubItem {
  id: string;
  rubroId: string;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  subtotalMaterials: number;
  subtotalLabor: number;
  costNetTotal: number;
  sortOrder: number;
  materials: SubItemMaterial[];
  labor: SubItemLabor[];
}

// ── Rubro (e.g., "1. PRE. TERRENO Y MOV. SUELOS") ──
export interface BudgetRubro {
  id: string;
  budgetId: string;
  number: number;
  name: string;
  sortOrder: number;
  subItems: BudgetSubItem[];
  // Computed
  total: number;
  incidencePct: number;
}

// ── Offer structure (GG + Benefit + Taxes) ──
export interface BudgetOfferStructure {
  id: string;
  budgetId: string;
  subtotalConstruction: number;
  generalExpensesPct: number;
  generalExpensesAmount: number;
  profitPct: number;
  profitAmount: number;
  taxesPct: number;
  taxesAmount: number;
  finalPrice: number;
}

// ── Labor rate card (UOCRA) ──
export interface BudgetLaborRate {
  id: string;
  budgetId: string;
  category: LaborCategory;
  baseDailyPrice: number;
  attendanceBonusPct: number;
  socialChargesPct: number;
  artPct: number;
  otherPct: number;
  dailyCost: number;
  hourlyCost: number;
}

// ── General expense line (monthly breakdown) ──
export interface BudgetGeneralExpense {
  id: string;
  budgetId: string;
  concept: string;
  monthAmounts: number[];
  total: number;
  sortOrder: number;
}

// ── Full computo budget (all data for one budget version) ──
export interface BudgetComputo {
  rubros: BudgetRubro[];
  offerStructure: BudgetOfferStructure | null;
  laborRates: BudgetLaborRate[];
  generalExpenses: BudgetGeneralExpense[];
  grandTotal: number;
}

// ── Default rubros from the Excel ──
export const DEFAULT_RUBROS = [
  { number: 1, name: "PRE. TERRENO Y MOV. SUELOS" },
  { number: 2, name: "ESTRUCTURA RESISTENTE" },
  { number: 3, name: "ALBAÑILERÍA" },
  { number: 4, name: "CAPA AISLADORA" },
  { number: 5, name: "CUBIERTAS" },
  { number: 6, name: "CIELORRASOS" },
  { number: 7, name: "REVOQUE" },
  { number: 8, name: "CONTRAPISOS" },
  { number: 9, name: "PISO Y ZÓCALO" },
  { number: 10, name: "REVESTIMIENTO" },
  { number: 11, name: "CARPINTERÍAS" },
  { number: 12, name: "INSTALACIÓN SANITARIA" },
  { number: 13, name: "INSTALACIÓN DE GAS" },
  { number: 14, name: "INSTALACIÓN ELÉCTRICA" },
  { number: 15, name: "PINTURAS" },
  { number: 16, name: "OBRAS VARIAS" },
] as const;

// ── Default labor rates from the Excel (MO sheet) ──
export const DEFAULT_LABOR_RATES: Omit<BudgetLaborRate, "id" | "budgetId">[] = [
  {
    category: "oficial_espec",
    baseDailyPrice: 3187.12,
    attendanceBonusPct: 20,
    socialChargesPct: 56,
    artPct: 14.5,
    otherPct: 5,
    dailyCost: 6712.07,
    hourlyCost: 839.01,
  },
  {
    category: "oficial",
    baseDailyPrice: 2715.68,
    attendanceBonusPct: 20,
    socialChargesPct: 56,
    artPct: 14.5,
    otherPct: 5,
    dailyCost: 5719.22,
    hourlyCost: 714.9,
  },
  {
    category: "medio_oficial",
    baseDailyPrice: 2503.84,
    attendanceBonusPct: 20,
    socialChargesPct: 56,
    artPct: 14.5,
    otherPct: 5,
    dailyCost: 5273.09,
    hourlyCost: 659.14,
  },
  {
    category: "ayudante",
    baseDailyPrice: 2298.64,
    attendanceBonusPct: 20,
    socialChargesPct: 56,
    artPct: 14.5,
    otherPct: 5,
    dailyCost: 4840.94,
    hourlyCost: 605.12,
  },
  {
    category: "sereno",
    baseDailyPrice: 114686.18,
    attendanceBonusPct: 0,
    socialChargesPct: 0,
    artPct: 0,
    otherPct: 0,
    dailyCost: 114686.18,
    hourlyCost: 0,
  },
];

// ── Default general expenses from the Excel (G.G sheet) ──
export const DEFAULT_GENERAL_EXPENSES = [
  "SERENO",
  "CERCO DE OBRA",
  "FLETE",
  "CARTEL DE OBRA",
  "VIVIENDA PERSONAL TÉCNICO",
  "VIVIENDA PERSONAL DE OBRA",
  "OBRADOR",
  "SEGUROS A.R.T",
  "SEGURO PERSONAL INSPECTOR",
  "SEGURO DE RESPONSABILIDAD CIVIL",
  "AGRIMENSOR",
  "ESTUDIO DE SUELOS Y TOPOGRAFÍA",
  "IMPRESIÓN DE PLANOS",
  "GASTOS DE LICITACIÓN",
  "GASTOS DE OFICINA",
  "CÁLCULO ESTRUCTURAL",
  "CAPATAZ",
  "SUELDO REPRESENTANTE TÉCNICO",
  "APORTES AL CONSEJO Y A LA CAJA DE ING",
  "VIÁTICOS COMBUSTIBLE Y CAMIONETA",
  "VIÁTICOS DIARIOS TÉCNICOS",
  "MOBILIARIO P/VIVIENDAS",
  "INSPECCIÓN DE OBRA",
  "VIÁTICOS INSPECCIÓN",
  "COMBUSTIBLE INSPECCIÓN",
  "CELULAR INSPECCIÓN",
  "MATERIALES VARIOS",
  "GASTOS VARIOS (CAJA CHICA)",
] as const;
