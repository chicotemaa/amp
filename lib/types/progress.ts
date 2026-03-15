import type { BudgetCategory } from "@/lib/types/budget";

export type MilestoneStatus =
  | "pending"
  | "field_completed"
  | "validated"
  | "published"
  | "closed"
  | "rejected";
export type ProgressValidationStatus = "recorded" | "validated" | "published";
export type WorkPackageStatus = "planned" | "in_progress" | "completed" | "blocked";

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
  isClientVisible?: boolean;
  fieldCompletedAt?: string | null;
  fieldCompletedBy?: number | null;
  validatedAt?: string | null;
  validatedBy?: number | null;
  createdAt: string;
}

export interface ProgressUpdate {
  id: string;
  projectId: number;
  phaseId: string | null;
  workPackageId?: string | null;
  reportDate: string;
  progressDelta: number;
  executedQty?: number | null;
  note: string | null;
  reportedBy: number | null;
  validationStatus: ProgressValidationStatus;
  validatedAt?: string | null;
  validatedBy?: number | null;
  isClientVisible?: boolean;
  createdAt: string;
}

export interface WorkPackage {
  id: string;
  projectId: number;
  phaseId: string;
  name: string;
  budgetCategory: BudgetCategory;
  unit: string;
  plannedQty: number;
  executedQty: number;
  weight: number;
  plannedUnitCost: number;
  plannedHoursPerUnit: number;
  status: WorkPackageStatus;
  createdAt: string;
}

export interface WorkPackagePerformance {
  workPackageId: string;
  name: string;
  budgetCategory: BudgetCategory;
  unit: string;
  plannedQty: number;
  executedQty: number;
  completionRate: number;
  plannedValue: number;
  earnedValue: number;
  actualCost: number;
  costVariance: number;
  costPerformanceIndex: number | null;
  plannedHours: number;
  earnedHours: number;
  actualHours: number;
  productivityIndex: number | null;
  actualLaborCost: number;
  actualProcurementCost: number;
}

export interface WorkPackagePhasePerformance {
  phaseId: string;
  phaseName: string;
  workPackageCount: number;
  plannedValue: number;
  earnedValue: number;
  actualCost: number;
  costVariance: number;
  costPerformanceIndex: number | null;
  plannedHours: number;
  earnedHours: number;
  actualHours: number;
  productivityIndex: number | null;
  actualLaborCost: number;
  actualProcurementCost: number;
  unassignedActualCost: number;
  unassignedActualHours: number;
  packages: WorkPackagePerformance[];
}

export interface ProjectProgressSummary {
  plannedProgress: number;
  actualProgress: number;
  variance: number;
  phaseCount: number;
}
