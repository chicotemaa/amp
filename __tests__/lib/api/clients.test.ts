import { describe, it, expect } from "vitest";
import {
    getClients,
    getClientById,
    getRecentClients,
    getClientStats,
} from "@/lib/api/clients";
import { CLIENTS } from "@/lib/data/clients";

describe("getClients", () => {
    it("returns all clients", () => {
        const clients = getClients();
        expect(clients).toEqual(CLIENTS);
        expect(clients.length).toBe(5);
    });

    it("each client has required fields", () => {
        const clients = getClients();
        for (const c of clients) {
            expect(c).toHaveProperty("id");
            expect(c).toHaveProperty("name");
            expect(c).toHaveProperty("company");
            expect(c).toHaveProperty("email");
            expect(c).toHaveProperty("status");
            expect(c).toHaveProperty("projectIds");
        }
    });
});

describe("getClientById", () => {
    it("returns the correct client for a valid ID", () => {
        const client = getClientById(1);
        expect(client).toBeDefined();
        expect(client!.name).toBe("Sara Martínez");
    });

    it("returns undefined for an invalid ID", () => {
        expect(getClientById(999)).toBeUndefined();
    });

    it("returns undefined for ID 0", () => {
        expect(getClientById(0)).toBeUndefined();
    });

    it("returns the last client correctly", () => {
        const lastId = CLIENTS[CLIENTS.length - 1].id;
        const client = getClientById(lastId);
        expect(client).toBeDefined();
        expect(client!.id).toBe(lastId);
    });
});

describe("getRecentClients", () => {
    it("returns at most 3 clients by default", () => {
        const recent = getRecentClients();
        expect(recent.length).toBeLessThanOrEqual(3);
    });

    it("respects custom limit", () => {
        const recent = getRecentClients(1);
        expect(recent.length).toBe(1);
    });

    it("returns clients sorted by lastInteraction descending", () => {
        const recent = getRecentClients(5);
        for (let i = 1; i < recent.length; i++) {
            const prev = new Date(recent[i - 1].lastInteraction).getTime();
            const curr = new Date(recent[i].lastInteraction).getTime();
            expect(prev).toBeGreaterThanOrEqual(curr);
        }
    });
});

describe("getClientStats", () => {
    it("returns total, active, potential, and totalProjects", () => {
        const stats = getClientStats();
        expect(stats).toHaveProperty("total");
        expect(stats).toHaveProperty("active");
        expect(stats).toHaveProperty("potential");
        expect(stats).toHaveProperty("totalProjects");
    });

    it("total matches number of clients", () => {
        const stats = getClientStats();
        expect(stats.total).toBe(CLIENTS.length);
    });

    it("active count matches Activo clients", () => {
        const stats = getClientStats();
        const activeCount = CLIENTS.filter((c) => c.status === "Activo").length;
        expect(stats.active).toBe(activeCount);
    });

    it("potential count matches Potencial clients", () => {
        const stats = getClientStats();
        const potentialCount = CLIENTS.filter(
            (c) => c.status === "Potencial"
        ).length;
        expect(stats.potential).toBe(potentialCount);
    });

    it("totalProjects is sum of all projectIds arrays", () => {
        const stats = getClientStats();
        const expectedTotal = CLIENTS.reduce(
            (sum, c) => sum + c.projectIds.length,
            0
        );
        expect(stats.totalProjects).toBe(expectedTotal);
    });
});
