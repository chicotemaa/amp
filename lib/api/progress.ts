import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/types/supabase";
import {
  Milestone,
  ProjectPhase,
  ProgressUpdate,
  ProjectProgressSummary,
} from "@/lib/types/progress";

type ProjectPhaseRow = Database["public"]["Tables"]["project_phases"]["Row"];
type MilestoneRow = Database["public"]["Tables"]["milestones"]["Row"];
type ProgressUpdateRow = Database["public"]["Tables"]["progress_updates"]["Row"];
type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

function mapPhase(row: ProjectPhaseRow): ProjectPhase {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    phaseOrder: row.phase_order,
    plannedProgress: row.planned_progress,
    actualProgress: row.actual_progress,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
  };
}

function mapMilestone(row: MilestoneRow): Milestone {
  return {
    id: row.id,
    projectId: row.project_id,
    phaseId: row.phase_id,
    name: row.name,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    status: row.status as Milestone["status"],
    createdAt: row.created_at,
  };
}

function mapProgressUpdate(row: ProgressUpdateRow): ProgressUpdate {
  return {
    id: row.id,
    projectId: row.project_id,
    phaseId: row.phase_id,
    reportDate: row.report_date,
    progressDelta: row.progress_delta,
    note: row.note,
    reportedBy: row.reported_by,
    createdAt: row.created_at,
  };
}

export async function getProjectPhasesDb(projectId: number): Promise<ProjectPhase[]> {
  const { data, error } = await supabase
    .from("project_phases")
    .select("*")
    .eq("project_id", projectId)
    .order("phase_order", { ascending: true });

  if (error) {
    console.error("Supabase project_phases error:", error.message);
    return [];
  }

  return ((data ?? []) as ProjectPhaseRow[]).map(mapPhase);
}

export async function getMilestonesByProjectDb(projectId: number): Promise<Milestone[]> {
  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("project_id", projectId)
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Supabase milestones error:", error.message);
    return [];
  }

  return ((data ?? []) as MilestoneRow[]).map(mapMilestone);
}

export async function getProgressUpdatesByProjectDb(
  projectId: number
): Promise<ProgressUpdate[]> {
  const { data, error } = await supabase
    .from("progress_updates")
    .select("*")
    .eq("project_id", projectId)
    .order("report_date", { ascending: false });

  if (error) {
    console.error("Supabase progress_updates error:", error.message);
    return [];
  }

  return ((data ?? []) as ProgressUpdateRow[]).map(mapProgressUpdate);
}

export async function getProjectProgressSummaryDb(
  projectId: number
): Promise<ProjectProgressSummary> {
  const phases = await getProjectPhasesDb(projectId);
  if (phases.length === 0) {
    return {
      plannedProgress: 0,
      actualProgress: 0,
      variance: 0,
      phaseCount: 0,
    };
  }

  const plannedProgress =
    phases.reduce((acc, phase) => acc + phase.plannedProgress, 0) / phases.length;
  const actualProgress =
    phases.reduce((acc, phase) => acc + phase.actualProgress, 0) / phases.length;

  return {
    plannedProgress: Math.round(plannedProgress * 100) / 100,
    actualProgress: Math.round(actualProgress * 100) / 100,
    variance: Math.round((actualProgress - plannedProgress) * 100) / 100,
    phaseCount: phases.length,
  };
}

export type CreateProgressUpdateInput = Omit<
  ProgressUpdate,
  "id" | "createdAt"
>;

export async function createProgressUpdateDb(
  input: CreateProgressUpdateInput
): Promise<ProgressUpdate> {
  const { data, error } = await supabase
    .from("progress_updates")
    .insert({
      project_id: input.projectId,
      phase_id: input.phaseId,
      report_date: input.reportDate,
      progress_delta: input.progressDelta,
      note: input.note,
      reported_by: input.reportedBy,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating progress update:", error.message);
    throw new Error("No se pudo registrar el avance.");
  }

  // Keep project-level progress/status in sync with operational updates.
  const { data: projectData } = await supabase
    .from("projects")
    .select("*")
    .eq("id", input.projectId)
    .single();

  if (projectData) {
    const project = projectData as ProjectRow;
    const currentProgress = Number(project.progress ?? 0);
    const delta = Number(input.progressDelta ?? 0);
    const nextProgress = Math.min(100, Math.max(0, currentProgress + delta));

    const updates: Database["public"]["Tables"]["projects"]["Update"] = {
      progress: nextProgress,
    };

    if (nextProgress >= 100) {
      updates.status = "completed";
    } else if (nextProgress > 0 && project.status === "planning") {
      updates.status = "in-progress";
    }

    await supabase.from("projects").update(updates).eq("id", input.projectId);
  }

  return mapProgressUpdate(data as ProgressUpdateRow);
}

export async function updateMilestoneStatusDb(
  id: string,
  status: Milestone["status"]
): Promise<Milestone> {
  const updates: Database["public"]["Tables"]["milestones"]["Update"] = {
    status,
    completed_at: status === "completed" ? new Date().toISOString().slice(0, 10) : null,
  };

  const { data, error } = await supabase
    .from("milestones")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("Error updating milestone:", error.message);
    throw new Error("No se pudo actualizar el hito.");
  }

  return mapMilestone(data as MilestoneRow);
}
