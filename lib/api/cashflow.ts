import { TRANSACTIONS, MONTHLY_CASHFLOW } from "@/lib/data/cashflow";
import { Transaction, CashflowStats, MonthlyCashflow } from "@/lib/types/cashflow";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/types/supabase";
import { getCachedQuery } from "@/lib/api/query-cache";

type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
type LaborEntryRow = Database["public"]["Tables"]["labor_entries"]["Row"];
type PurchaseOrderRow = Database["public"]["Tables"]["purchase_orders"]["Row"];
type PurchaseOrderPaymentRow =
    Database["public"]["Tables"]["purchase_order_payments"]["Row"];
type ProjectCertificateRow =
    Database["public"]["Tables"]["project_certificates"]["Row"];
type ProjectCertificateCollectionRow =
    Database["public"]["Tables"]["project_certificate_collections"]["Row"];
type EmployeeRow = Database["public"]["Tables"]["employees"]["Row"];
type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type SupplierRow = Database["public"]["Tables"]["suppliers"]["Row"];

function laborEntryIdToTransactionId(id: string) {
    return -Number.parseInt(id.replace(/-/g, "").slice(0, 8), 16);
}

function purchaseOrderIdToTransactionId(id: string) {
    return -Number.parseInt(id.replace(/-/g, "").slice(8, 16), 16);
}

function certificateCollectionIdToTransactionId(id: string) {
    return -Number.parseInt(id.replace(/-/g, "").slice(16, 24), 16);
}

function buildMatchCounter(rows: Array<{ projectId: number; category: string; amount: number; date: string }>) {
    const counter = new Map<string, number>();

    for (const row of rows) {
        const key = [row.projectId, row.category, row.amount.toFixed(2), row.date].join("|");
        counter.set(key, (counter.get(key) ?? 0) + 1);
    }

    return counter;
}

const MONTH_ORDER = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function getMonthRank(month: string) {
    return MONTH_ORDER.indexOf(month.toLowerCase().replace(".", ""));
}

function buildMonthlyCashflow(rows: Transaction[]): MonthlyCashflow[] {
    const monthlyMap = new Map<string, MonthlyCashflow>();

    for (const row of rows) {
        const month = new Date(row.date).toLocaleString("es-AR", { month: "short" });
        const current = monthlyMap.get(month) ?? { month, ingresos: 0, egresos: 0 };

        if (row.type === "ingreso") {
            current.ingresos += row.amount;
        } else {
            current.egresos += row.amount;
        }

        monthlyMap.set(month, current);
    }

    return Array.from(monthlyMap.values()).sort(
        (left, right) => getMonthRank(left.month) - getMonthRank(right.month)
    );
}

export async function getTransactionsDb(): Promise<Transaction[]> {
    return getCachedQuery("cashflow:transactions", async () => {
        const [
            { data: transactionsData, error: transactionsError },
            { data: laborData, error: laborError },
            { data: purchaseOrderData, error: purchaseOrderError },
            { data: purchaseOrderPaymentData, error: purchaseOrderPaymentError },
            { data: certificateData, error: certificateError },
            { data: certificateCollectionData, error: certificateCollectionError },
            { data: employeesData },
            { data: projectsData },
            { data: suppliersData },
        ] = await Promise.all([
            supabase.from("transactions").select("*").order("txn_date", { ascending: false }),
            supabase.from("labor_entries").select("*").eq("payment_status", "paid").order("work_date", { ascending: false }),
            supabase.from("purchase_orders").select("*"),
            supabase.from("purchase_order_payments").select("*").order("payment_date", { ascending: false }),
            supabase.from("project_certificates").select("*"),
            supabase.from("project_certificate_collections").select("*").order("collection_date", { ascending: false }),
            supabase.from("employees").select("id,name"),
            supabase.from("projects").select("id,name"),
            supabase.from("suppliers").select("id,name"),
        ]);

        if (
            transactionsError ||
            laborError ||
            purchaseOrderError ||
            purchaseOrderPaymentError ||
            certificateError ||
            certificateCollectionError
        ) {
            console.error(
                "Supabase transactions error:",
                transactionsError?.message ??
                    laborError?.message ??
                    purchaseOrderError?.message ??
                    purchaseOrderPaymentError?.message ??
                    certificateError?.message ??
                    certificateCollectionError?.message
            );
            return [];
        }

    const projectNameById = new Map<number, string>(
        ((projectsData ?? []) as Pick<ProjectRow, "id" | "name">[]).map((project) => [project.id, project.name])
    );
    const employeeNameById = new Map<number, string>(
        ((employeesData ?? []) as Pick<EmployeeRow, "id" | "name">[]).map((employee) => [employee.id, employee.name])
    );
    const supplierNameById = new Map<number, string>(
        ((suppliersData ?? []) as Pick<SupplierRow, "id" | "name">[]).map((supplier) => [supplier.id, supplier.name])
    );

    const paidLaborEntries = (laborData ?? []) as LaborEntryRow[];
    const laborProjects = new Set(
        paidLaborEntries
            .map((entry) => entry.project_id)
            .filter((projectId): projectId is number => typeof projectId === "number")
    );
    const purchaseOrdersById = new Map<string, PurchaseOrderRow>(
        ((purchaseOrderData ?? []) as PurchaseOrderRow[]).map((order) => [order.id, order])
    );
    const certificatesById = new Map<string, ProjectCertificateRow>(
        ((certificateData ?? []) as ProjectCertificateRow[]).map((certificate) => [certificate.id, certificate])
    );
    const rawPurchasePayments = (purchaseOrderPaymentData ?? []) as PurchaseOrderPaymentRow[];
    const syntheticPurchasePayments = ((purchaseOrderData ?? []) as PurchaseOrderRow[])
        .filter(
            (order) =>
                order.status === "paid" &&
                !rawPurchasePayments.some((payment) => payment.purchase_order_id === order.id)
        )
        .map(
            (order) =>
                ({
                    id: order.id,
                    purchase_order_id: order.id,
                    project_id: order.project_id,
                    amount: order.total_amount,
                    payment_date: order.payment_date ?? order.order_date,
                    reference: order.invoice_number,
                    notes: order.notes,
                    created_by: order.created_by,
                    created_at: order.created_at,
                }) satisfies PurchaseOrderPaymentRow
        );
    const purchasePayments = [...rawPurchasePayments, ...syntheticPurchasePayments];
    const certificateCollections = (certificateCollectionData ?? []) as ProjectCertificateCollectionRow[];
    const purchasePaymentCounter = buildMatchCounter(
        purchasePayments
            .map((payment) => {
                const order = purchaseOrdersById.get(payment.purchase_order_id);
                if (!order) return null;

                return {
                    projectId: order.project_id,
                    category: order.category,
                    amount: Number(payment.amount ?? 0),
                    date: payment.payment_date,
                };
            })
            .filter(
                (
                    row
                ): row is {
                    projectId: number;
                    category: string;
                    amount: number;
                    date: string;
                } => row !== null
            )
    );
    const certificateCollectionCounter = buildMatchCounter(
        certificateCollections
            .map((collection) => {
                const certificate = certificatesById.get(collection.certificate_id);
                if (!certificate) return null;

                return {
                    projectId: collection.project_id,
                    category: "contracts",
                    amount: Number(collection.amount ?? 0),
                    date: collection.collection_date,
                };
            })
            .filter(
                (
                    row
                ): row is {
                    projectId: number;
                    category: string;
                    amount: number;
                    date: string;
                } => row !== null
            )
    );

    const baseTransactions = ((transactionsData ?? []) as TransactionRow[])
        .filter((row) => {
            if (row.category === "labor" && row.project_id !== null && laborProjects.has(row.project_id)) {
                return false;
            }

            if (
                row.type === "egreso" &&
                row.project_id !== null &&
                ["materials", "services", "equipment", "subcontracts"].includes(row.category)
            ) {
                const key = [row.project_id, row.category, Number(row.amount ?? 0).toFixed(2), row.txn_date].join("|");
                const currentCount = purchasePaymentCounter.get(key) ?? 0;
                if (currentCount > 0) {
                    purchasePaymentCounter.set(key, currentCount - 1);
                    return false;
                }
            }

            if (
                row.type === "ingreso" &&
                row.project_id !== null &&
                row.category === "contracts"
            ) {
                const key = [row.project_id, row.category, Number(row.amount ?? 0).toFixed(2), row.txn_date].join("|");
                const currentCount = certificateCollectionCounter.get(key) ?? 0;
                if (currentCount > 0) {
                    certificateCollectionCounter.set(key, currentCount - 1);
                    return false;
                }
            }

            return true;
        })
        .map((row) => ({
        id: row.id,
        type: row.type as Transaction["type"],
        description: row.description,
        amount: row.amount,
        date: row.txn_date,
        category: row.category as Transaction["category"],
        projectId: row.project_id,
        projectName: row.project_name,
    }));

    const laborTransactions: Transaction[] = paidLaborEntries.map((entry) => ({
        id: laborEntryIdToTransactionId(entry.id),
        type: "egreso",
        description: `Pago mano de obra — ${employeeNameById.get(entry.employee_id) ?? `Empleado ${entry.employee_id}`}`,
        amount: Number(entry.amount_paid),
        date: entry.paid_at?.slice(0, 10) ?? entry.work_date,
        category: "labor",
        projectId: entry.project_id,
        projectName: projectNameById.get(entry.project_id) ?? `Proyecto ${entry.project_id}`,
    }));

    const purchaseTransactions: Transaction[] = purchasePayments.flatMap((payment) => {
        const order = purchaseOrdersById.get(payment.purchase_order_id);
        if (!order) return [];

        return [{
        id: purchaseOrderIdToTransactionId(payment.id),
        type: "egreso",
        description: `Pago compra — ${supplierNameById.get(order.supplier_id) ?? `Proveedor ${order.supplier_id}`}: ${order.description}`,
        amount: Number(payment.amount),
        date: payment.payment_date,
        category: order.category as Transaction["category"],
        projectId: order.project_id,
        projectName: projectNameById.get(order.project_id) ?? `Proyecto ${order.project_id}`,
    }];
    });

    const certificateTransactions: Transaction[] = certificateCollections.flatMap((collection) => {
        const certificate = certificatesById.get(collection.certificate_id);
        if (!certificate) return [];

        return [{
        id: certificateCollectionIdToTransactionId(collection.id),
        type: "ingreso",
        description: `Cobro certificado ${certificate.certificate_number} — ${certificate.description}`,
        amount: Number(collection.amount),
        date: collection.collection_date,
        category: "contracts",
        projectId: certificate.project_id,
        projectName: projectNameById.get(certificate.project_id) ?? `Proyecto ${certificate.project_id}`,
    }];
    });

        return [...baseTransactions, ...laborTransactions, ...purchaseTransactions, ...certificateTransactions].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    });
}

export async function getCashflowChartDataDb(): Promise<MonthlyCashflow[]> {
    return getCachedQuery("cashflow:chart", async () => {
        const transactions = await getTransactionsDb();
        return buildMonthlyCashflow(transactions);
    });
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
