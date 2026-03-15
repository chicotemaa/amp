import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/types/supabase";
import { logCurrentUserAuditEvent } from "@/lib/api/audit";
import {
  Milestone,
  ProjectPhase,
  ProgressUpdate,
  ProjectProgressSummary,
  WorkPackage,
  WorkPackagePerformance,
  WorkPackagePhasePerformance,
} from "@/lib/types/progress";
import type { BudgetCategory } from "@/lib/types/budget";

type ProjectPhaseRow = Database["public"]["Tables"]["project_phases"]["Row"];
type WorkPackageRow = Database["public"]["Tables"]["work_packages"]["Row"];
type MilestoneRow = Database["public"]["Tables"]["milestones"]["Row"];
type ProgressUpdateRow = Database["public"]["Tables"]["progress_updates"]["Row"];
type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type LaborEntryRow = Database["public"]["Tables"]["labor_entries"]["Row"];
type PurchaseOrderRow = Database["public"]["Tables"]["purchase_orders"]["Row"];

function clampProgress(value: number) {
  return Math.min(100, Math.max(0, value));
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function getPhaseWeights(phases: ProjectPhase[]) {
  const sorted = [...phases].sort((a, b) => a.phaseOrder - b.phaseOrder);
  let previousPlanned = 0;

  const withRawWeights = sorted.map((phase) => {
    const rawWeight = Math.max(0, phase.plannedProgress - previousPlanned);
    previousPlanned = phase.plannedProgress;
    return { phase, rawWeight };
  });

  const totalWeight = withRawWeights.reduce((acc, item) => acc + item.rawWeight, 0);

  if (totalWeight <= 0) {
    const equalWeight = sorted.length > 0 ? 100 / sorted.length : 0;
    return sorted.map((phase) => ({ phase, weight: equalWeight }));
  }

  return withRawWeights.map((item) => ({
    phase: item.phase,
    weight: (item.rawWeight / totalWeight) * 100,
  }));
}

function getWorkPackageWeights(workPackages: WorkPackage[]) {
  const totalWeight = workPackages.reduce((sum, workPackage) => sum + workPackage.weight, 0);

  if (totalWeight <= 0) {
    const equalWeight = workPackages.length > 0 ? 100 / workPackages.length : 0;
    return workPackages.map((workPackage) => ({ workPackage, weight: equalWeight }));
  }

  return workPackages.map((workPackage) => ({
    workPackage,
    weight: (workPackage.weight / totalWeight) * 100,
  }));
}

function sumNumbers(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0);
}

async function recomputeProjectProgressDb(projectId: number) {
  const phases = await getProjectPhasesDb(projectId);
  if (phases.length === 0) return null;

  const weightedProgress = getPhaseWeights(phases).reduce((acc, item) => {
    return acc + (item.phase.actualProgress * item.weight) / 100;
  }, 0);

  const nextProgress = Math.round(clampProgress(weightedProgress) * 100) / 100;
  const projectUpdate: Database["public"]["Tables"]["projects"]["Update"] = {
    progress: nextProgress,
  };

  if (nextProgress >= 100) {
    projectUpdate.status = "completed";
  } else if (nextProgress > 0) {
    projectUpdate.status = "in-progress";
  }

  await supabase.from("projects").update(projectUpdate).eq("id", projectId);
  return nextProgress;
}

async function recomputePhaseActualProgressDb(projectId: number, phaseId: string) {
  const [
    { data: phaseData },
    { data: progressData },
    { data: milestoneData },
    { data: workPackageData },
  ] = await Promise.all([
    supabase.from("project_phases").select("*").eq("id", phaseId).single(),
    supabase
      .from("progress_updates")
      .select("progress_delta, work_package_id, executed_qty")
      .eq("project_id", projectId)
      .eq("phase_id", phaseId)
      .in("validation_status", ["validated", "published"]),
    supabase
      .from("milestones")
      .select("status")
      .eq("project_id", projectId)
      .eq("phase_id", phaseId),
    supabase
      .from("work_packages")
      .select("*")
      .eq("project_id", projectId)
      .eq("phase_id", phaseId)
      .order("created_at", { ascending: true }),
  ]);

  if (!phaseData) return null;

  const validatedProgress = round2(
    clampProgress(
      ((progressData ?? []) as Array<{
        progress_delta: number | null;
        work_package_id: string | null;
        executed_qty: number | null;
      }>).reduce(
        (acc, row) => acc + Number(row.progress_delta ?? 0),
        0
      )
    )
  );

  const milestones = (milestoneData ?? []) as Array<{ status: string }>;
  const validatedMilestones = milestones.filter((milestone) =>
    ["validated", "published", "closed"].includes(milestone.status)
  ).length;
  const milestoneProgress = milestones.length > 0 ? round2((validatedMilestones / milestones.length) * 100) : 0;

  const workPackageRows = (workPackageData ?? []) as WorkPackageRow[];
  let measuredProgress: number | null = null;

  if (workPackageRows.length > 0) {
    const measuredUpdates = (progressData ?? []) as Array<{
      progress_delta: number | null;
      work_package_id: string | null;
      executed_qty: number | null;
    }>;
    const executedQtyByPackage = new Map<string, number>();

    for (const row of measuredUpdates) {
      if (!row.work_package_id) continue;
      executedQtyByPackage.set(
        row.work_package_id,
        (executedQtyByPackage.get(row.work_package_id) ?? 0) + Number(row.executed_qty ?? 0)
      );
    }

    const mappedWorkPackages = workPackageRows.map(mapWorkPackage);
    const packageWeights = getWorkPackageWeights(mappedWorkPackages);
    const packageUpdates = packageWeights.map(({ workPackage, weight }) => {
      const executedQty = Math.min(
        workPackage.plannedQty,
        round2(executedQtyByPackage.get(workPackage.id) ?? 0)
      );
      const completionRate =
        workPackage.plannedQty > 0 ? clampProgress((executedQty / workPackage.plannedQty) * 100) : 0;
      const nextStatus =
        executedQty >= workPackage.plannedQty
          ? "completed"
          : executedQty > 0
            ? "in_progress"
            : "planned";

      return {
        id: workPackage.id,
        executedQty,
        nextStatus,
        weightedProgress: (completionRate * weight) / 100,
        needsUpdate:
          executedQty !== workPackage.executedQty || nextStatus !== workPackage.status,
      };
    });

    const rowsToUpdate = packageUpdates.filter((item) => item.needsUpdate);
    if (rowsToUpdate.length > 0) {
      await Promise.all(
        rowsToUpdate.map((item) =>
          supabase
            .from("work_packages")
            .update({
              executed_qty: item.executedQty,
              status: item.nextStatus,
            })
            .eq("id", item.id)
        )
      );
    }

    measuredProgress = round2(
      clampProgress(
        packageUpdates.reduce((sum, item) => sum + item.weightedProgress, 0)
      )
    );
  }

  const nextActualProgress =
    measuredProgress !== null
      ? measuredProgress
      : round2(Math.max(validatedProgress, milestoneProgress));

  await supabase
    .from("project_phases")
    .update({ actual_progress: nextActualProgress })
    .eq("id", phaseId);

  await recomputeProjectProgressDb(projectId);

  return {
    phase: phaseData as ProjectPhaseRow,
    measuredProgress,
    validatedProgress,
    milestoneProgress,
    nextActualProgress,
  };
}

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
    isClientVisible: row.is_client_visible ?? false,
    fieldCompletedAt: row.field_completed_at ?? null,
    fieldCompletedBy: row.field_completed_by ?? null,
    validatedAt: row.validated_at ?? null,
    validatedBy: row.validated_by ?? null,
    createdAt: row.created_at,
  };
}

function mapWorkPackage(row: WorkPackageRow): WorkPackage {
  return {
    id: row.id,
    projectId: row.project_id,
    phaseId: row.phase_id,
    name: row.name,
    budgetCategory: row.budget_category as BudgetCategory,
    unit: row.unit,
    plannedQty: Number(row.planned_qty),
    executedQty: Number(row.executed_qty ?? 0),
    weight: Number(row.weight),
    plannedUnitCost: Number(row.planned_unit_cost ?? 0),
    plannedHoursPerUnit: Number(row.planned_hours_per_unit ?? 0),
    status: row.status as WorkPackage["status"],
    createdAt: row.created_at,
  };
}

function mapProgressUpdate(row: ProgressUpdateRow): ProgressUpdate {
  return {
    id: row.id,
    projectId: row.project_id,
    phaseId: row.phase_id,
    workPackageId: row.work_package_id ?? null,
    reportDate: row.report_date,
    progressDelta: row.progress_delta,
    executedQty: row.executed_qty ?? null,
    note: row.note,
    reportedBy: row.reported_by,
    validationStatus: (row.validation_status ?? "recorded") as ProgressUpdate["validationStatus"],
    validatedAt: row.validated_at ?? null,
    validatedBy: row.validated_by ?? null,
    isClientVisible: row.is_client_visible ?? false,
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

export async function getWorkPackagesByProjectDb(projectId: number): Promise<WorkPackage[]> {
  const { data, error } = await supabase
    .from("work_packages")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Supabase work_packages error:", error.message);
    return [];
  }

  return ((data ?? []) as WorkPackageRow[]).map(mapWorkPackage);
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

  const weightedPhases = getPhaseWeights(phases);
  const plannedProgress = weightedPhases.reduce((acc, item) => {
    return acc + (item.phase.plannedProgress * item.weight) / 100;
  }, 0);
  const actualProgress = weightedPhases.reduce((acc, item) => {
    return acc + (item.phase.actualProgress * item.weight) / 100;
  }, 0);

  return {
    plannedProgress: Math.round(plannedProgress * 100) / 100,
    actualProgress: Math.round(actualProgress * 100) / 100,
    variance: Math.round((actualProgress - plannedProgress) * 100) / 100,
    phaseCount: phases.length,
  };
}

export type CreateProgressUpdateInput = Omit<
  ProgressUpdate,
  "id" | "createdAt" | "validationStatus" | "validatedAt" | "validatedBy" | "isClientVisible"
>;

export async function createProgressUpdateDb(
  input: CreateProgressUpdateInput
): Promise<ProgressUpdate> {
  const { data, error } = await supabase
    .from("progress_updates")
    .insert({
      project_id: input.projectId,
      phase_id: input.phaseId,
      work_package_id: input.workPackageId ?? null,
      report_date: input.reportDate,
      progress_delta: input.progressDelta,
      executed_qty: input.executedQty ?? null,
      note: input.note,
      reported_by: input.reportedBy,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating progress update:", error.message);
    throw new Error("No se pudo registrar el avance.");
  }

  return mapProgressUpdate(data as ProgressUpdateRow);
}

export async function validateProgressUpdateDb(
  id: string,
  validatedBy: number | null
): Promise<ProgressUpdate> {
  const { data: currentData, error: currentError } = await supabase
    .from("progress_updates")
    .select("*")
    .eq("id", id)
    .single();

  if (currentError || !currentData) {
    console.error("Error loading progress update:", currentError?.message);
    throw new Error("No se encontró el avance.");
  }

  const current = currentData as ProgressUpdateRow;
  if ((current.validation_status ?? "recorded") !== "recorded") {
    return mapProgressUpdate(current);
  }

  const { data, error } = await supabase
    .from("progress_updates")
    .update({
      validation_status: "validated",
      validated_by: validatedBy,
      validated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error validating progress update:", error?.message);
    throw new Error("No se pudo validar el avance.");
  }

  if (current.phase_id) {
    await recomputePhaseActualProgressDb(current.project_id, current.phase_id);
  } else {
    const { data: projectData } = await supabase
      .from("projects")
      .select("*")
      .eq("id", current.project_id)
      .single();

    if (projectData) {
      const project = projectData as ProjectRow;
      const currentProgress = Number(project.progress ?? 0);
      const delta = Number(current.progress_delta ?? 0);
      const nextProgress = clampProgress(currentProgress + delta);

      const projectUpdate: Database["public"]["Tables"]["projects"]["Update"] = {
        progress: nextProgress,
      };

      if (nextProgress >= 100) {
        projectUpdate.status = "completed";
      } else if (nextProgress > 0 && project.status === "planning") {
        projectUpdate.status = "in-progress";
      }

      await supabase.from("projects").update(projectUpdate).eq("id", current.project_id);
    }
  }

  await logCurrentUserAuditEvent({
    entityType: "progress_update",
    entityId: id,
    projectId: current.project_id,
    action: "validate",
    fromState: current.validation_status ?? "recorded",
    toState: "validated",
    metadata: {
      phaseId: current.phase_id,
      workPackageId: current.work_package_id,
      executedQty: current.executed_qty,
      progressDelta: current.progress_delta,
    },
  });

  return mapProgressUpdate(data as ProgressUpdateRow);
}

export async function publishProgressUpdateDb(
  id: string,
  validatedBy: number | null
): Promise<ProgressUpdate> {
  const { data: currentData } = await supabase
    .from("progress_updates")
    .select("*")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("progress_updates")
    .update({
      validation_status: "published",
      validated_by: validatedBy,
      validated_at: new Date().toISOString(),
      is_client_visible: true,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error publishing progress update:", error?.message);
    throw new Error("No se pudo publicar el avance al cliente.");
  }

  const current = currentData as ProgressUpdateRow | null;
  await logCurrentUserAuditEvent({
    entityType: "progress_update",
    entityId: id,
    projectId: current?.project_id ?? null,
    action: "publish",
    fromState: current?.validation_status ?? "validated",
    toState: "published",
    metadata: {
      phaseId: current?.phase_id ?? null,
      workPackageId: current?.work_package_id ?? null,
      executedQty: current?.executed_qty ?? null,
      progressDelta: current?.progress_delta ?? null,
    },
  });

  return mapProgressUpdate(data as ProgressUpdateRow);
}

export async function updateMilestoneStatusDb(
  id: string,
  status: Milestone["status"],
  employeeId?: number | null
): Promise<Milestone> {
  const { data: currentData, error: currentError } = await supabase
    .from("milestones")
    .select("*")
    .eq("id", id)
    .single();

  if (currentError || !currentData) {
    console.error("Error loading milestone:", currentError?.message);
    throw new Error("No se encontró el hito.");
  }

  const current = currentData as MilestoneRow;
  const updates: Database["public"]["Tables"]["milestones"]["Update"] = {
    status,
  };

  const now = new Date().toISOString();
  const rawUpdates: Database["public"]["Tables"]["milestones"]["Update"] = { ...updates };

  if (status === "field_completed") {
    updates.completed_at = now.slice(0, 10);
    rawUpdates.field_completed_at = now;
    rawUpdates.field_completed_by = employeeId ?? null;
  }

  if (status === "validated") {
    rawUpdates.validated_at = now;
    rawUpdates.validated_by = employeeId ?? null;
  }

  if (status === "published") {
    rawUpdates.validated_at = now;
    rawUpdates.validated_by = employeeId ?? null;
    rawUpdates.is_client_visible = true;
  }

  if (status === "pending" || status === "rejected") {
    updates.completed_at = null;
    rawUpdates.field_completed_at = null;
    rawUpdates.field_completed_by = null;
    rawUpdates.validated_at = null;
    rawUpdates.validated_by = null;
    if (status === "pending") {
      rawUpdates.is_client_visible = false;
    }
  }

  const { data, error } = await supabase
    .from("milestones")
    .update(rawUpdates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("Error updating milestone:", error.message);
    throw new Error("No se pudo actualizar el hito.");
  }

  if (current.phase_id && ["validated", "published", "closed", "rejected", "pending"].includes(status)) {
    await recomputePhaseActualProgressDb(current.project_id, current.phase_id);
  }

  await logCurrentUserAuditEvent({
    entityType: "milestone",
    entityId: id,
    projectId: current.project_id,
    action: "status_change",
    fromState: current.status,
    toState: status,
    metadata: {
      phaseId: current.phase_id,
      dueDate: current.due_date,
    },
  });

  return mapMilestone(data as MilestoneRow);
}

export type CreateProjectPhaseInput = {
  projectId: number;
  name: string;
  phaseOrder: number;
  plannedProgress?: number;
  actualProgress?: number;
  startDate?: string | null;
  endDate?: string | null;
};

export type CreateWorkPackageInput = {
  projectId: number;
  phaseId: string;
  name: string;
  budgetCategory?: BudgetCategory;
  unit?: string;
  plannedQty: number;
  weight?: number;
  plannedUnitCost?: number;
  plannedHoursPerUnit?: number;
};

export async function createProjectPhaseDb(
  input: CreateProjectPhaseInput
): Promise<ProjectPhase> {
  const { data, error } = await supabase
    .from("project_phases")
    .insert({
      project_id: input.projectId,
      name: input.name,
      phase_order: input.phaseOrder,
      planned_progress: input.plannedProgress ?? 0,
      actual_progress: input.actualProgress ?? 0,
      start_date: input.startDate ?? null,
      end_date: input.endDate ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error creating phase:", error?.message);
    throw new Error("No se pudo crear la fase.");
  }

  return mapPhase(data as ProjectPhaseRow);
}

export async function createWorkPackageDb(
  input: CreateWorkPackageInput
): Promise<WorkPackage> {
  const { data, error } = await supabase
    .from("work_packages")
    .insert({
      project_id: input.projectId,
      phase_id: input.phaseId,
      name: input.name,
      budget_category: input.budgetCategory ?? "labor",
      unit: input.unit ?? "u",
      planned_qty: input.plannedQty,
      weight: input.weight ?? 0,
      planned_unit_cost: input.plannedUnitCost ?? 0,
      planned_hours_per_unit: input.plannedHoursPerUnit ?? 0,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error creating work package:", error?.message);
    throw new Error("No se pudo crear la partida.");
  }

  return mapWorkPackage(data as WorkPackageRow);
}

export async function getWorkPackagePhasePerformanceByProjectDb(
  projectId: number
): Promise<WorkPackagePhasePerformance[]> {
  const [
    phases,
    workPackages,
    { data: laborData, error: laborError },
    { data: purchaseOrderData, error: purchaseOrderError },
  ] = await Promise.all([
    getProjectPhasesDb(projectId),
    getWorkPackagesByProjectDb(projectId),
    supabase.from("labor_entries").select("*").eq("project_id", projectId),
    supabase.from("purchase_orders").select("*").eq("project_id", projectId),
  ]);

  if (laborError) {
    console.error("Supabase labor_entries error:", laborError.message);
  }

  if (purchaseOrderError) {
    console.error("Supabase purchase_orders error:", purchaseOrderError.message);
  }

  const laborEntries = (laborData ?? []) as LaborEntryRow[];
  const purchaseOrders = (purchaseOrderData ?? []) as PurchaseOrderRow[];
  const measuredPhases = phases.filter((phase) =>
    workPackages.some((workPackage) => workPackage.phaseId === phase.id)
  );

  return measuredPhases.map((phase) => {
    const phasePackages = workPackages.filter((workPackage) => workPackage.phaseId === phase.id);
    const phaseLaborEntries = laborEntries.filter((entry) => entry.phase_id === phase.id);
    const phasePurchaseOrders = purchaseOrders.filter(
      (order) => order.phase_id === phase.id && ["received", "paid"].includes(order.status)
    );
    const packagePerformances: WorkPackagePerformance[] = phasePackages.map((workPackage) => {
      const packageLaborEntries = phaseLaborEntries.filter(
        (entry) => entry.work_package_id === workPackage.id
      );
      const packagePurchaseOrders = phasePurchaseOrders.filter(
        (order) => order.work_package_id === workPackage.id
      );
      const plannedValue = round2(workPackage.plannedQty * workPackage.plannedUnitCost);
      const earnedValue = round2(workPackage.executedQty * workPackage.plannedUnitCost);
      const plannedHours = round2(workPackage.plannedQty * workPackage.plannedHoursPerUnit);
      const earnedHours = round2(workPackage.executedQty * workPackage.plannedHoursPerUnit);
      const actualLaborCost = round2(
        sumNumbers(packageLaborEntries.map((entry) => Number(entry.amount_paid ?? 0)))
      );
      const actualProcurementCost = round2(
        sumNumbers(packagePurchaseOrders.map((order) => Number(order.total_amount ?? 0)))
      );
      const actualCost = round2(actualLaborCost + actualProcurementCost);
      const actualHours = round2(
        sumNumbers(packageLaborEntries.map((entry) => Number(entry.hours_worked ?? 0)))
      );
      const costVariance = round2(actualCost - earnedValue);
      const costPerformanceIndex = actualCost > 0 ? round2(earnedValue / actualCost) : null;
      const productivityIndex = actualHours > 0 ? round2(earnedHours / actualHours) : null;

      return {
        workPackageId: workPackage.id,
        name: workPackage.name,
        budgetCategory: workPackage.budgetCategory,
        unit: workPackage.unit,
        plannedQty: workPackage.plannedQty,
        executedQty: workPackage.executedQty,
        completionRate:
          workPackage.plannedQty > 0
            ? round2(clampProgress((workPackage.executedQty / workPackage.plannedQty) * 100))
            : 0,
        plannedValue,
        earnedValue,
        actualCost,
        costVariance,
        costPerformanceIndex,
        plannedHours,
        earnedHours,
        actualHours,
        productivityIndex,
        actualLaborCost,
        actualProcurementCost,
      };
    });
    const unassignedLaborEntries = phaseLaborEntries.filter((entry) => entry.work_package_id === null);
    const unassignedPurchaseOrders = phasePurchaseOrders.filter(
      (order) => order.work_package_id === null
    );
    const unassignedActualHours = round2(
      sumNumbers(unassignedLaborEntries.map((entry) => Number(entry.hours_worked ?? 0)))
    );
    const unassignedActualLaborCost = round2(
      sumNumbers(unassignedLaborEntries.map((entry) => Number(entry.amount_paid ?? 0)))
    );
    const unassignedActualProcurementCost = round2(
      sumNumbers(unassignedPurchaseOrders.map((order) => Number(order.total_amount ?? 0)))
    );
    const unassignedActualCost = round2(
      unassignedActualLaborCost + unassignedActualProcurementCost
    );

    const plannedValue = round2(
      sumNumbers(packagePerformances.map((workPackage) => workPackage.plannedValue))
    );
    const earnedValue = round2(
      sumNumbers(packagePerformances.map((workPackage) => workPackage.earnedValue))
    );
    const plannedHours = round2(
      sumNumbers(packagePerformances.map((workPackage) => workPackage.plannedHours))
    );
    const earnedHours = round2(
      sumNumbers(packagePerformances.map((workPackage) => workPackage.earnedHours))
    );
    const actualLaborCost = round2(
      sumNumbers(packagePerformances.map((workPackage) => workPackage.actualLaborCost)) +
        unassignedActualLaborCost
    );
    const actualProcurementCost = round2(
      sumNumbers(packagePerformances.map((workPackage) => workPackage.actualProcurementCost)) +
        unassignedActualProcurementCost
    );
    const actualCost = round2(actualLaborCost + actualProcurementCost);
    const actualHours = round2(
      sumNumbers(packagePerformances.map((workPackage) => workPackage.actualHours)) +
        unassignedActualHours
    );
    const costVariance = round2(actualCost - earnedValue);
    const costPerformanceIndex = actualCost > 0 ? round2(earnedValue / actualCost) : null;
    const productivityIndex = actualHours > 0 ? round2(earnedHours / actualHours) : null;

    return {
      phaseId: phase.id,
      phaseName: phase.name,
      workPackageCount: phasePackages.length,
      plannedValue,
      earnedValue,
      actualCost,
      costVariance,
      costPerformanceIndex,
      plannedHours,
      earnedHours,
      actualHours,
      productivityIndex,
      actualLaborCost,
      actualProcurementCost,
      unassignedActualCost,
      unassignedActualHours,
      packages: packagePerformances,
    };
  });
}

export type CreateMilestoneInput = {
  projectId: number;
  phaseId?: string | null;
  name: string;
  dueDate: string;
  status?: Milestone["status"];
};

export async function createMilestoneDb(input: CreateMilestoneInput): Promise<Milestone> {
  const { data, error } = await supabase
    .from("milestones")
    .insert({
      project_id: input.projectId,
      phase_id: input.phaseId ?? null,
      name: input.name,
      due_date: input.dueDate,
      status: input.status ?? "pending",
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error creating milestone:", error?.message);
    throw new Error("No se pudo crear el hito.");
  }

  return mapMilestone(data as MilestoneRow);
}
