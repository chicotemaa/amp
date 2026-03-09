import { describe, it, expect } from "vitest";
import {
    getTransactions,
    getCashflowStats,
    getCashflowChartData,
    getTransactionsByType,
    getTransactionsByProject,
} from "@/lib/api/cashflow";
import { TRANSACTIONS, MONTHLY_CASHFLOW } from "@/lib/data/cashflow";

describe("getTransactions", () => {
    it("returns all transactions", () => {
        const txns = getTransactions();
        expect(txns.length).toBe(TRANSACTIONS.length);
    });

    it("returns transactions sorted by date descending", () => {
        const txns = getTransactions();
        for (let i = 1; i < txns.length; i++) {
            const prev = new Date(txns[i - 1].date).getTime();
            const curr = new Date(txns[i].date).getTime();
            expect(prev).toBeGreaterThanOrEqual(curr);
        }
    });

    it("does not mutate the original array", () => {
        const txns = getTransactions();
        expect(txns).not.toBe(TRANSACTIONS);
    });
});

describe("getCashflowStats", () => {
    it("returns all required KPI fields", () => {
        const stats = getCashflowStats();
        expect(stats).toHaveProperty("totalIncome");
        expect(stats).toHaveProperty("totalExpenses");
        expect(stats).toHaveProperty("netBalance");
        expect(stats).toHaveProperty("margin");
        expect(stats).toHaveProperty("projectedNextMonth");
    });

    it("totalIncome equals sum of all ingreso transactions", () => {
        const stats = getCashflowStats();
        const expected = TRANSACTIONS.filter((t) => t.type === "ingreso").reduce(
            (sum, t) => sum + t.amount,
            0
        );
        expect(stats.totalIncome).toBe(expected);
    });

    it("totalExpenses equals sum of all egreso transactions", () => {
        const stats = getCashflowStats();
        const expected = TRANSACTIONS.filter((t) => t.type === "egreso").reduce(
            (sum, t) => sum + t.amount,
            0
        );
        expect(stats.totalExpenses).toBe(expected);
    });

    it("netBalance equals income minus expenses", () => {
        const stats = getCashflowStats();
        expect(stats.netBalance).toBe(stats.totalIncome - stats.totalExpenses);
    });

    it("margin is a valid percentage", () => {
        const stats = getCashflowStats();
        expect(stats.margin).toBeGreaterThanOrEqual(0);
        expect(stats.margin).toBeLessThanOrEqual(100);
    });

    it("margin calculation is correct", () => {
        const stats = getCashflowStats();
        const expectedMargin =
            Math.round(
                ((stats.netBalance / stats.totalIncome) * 100) * 10
            ) / 10;
        expect(stats.margin).toBe(expectedMargin);
    });

    it("projectedNextMonth equals netBalance × 1.2", () => {
        const stats = getCashflowStats();
        expect(stats.projectedNextMonth).toBe(
            Math.round(stats.netBalance * 1.2)
        );
    });
});

describe("getCashflowChartData", () => {
    it("returns monthly cashflow data", () => {
        const data = getCashflowChartData();
        expect(data).toEqual(MONTHLY_CASHFLOW);
    });

    it("each month entry has required fields", () => {
        const data = getCashflowChartData();
        for (const m of data) {
            expect(m).toHaveProperty("month");
            expect(m).toHaveProperty("ingresos");
            expect(m).toHaveProperty("egresos");
            expect(typeof m.month).toBe("string");
            expect(typeof m.ingresos).toBe("number");
            expect(typeof m.egresos).toBe("number");
        }
    });

    it("has 6 months of data", () => {
        const data = getCashflowChartData();
        expect(data.length).toBe(6);
    });
});

describe("getTransactionsByType", () => {
    it("filters ingreso transactions", () => {
        const ingresos = getTransactionsByType("ingreso");
        expect(ingresos.length).toBeGreaterThan(0);
        for (const t of ingresos) {
            expect(t.type).toBe("ingreso");
        }
    });

    it("filters egreso transactions", () => {
        const egresos = getTransactionsByType("egreso");
        expect(egresos.length).toBeGreaterThan(0);
        for (const t of egresos) {
            expect(t.type).toBe("egreso");
        }
    });

    it("ingreso + egreso equals total transactions", () => {
        const ingresos = getTransactionsByType("ingreso");
        const egresos = getTransactionsByType("egreso");
        expect(ingresos.length + egresos.length).toBe(TRANSACTIONS.length);
    });
});

describe("getTransactionsByProject", () => {
    it("returns transactions for project 1", () => {
        const txns = getTransactionsByProject(1);
        expect(txns.length).toBeGreaterThan(0);
        for (const t of txns) {
            expect(t.projectId).toBe(1);
        }
    });

    it("returns empty array for a project with no transactions", () => {
        const txns = getTransactionsByProject(999);
        expect(txns).toEqual([]);
    });

    it("all returned transactions belong to the requested project", () => {
        const projectId = 2;
        const txns = getTransactionsByProject(projectId);
        const expected = TRANSACTIONS.filter((t) => t.projectId === projectId);
        expect(txns.length).toBe(expected.length);
    });
});
