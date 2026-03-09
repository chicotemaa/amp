export type TransactionType = "ingreso" | "egreso";
export type TransactionCategory =
    | "contracts"
    | "materials"
    | "labor"
    | "services"
    | "equipment"
    | "subcontracts";

export const TRANSACTION_CATEGORY_LABELS: Record<TransactionCategory, string> = {
    contracts: "Contratos",
    materials: "Materiales",
    labor: "Mano de Obra",
    services: "Servicios",
    equipment: "Equipos",
    subcontracts: "Subcontratos",
};

export interface Transaction {
    id: number;
    type: TransactionType;
    description: string;
    amount: number; // USD
    date: string; // ISO date
    category: TransactionCategory;
    projectId: number | null; // null = general/overhead
    projectName: string; // denormalized for display
}

export interface CashflowStats {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    margin: number; // percentage
    projectedNextMonth: number;
}

export interface MonthlyCashflow {
    month: string; // e.g. "Ene"
    ingresos: number;
    egresos: number;
}
