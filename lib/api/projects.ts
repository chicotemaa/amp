import { PROJECTS } from "@/lib/data/projects";
import { Project, ProjectStats } from "@/lib/types/project";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/types/supabase";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

function mapProjectRow(row: ProjectRow): Project {
    return {
        id: row.id,
        name: row.name,
        location: row.location ?? "",
        type: (row.type as Project["type"]) ?? "commercial",
        status: (row.status as Project["status"]) ?? "planning",
        progress: row.progress ?? 0,
        startDate: row.start_date ?? new Date().toISOString().slice(0, 10),
        endDate: row.end_date ?? new Date().toISOString().slice(0, 10),
        teamSize: row.team_size ?? 0,
        budget: row.budget ?? 0,
        image: row.image ?? "",
        clientId: row.client_id ?? 0,
        onTrack: row.on_track ?? true,
        description: row.description ?? "",
    };
}

export async function getProjectsDb(): Promise<Project[]> {
    const { data, error } = await supabase.from("projects").select("*");
    if (error) {
        console.error("Supabase projects error:", error.message);
        return PROJECTS;
    }
    return (data as ProjectRow[]).map(mapProjectRow);
}

/** Get all projects */
export function getProjects(): Project[] {
    return PROJECTS;
}

/** Get a single project by ID */
export function getProjectById(id: number): Project | undefined {
    return PROJECTS.find((p) => p.id === id);
}

/** Get projects filtered by status */
export function getProjectsByStatus(status: Project["status"]): Project[] {
    return PROJECTS.filter((p) => p.status === status);
}

/** Compute project stats — all KPIs derive from this single function */
export function getProjectStats(): ProjectStats {
    const active = PROJECTS.filter((p) => p.status === "in-progress");
    const completed = PROJECTS.filter((p) => p.status === "completed");
    const upcoming = PROJECTS.filter((p) => p.status === "planning");

    const onTrackActive = active.filter((p) => p.onTrack);
    const delayedActive = active.filter((p) => !p.onTrack);

    return {
        active: {
            count: active.length,
            onTrack: onTrackActive.length,
            delayed: delayedActive.length,
            critical: 0, // no critical projects in current data
        },
        completed: {
            count: completed.length,
            onBudget: completed.length, // all completed are on budget in mock data
            overBudget: 0,
        },
        upcoming: {
            count: upcoming.length,
            inPlanning: upcoming.filter((p) => p.progress < 15).length,
            readyToStart: upcoming.filter((p) => p.progress >= 15).length,
        },
        issues: {
            count: delayedActive.length,
            minor: delayedActive.length,
            major: 0,
            critical: 0,
        },
    };
}

/** Compute average progress of active (in-progress) projects */
export function getActiveProgressRate(): number {
    const active = PROJECTS.filter((p) => p.status === "in-progress");
    if (active.length === 0) return 0;
    const avg = active.reduce((sum, p) => sum + p.progress, 0) / active.length;
    return Math.round(avg);
}

/** Recent projects (last N by startDate desc) */
export function getRecentProjects(limit = 5): Project[] {
    return [...PROJECTS]
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        .slice(0, limit);
}

// --- SUPABASE MUTATIONS ---

export type CreateProjectInput = Omit<Project, "id" | "progress" | "onTrack">;

export async function createProject(input: CreateProjectInput): Promise<Project> {
    const { data, error } = await supabase
        .from("projects")
        .insert({
            name: input.name,
            location: input.location,
            type: input.type,
            status: input.status,
            start_date: input.startDate,
            end_date: input.endDate,
            team_size: input.teamSize,
            budget: input.budget,
            image: input.image,
            client_id: input.clientId,
            description: input.description,
            progress: 0,
            on_track: true,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating project:", error.message);
        throw new Error("No se pudo crear el proyecto.");
    }

    return mapProjectRow(data as ProjectRow);
}

export async function updateProject(id: number, input: Partial<Project>): Promise<Project> {
    const updates: Record<string, any> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.location !== undefined) updates.location = input.location;
    if (input.type !== undefined) updates.type = input.type;
    if (input.status !== undefined) updates.status = input.status;
    if (input.progress !== undefined) updates.progress = input.progress;
    if (input.startDate !== undefined) updates.start_date = input.startDate;
    if (input.endDate !== undefined) updates.end_date = input.endDate;
    if (input.teamSize !== undefined) updates.team_size = input.teamSize;
    if (input.budget !== undefined) updates.budget = input.budget;
    if (input.image !== undefined) updates.image = input.image;
    if (input.clientId !== undefined) updates.client_id = input.clientId;
    if (input.onTrack !== undefined) updates.on_track = input.onTrack;
    if (input.description !== undefined) updates.description = input.description;

    const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating project:", error.message);
        throw new Error("No se pudo actualizar el proyecto.");
    }

    return mapProjectRow(data as ProjectRow);
}

export async function deleteProject(id: number): Promise<void> {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
        console.error("Error deleting project:", error.message);
        throw new Error("No se pudo eliminar el proyecto.");
    }
}
