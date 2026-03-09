export type ReportStatus = "completed" | "pending" | "in-review";

export interface Report {
    id: number;
    title: string;
    projectId: number;
    projectName: string;
    date: string; // ISO date
    status: ReportStatus;
    authorId: number;
    authorName: string;
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
    completed: "Completado",
    pending: "Pendiente",
    "in-review": "En Revisión",
};
