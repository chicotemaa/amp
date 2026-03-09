import { TRANSACTIONS, MONTHLY_CASHFLOW } from "@/lib/data/cashflow";
import { Transaction, CashflowStats, MonthlyCashflow } from "@/lib/types/cashflow";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/types/supabase";

type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
type MonthlyCashflowRow = Database["public"]["Tables"]["monthly_cashflow"]["Row"];

export async function getTransactionsDb(): Promise<Transaction[]> {
    const { data, error } = await supabase.from("transactions").select("*").order("txn_date", { ascending: false });
    if (error) {
        console.error("Supabase transactions error:", error.message);
        return [...TRANSACTIONS];
    }
    return ((data ?? []) as TransactionRow[]).map((row) => ({
        id: row.id,
        type: row.type as Transaction["type"],
        description: row.description,
        amount: row.amount,
        date: row.txn_date,
        category: row.category as Transaction["category"],
        projectId: row.project_id,
        projectName: row.project_name,
    }));
}

export async function getCashflowChartDataDb(): Promise<MonthlyCashflow[]> {
    const { data, error } = await supabase.from("monthly_cashflow").select("*");
    if (error) {
        console.error("Supabase monthly_cashflow error:", error.message);
        return MONTHLY_CASHFLOW;
    }
    return ((data ?? []) as MonthlyCashflowRow[]).map((row) => ({
        month: row.month_key,
        ingresos: row.ingresos,
        egresos: row.egresos,
    }));
}

export function getTransactions(): Transaction[] {
    return [...TRANSACTIONS].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

/** Compute all cashflow KPIs from the transactions array */
export function getCashflowStats(): CashflowStats {
    const income = TRANSACTIONS.filter((t) => t.type === "ingreso");
    const expenses = TRANSACTIONS.filter((t) => t.type === "egreso");

    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const netBalance = totalIncome - totalExpenses;
    const margin = totalIncome > 0 ? ((netBalance / totalIncome) * 100) : 0;

    // Projected: current net balance + estimated 20% growth
    const projectedNextMonth = Math.round(netBalance * 1.2);

    return {
        totalIncome,
        totalExpenses,
        netBalance,
        margin: Math.round(margin * 10) / 10,
        projectedNextMonth,
    };
}

/** Monthly chart data for the cashflow line chart */
export function getCashflowChartData(): MonthlyCashflow[] {
    return MONTHLY_CASHFLOW;
}

/** Filter transactions by type */
export function getTransactionsByType(type: Transaction["type"]): Transaction[] {
    return TRANSACTIONS.filter((t) => t.type === type);
}

/** Filter transactions by project */
export function getTransactionsByProject(projectId: number): Transaction[] {
    return TRANSACTIONS.filter((t) => t.projectId === projectId);
}

// --- SUPABASE MUTATIONS ---

export type CreateTransactionInput = Omit<Transaction, "id">;

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    const newId = Date.now(); // Fallback ID
    const { data, error } = await supabase
        .from("transactions")
        .insert({
            id: newId,
            type: input.type,
            description: input.description,
            amount: input.amount,
            txn_date: input.date,
            category: input.category,
            project_id: input.projectId,
            project_name: input.projectName,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating transaction:", error.message);
        throw new Error("No se pudo crear la transacción.");
    }

    const row = data as TransactionRow;
    return {
        id: row.id,
        type: row.type as Transaction["type"],
        description: row.description,
        amount: row.amount,
        date: row.txn_date,
        category: row.category as Transaction["category"],
        projectId: row.project_id,
        projectName: row.project_name,
    };
}

export async function updateTransaction(id: number, input: Partial<Transaction>): Promise<Transaction> {
    const updates: Record<string, any> = {};
    if (input.type !== undefined) updates.type = input.type;
    if (input.description !== undefined) updates.description = input.description;
    if (input.amount !== undefined) updates.amount = input.amount;
    if (input.date !== undefined) updates.txn_date = input.date;
    if (input.category !== undefined) updates.category = input.category;
    if (input.projectId !== undefined) updates.project_id = input.projectId;
    if (input.projectName !== undefined) updates.project_name = input.projectName;

    const { data, error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating transaction:", error.message);
        throw new Error("No se pudo actualizar la transacción.");
    }

    const row = data as TransactionRow;
    return {
        id: row.id,
        type: row.type as Transaction["type"],
        description: row.description,
        amount: row.amount,
        date: row.txn_date,
        category: row.category as Transaction["category"],
        projectId: row.project_id,
        projectName: row.project_name,
    };
}

export async function deleteTransaction(id: number): Promise<void> {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
        console.error("Error deleting transaction:", error.message);
        throw new Error("No se pudo eliminar la transacción.");
    }
}
