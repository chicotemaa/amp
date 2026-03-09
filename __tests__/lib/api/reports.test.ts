import { describe, it, expect } from "vitest";
import {
    getReports,
    getRecentReports,
    getReportStats,
} from "@/lib/api/reports";
import { REPORTS } from "@/lib/data/reports";

describe("getReports", () => {
    it("returns all reports", () => {
        const reports = getReports();
        expect(reports.length).toBe(REPORTS.length);
    });

    it("returns reports sorted by date descending", () => {
        const reports = getReports();
        for (let i = 1; i < reports.length; i++) {
            const prev = new Date(reports[i - 1].date).getTime();
            const curr = new Date(reports[i].date).getTime();
            expect(prev).toBeGreaterThanOrEqual(curr);
        }
    });

    it("does not mutate the original array", () => {
        const reports = getReports();
        expect(reports).not.toBe(REPORTS);
    });

    it("each report has required fields", () => {
        const reports = getReports();
        for (const r of reports) {
            expect(r).toHaveProperty("id");
            expect(r).toHaveProperty("title");
            expect(r).toHaveProperty("projectId");
            expect(r).toHaveProperty("status");
            expect(r).toHaveProperty("authorId");
            expect(r).toHaveProperty("date");
        }
    });
});

describe("getRecentReports", () => {
    it("returns at most 3 reports by default", () => {
        const recent = getRecentReports();
        expect(recent.length).toBeLessThanOrEqual(3);
    });

    it("respects custom limit", () => {
        const recent = getRecentReports(1);
        expect(recent.length).toBe(1);
    });

    it("returns reports sorted by date descending", () => {
        const recent = getRecentReports(5);
        for (let i = 1; i < recent.length; i++) {
            const prev = new Date(recent[i - 1].date).getTime();
            const curr = new Date(recent[i].date).getTime();
            expect(prev).toBeGreaterThanOrEqual(curr);
        }
    });

    it("most recent report is first", () => {
        const [first] = getRecentReports(1);
        const allSorted = getReports();
        expect(first.id).toBe(allSorted[0].id);
    });
});

describe("getReportStats", () => {
    it("returns all required stat fields", () => {
        const stats = getReportStats();
        expect(stats).toHaveProperty("total");
        expect(stats).toHaveProperty("pending");
        expect(stats).toHaveProperty("inReview");
        expect(stats).toHaveProperty("completed");
    });

    it("total matches number of reports", () => {
        const stats = getReportStats();
        expect(stats.total).toBe(REPORTS.length);
    });

    it("status counts are correct", () => {
        const stats = getReportStats();
        const pending = REPORTS.filter((r) => r.status === "pending").length;
        const inReview = REPORTS.filter((r) => r.status === "in-review").length;
        const completed = REPORTS.filter((r) => r.status === "completed").length;
        expect(stats.pending).toBe(pending);
        expect(stats.inReview).toBe(inReview);
        expect(stats.completed).toBe(completed);
    });

    it("pending + inReview + completed equals total", () => {
        const stats = getReportStats();
        expect(stats.pending + stats.inReview + stats.completed).toBe(
            stats.total
        );
    });
});
