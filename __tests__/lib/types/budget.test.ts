import { describe, it, expect } from "vitest";
import {
    BudgetItem,
    itemTotalPlanned,
    itemTotalActual,
    itemDeviation,
} from "@/lib/types/budget";

function makeBudgetItem(overrides: Partial<BudgetItem> = {}): BudgetItem {
    return {
        id: "test-1",
        category: "materials",
        description: "Test Item",
        unit: "m²",
        qtyPlanned: 100,
        priceUnitPlanned: 50,
        qtyActual: 100,
        priceUnitActual: 50,
        ...overrides,
    };
}

describe("itemTotalPlanned", () => {
    it("returns qty × unit price for planned", () => {
        const item = makeBudgetItem({ qtyPlanned: 200, priceUnitPlanned: 25 });
        expect(itemTotalPlanned(item)).toBe(5000);
    });

    it("returns 0 when qty is 0", () => {
        const item = makeBudgetItem({ qtyPlanned: 0 });
        expect(itemTotalPlanned(item)).toBe(0);
    });

    it("returns 0 when price is 0", () => {
        const item = makeBudgetItem({ priceUnitPlanned: 0 });
        expect(itemTotalPlanned(item)).toBe(0);
    });

    it("handles decimal values", () => {
        const item = makeBudgetItem({ qtyPlanned: 10.5, priceUnitPlanned: 3.2 });
        expect(itemTotalPlanned(item)).toBeCloseTo(33.6);
    });
});

describe("itemTotalActual", () => {
    it("returns qty × unit price for actual", () => {
        const item = makeBudgetItem({ qtyActual: 150, priceUnitActual: 40 });
        expect(itemTotalActual(item)).toBe(6000);
    });

    it("returns 0 when qty is 0", () => {
        const item = makeBudgetItem({ qtyActual: 0 });
        expect(itemTotalActual(item)).toBe(0);
    });
});

describe("itemDeviation", () => {
    it("returns 0 when actual equals planned", () => {
        const item = makeBudgetItem();
        expect(itemDeviation(item)).toBe(0);
    });

    it("returns positive percentage when over budget", () => {
        const item = makeBudgetItem({
            qtyPlanned: 100,
            priceUnitPlanned: 10,   // planned total = 1000
            qtyActual: 100,
            priceUnitActual: 12,     // actual total = 1200, deviation = +20%
        });
        expect(itemDeviation(item)).toBe(20);
    });

    it("returns negative percentage when under budget", () => {
        const item = makeBudgetItem({
            qtyPlanned: 100,
            priceUnitPlanned: 10,   // planned total = 1000
            qtyActual: 100,
            priceUnitActual: 8,      // actual total = 800, deviation = -20%
        });
        expect(itemDeviation(item)).toBe(-20);
    });

    it("returns 0 when planned total is 0 (avoid division by zero)", () => {
        const item = makeBudgetItem({ qtyPlanned: 0, priceUnitPlanned: 0 });
        expect(itemDeviation(item)).toBe(0);
    });

    it("handles large deviations correctly", () => {
        const item = makeBudgetItem({
            qtyPlanned: 10,
            priceUnitPlanned: 100,   // planned = 1000
            qtyActual: 30,
            priceUnitActual: 100,     // actual = 3000, deviation = +200%
        });
        expect(itemDeviation(item)).toBe(200);
    });
});
