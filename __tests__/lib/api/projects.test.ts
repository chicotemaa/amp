import { describe, it, expect } from "vitest";
import {
    getProjects,
    getProjectById,
    getProjectsByStatus,
    getProjectStats,
    getActiveProgressRate,
    getRecentProjects,
} from "@/lib/api/projects";
import { PROJECTS } from "@/lib/data/projects";

describe("getProjects", () => {
    it("returns all projects", () => {
        const projects = getProjects();
        expect(projects).toEqual(PROJECTS);
        expect(projects.length).toBe(PROJECTS.length);
    });

    it("each project has required fields", () => {
        const projects = getProjects();
        for (const p of projects) {
            expect(p).toHaveProperty("id");
            expect(p).toHaveProperty("name");
            expect(p).toHaveProperty("status");
            expect(p).toHaveProperty("budget");
            expect(p).toHaveProperty("progress");
            expect(p).toHaveProperty("clientId");
        }
    });
});

describe("getProjectById", () => {
    it("returns the correct project for a valid ID", () => {
        const project = getProjectById(1);
        expect(project).toBeDefined();
        expect(project!.name).toBe("Torre Residencial Marina");
        expect(project!.id).toBe(1);
    });

    it("returns undefined for an invalid ID", () => {
        expect(getProjectById(999)).toBeUndefined();
    });

    it("returns undefined for ID 0", () => {
        expect(getProjectById(0)).toBeUndefined();
    });

    it("returns undefined for negative ID", () => {
        expect(getProjectById(-1)).toBeUndefined();
    });
});

describe("getProjectsByStatus", () => {
    it("filters in-progress projects", () => {
        const inProgress = getProjectsByStatus("in-progress");
        expect(inProgress.length).toBeGreaterThan(0);
        for (const p of inProgress) {
            expect(p.status).toBe("in-progress");
        }
    });

    it("filters planning projects", () => {
        const planning = getProjectsByStatus("planning");
        expect(planning.length).toBeGreaterThan(0);
        for (const p of planning) {
            expect(p.status).toBe("planning");
        }
    });

    it("filters completed projects", () => {
        const completed = getProjectsByStatus("completed");
        expect(completed.length).toBeGreaterThan(0);
        for (const p of completed) {
            expect(p.status).toBe("completed");
        }
    });

    it("returns empty array for on-hold (no on-hold projects in data)", () => {
        const onHold = getProjectsByStatus("on-hold");
        expect(onHold).toEqual([]);
    });
});

describe("getProjectStats", () => {
    it("returns stats with all required sections", () => {
        const stats = getProjectStats();
        expect(stats).toHaveProperty("active");
        expect(stats).toHaveProperty("completed");
        expect(stats).toHaveProperty("upcoming");
        expect(stats).toHaveProperty("issues");
    });

    it("active count matches in-progress projects", () => {
        const stats = getProjectStats();
        const inProgress = PROJECTS.filter((p) => p.status === "in-progress");
        expect(stats.active.count).toBe(inProgress.length);
    });

    it("onTrack + delayed equals total active", () => {
        const stats = getProjectStats();
        expect(stats.active.onTrack + stats.active.delayed).toBe(
            stats.active.count
        );
    });

    it("completed count matches completed projects", () => {
        const stats = getProjectStats();
        const completed = PROJECTS.filter((p) => p.status === "completed");
        expect(stats.completed.count).toBe(completed.length);
    });

    it("upcoming count matches planning projects", () => {
        const stats = getProjectStats();
        const planning = PROJECTS.filter((p) => p.status === "planning");
        expect(stats.upcoming.count).toBe(planning.length);
    });

    it("inPlanning + readyToStart equals upcoming count", () => {
        const stats = getProjectStats();
        expect(stats.upcoming.inPlanning + stats.upcoming.readyToStart).toBe(
            stats.upcoming.count
        );
    });

    it("issues count is not negative", () => {
        const stats = getProjectStats();
        expect(stats.issues.count).toBeGreaterThanOrEqual(0);
        expect(stats.issues.minor).toBeGreaterThanOrEqual(0);
        expect(stats.issues.major).toBeGreaterThanOrEqual(0);
        expect(stats.issues.critical).toBeGreaterThanOrEqual(0);
    });
});

describe("getActiveProgressRate", () => {
    it("returns a number between 0 and 100", () => {
        const rate = getActiveProgressRate();
        expect(rate).toBeGreaterThanOrEqual(0);
        expect(rate).toBeLessThanOrEqual(100);
    });

    it("returns a rounded integer", () => {
        const rate = getActiveProgressRate();
        expect(Number.isInteger(rate)).toBe(true);
    });

    it("correctly averages active project progress", () => {
        const active = PROJECTS.filter((p) => p.status === "in-progress");
        const expectedAvg = Math.round(
            active.reduce((sum, p) => sum + p.progress, 0) / active.length
        );
        expect(getActiveProgressRate()).toBe(expectedAvg);
    });
});

describe("getRecentProjects", () => {
    it("returns at most 5 projects by default", () => {
        const recent = getRecentProjects();
        expect(recent.length).toBeLessThanOrEqual(5);
    });

    it("respects custom limit", () => {
        const recent = getRecentProjects(2);
        expect(recent.length).toBe(2);
    });

    it("returns projects sorted by startDate descending", () => {
        const recent = getRecentProjects();
        for (let i = 1; i < recent.length; i++) {
            const prev = new Date(recent[i - 1].startDate).getTime();
            const curr = new Date(recent[i].startDate).getTime();
            expect(prev).toBeGreaterThanOrEqual(curr);
        }
    });

    it("limit of 1 returns the most recent project", () => {
        const [most] = getRecentProjects(1);
        const sorted = [...PROJECTS].sort(
            (a, b) =>
                new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
        expect(most.id).toBe(sorted[0].id);
    });
});
