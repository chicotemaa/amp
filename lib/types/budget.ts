export type BudgetCategory =
  | "materials"
  | "labor"
  | "equipment"
  | "services"
  | "subcontracts"
  | "contingency";

export const BUDGET_CATEGORY_LABELS: Record<BudgetCategory, string> = {
  materials: "Materiales",
  labor: "Mano de Obra",
  equipment: "Equipos",
  services: "Servicios",
  subcontracts: "Subcontratos",
  contingency: "Imprevistos",
};

export const BUDGET_CATEGORY_COLORS: Record<BudgetCategory, string> = {
  materials: "text-blue-500",
  labor: "text-green-500",
  equipment: "text-orange-500",
  services: "text-purple-500",
  subcontracts: "text-cyan-500",
  contingency: "text-red-500",
};

export interface BudgetItem {
  id: string;
  category: BudgetCategory;
  description: string;
  unit: string;
  qtyPlanned: number;
  priceUnitPlanned: number;
  qtyActual: number;
  priceUnitActual: number;
}

export interface BudgetVersion {
  id: string;
  version: number;
  label: string;
  description: string;
  createdAt: string;
  items: BudgetItem[];
}

// Derived helpers
export function itemTotalPlanned(item: BudgetItem): number {
  return item.qtyPlanned * item.priceUnitPlanned;
}

export function itemTotalActual(item: BudgetItem): number {
  return item.qtyActual * item.priceUnitActual;
}

export function itemDeviation(item: BudgetItem): number {
  const planned = itemTotalPlanned(item);
  if (planned === 0) return 0;
  return ((itemTotalActual(item) - planned) / planned) * 100;
}
