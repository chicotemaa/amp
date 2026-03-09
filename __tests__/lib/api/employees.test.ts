import { describe, it, expect } from "vitest";
import {
    getEmployees,
    getEmployeeById,
    getEmployeesByProject,
    getEmployeeStats,
    getResourceUtilization,
} from "@/lib/api/employees";
import { EMPLOYEES } from "@/lib/data/employees";

describe("getEmployees", () => {
    it("returns all employees", () => {
        const employees = getEmployees();
        expect(employees).toEqual(EMPLOYEES);
        expect(employees.length).toBe(8);
    });

    it("each employee has required fields", () => {
        const employees = getEmployees();
        for (const e of employees) {
            expect(e).toHaveProperty("id");
            expect(e).toHaveProperty("name");
            expect(e).toHaveProperty("role");
            expect(e).toHaveProperty("department");
            expect(e).toHaveProperty("status");
            expect(e).toHaveProperty("projectIds");
            expect(e).toHaveProperty("hoursThisWeek");
        }
    });
});

describe("getEmployeeById", () => {
    it("returns the correct employee for a valid ID", () => {
        const emp = getEmployeeById(1);
        expect(emp).toBeDefined();
        expect(emp!.name).toBe("Carlos Rodríguez");
    });

    it("returns undefined for an invalid ID", () => {
        expect(getEmployeeById(999)).toBeUndefined();
    });
});

describe("getEmployeesByProject", () => {
    it("returns employees assigned to project 1", () => {
        const team = getEmployeesByProject(1);
        expect(team.length).toBeGreaterThan(0);
        for (const e of team) {
            expect(e.projectIds).toContain(1);
        }
    });

    it("returns empty array for a non-existent project", () => {
        const team = getEmployeesByProject(999);
        expect(team).toEqual([]);
    });

    it("returns employees assigned to project 3", () => {
        const team = getEmployeesByProject(3);
        const expectedIds = EMPLOYEES.filter((e) => e.projectIds.includes(3)).map(
            (e) => e.id
        );
        expect(team.map((e) => e.id).sort()).toEqual(expectedIds.sort());
    });
});

describe("getEmployeeStats", () => {
    it("returns all required stat fields", () => {
        const stats = getEmployeeStats();
        expect(stats).toHaveProperty("total");
        expect(stats).toHaveProperty("active");
        expect(stats).toHaveProperty("inProject");
        expect(stats).toHaveProperty("hoursThisWeek");
        expect(stats).toHaveProperty("activeProjects");
    });

    it("total matches number of employees", () => {
        const stats = getEmployeeStats();
        expect(stats.total).toBe(EMPLOYEES.length);
    });

    it("active count excludes inactive employees", () => {
        const stats = getEmployeeStats();
        const active = EMPLOYEES.filter((e) => e.status !== "Inactivo").length;
        expect(stats.active).toBe(active);
    });

    it("inProject counts employees with at least one project", () => {
        const stats = getEmployeeStats();
        const inProject = EMPLOYEES.filter(
            (e) => e.projectIds.length > 0
        ).length;
        expect(stats.inProject).toBe(inProject);
    });

    it("hoursThisWeek is sum of all employee hours", () => {
        const stats = getEmployeeStats();
        const totalHours = EMPLOYEES.reduce(
            (sum, e) => sum + e.hoursThisWeek,
            0
        );
        expect(stats.hoursThisWeek).toBe(totalHours);
    });

    it("activeProjects counts unique project IDs", () => {
        const stats = getEmployeeStats();
        const uniqueIds = new Set(EMPLOYEES.flatMap((e) => e.projectIds));
        expect(stats.activeProjects).toBe(uniqueIds.size);
    });
});

describe("getResourceUtilization", () => {
    it("returns one entry per department", () => {
        const util = getResourceUtilization();
        expect(util.length).toBe(4);
        const depts = util.map((u) => u.department);
        expect(depts).toContain("Diseño");
        expect(depts).toContain("Ingeniería");
        expect(depts).toContain("Construcción");
        expect(depts).toContain("Gestión");
    });

    it("percentages sum to approximately 100", () => {
        const util = getResourceUtilization();
        const total = util.reduce((sum, u) => sum + u.percentage, 0);
        // Allow for rounding errors (could be 99-101)
        expect(total).toBeGreaterThanOrEqual(96);
        expect(total).toBeLessThanOrEqual(104);
    });

    it("each department has non-negative count and hours", () => {
        const util = getResourceUtilization();
        for (const u of util) {
            expect(u.count).toBeGreaterThanOrEqual(0);
            expect(u.hoursAssigned).toBeGreaterThanOrEqual(0);
            expect(u.percentage).toBeGreaterThanOrEqual(0);
        }
    });

    it("department label matches department name", () => {
        const util = getResourceUtilization();
        for (const u of util) {
            expect(u.label).toBe(u.department);
        }
    });

    it("Diseño department count is correct", () => {
        const util = getResourceUtilization();
        const diseno = util.find((u) => u.department === "Diseño")!;
        const expected = EMPLOYEES.filter(
            (e) => e.department === "Diseño" && e.status !== "Inactivo"
        ).length;
        expect(diseno.count).toBe(expected);
    });
});
