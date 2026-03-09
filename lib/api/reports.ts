import { REPORTS } from "@/lib/data/reports";
import { Report } from "@/lib/types/report";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/types/supabase";

type ReportRow = Database["public"]["Tables"]["reports"]["Row"];
type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type EmployeeRow = Database["public"]["Tables"]["employees"]["Row"];

export async function getReportsDb(): Promise<Report[]> {
    const [{ data: reportsData, error: reportsError }, { data: projectsData }, { data: employeesData }] = await Promise.all([
        supabase.from("reports").select("*"),
        supabase.from("projects").select("id,name"),
        supabase.from("employees").select("id,name"),
    ]);

    if (reportsError) {
        console.error("Supabase reports error:", reportsError.message);
        return [...REPORTS];
    }

    const projectsMap = new Map<number, string>(
        ((projectsData ?? []) as Pick<ProjectRow, "id" | "name">[]).map((p) => [p.id, p.name])
    );
    const employeesMap = new Map<number, string>(
        ((employeesData ?? []) as Pick<EmployeeRow, "id" | "name">[]).map((e) => [e.id, e.name])
    );

    return ((reportsData ?? []) as ReportRow[])
        .map((row) => ({
            id: row.id,
            title: row.title,
            projectId: row.project_id,
            projectName: projectsMap.get(row.project_id) ?? `Proyecto ${row.project_id}`,
            date: row.report_date,
            status: row.status as Report["status"],
            authorId: row.author_id,
            authorName: employeesMap.get(row.author_id) ?? `Autor ${row.author_id}`,
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getReports(): Report[] {
    return [...REPORTS].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

export function getRecentReports(limit = 3): Report[] {
    return getReports().slice(0, limit);
}

export function getReportStats() {
    return {
        total: REPORTS.length,
        pending: REPORTS.filter((r) => r.status === "pending").length,
        inReview: REPORTS.filter((r) => r.status === "in-review").length,
        completed: REPORTS.filter((r) => r.status === "completed").length,
    };
}
