export type MilestoneStatus = "pending" | "in-progress" | "completed" | "delayed";

export interface ProjectPhase {
  id: string;
  projectId: number;
  name: string;
  phaseOrder: number;
  plannedProgress: number;
  actualProgress: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export interface Milestone {
  id: string;
  projectId: number;
  phaseId: string | null;
  name: string;
  dueDate: string;
  completedAt: string | null;
  status: MilestoneStatus;
  createdAt: string;
}

export interface ProgressUpdate {
  id: string;
  projectId: number;
  phaseId: string | null;
  reportDate: string;
  progressDelta: number;
  note: string | null;
  reportedBy: number | null;
  createdAt: string;
}

export interface ProjectProgressSummary {
  plannedProgress: number;
  actualProgress: number;
  variance: number;
  phaseCount: number;
}

