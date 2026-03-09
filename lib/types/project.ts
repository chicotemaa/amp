export type ProjectStatus = "in-progress" | "planning" | "completed" | "on-hold";
export type ProjectType = "residential" | "commercial" | "industrial";

export interface Project {
    id: number;
    name: string;
    location: string;
    type: ProjectType;
    status: ProjectStatus;
    progress: number; // 0-100
    startDate: string; // ISO date
    endDate: string;
    teamSize: number;
    budget: number; // USD
    image: string;
    clientId: number;
    onTrack: boolean; // is it on schedule?
    description?: string;
}

export interface ProjectStats {
    active: {
        count: number;
        onTrack: number;
        delayed: number;
        critical: number;
    };
    completed: {
        count: number;
        onBudget: number;
        overBudget: number;
    };
    upcoming: {
        count: number;
        inPlanning: number;
        readyToStart: number;
    };
    issues: {
        count: number;
        minor: number;
        major: number;
        critical: number;
    };
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
    "in-progress": "En Progreso",
    planning: "Planificación",
    completed: "Completado",
    "on-hold": "En Pausa",
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
    "in-progress": "bg-blue-500/10 text-blue-500",
    planning: "bg-orange-500/10 text-orange-500",
    completed: "bg-green-500/10 text-green-500",
    "on-hold": "bg-gray-500/10 text-gray-500",
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
    residential: "Residencial",
    commercial: "Comercial",
    industrial: "Industrial",
};
