import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/types/supabase";
import { logCurrentUserAuditEvent } from "@/lib/api/audit";
import type {
  LaborEntry,
  LaborPaymentBatch,
  LaborPaymentStatus,
  LaborSummary,
} from "@/lib/types/labor";

type LaborEntryRow = Database["public"]["Tables"]["labor_entries"]["Row"];
type LaborPaymentBatchRow =
  Database["public"]["Tables"]["labor_payment_batches"]["Row"];

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function mapLaborEntry(row: LaborEntryRow): LaborEntry {
  return {
    id: row.id,
    projectId: row.project_id,
    phaseId: row.phase_id,
    workPackageId: row.work_package_id,
    paymentBatchId: row.payment_batch_id,
    employeeId: row.employee_id,
    workDate: row.work_date,
    hoursWorked: Number(row.hours_worked),
    hourlyRate: Number(row.hourly_rate),
    amountPaid: Number(row.amount_paid),
    paymentStatus: row.payment_status as LaborEntry["paymentStatus"],
    notes: row.notes,
    createdBy: row.created_by,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    paidBy: row.paid_by,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  };
}

function mapLaborPaymentBatch(row: LaborPaymentBatchRow): LaborPaymentBatch {
  return {
    id: row.id,
    projectId: row.project_id,
    batchNumber: row.batch_number,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    totalAmount: Number(row.total_amount),
    status: row.status as LaborPaymentBatch["status"],
    notes: row.notes,
    createdBy: row.created_by,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    paidBy: row.paid_by,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  };
}

async function loadLaborOverview(projectId: number) {
  const [{ data: entriesData, error: entriesError }, { data: batchesData, error: batchesError }] =
    await Promise.all([
      supabase
        .from("labor_entries")
        .select("*")
        .eq("project_id", projectId)
        .order("work_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("labor_payment_batches")
        .select("*")
        .eq("project_id", projectId)
        .order("period_end", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

  if (entriesError || batchesError) {
    console.error(
      "Supabase labor error:",
      entriesError?.message ?? batchesError?.message
    );
    return {
      entries: [] as LaborEntry[],
      batches: [] as LaborPaymentBatch[],
    };
  }

  return {
    entries: ((entriesData ?? []) as LaborEntryRow[]).map(mapLaborEntry),
    batches: ((batchesData ?? []) as LaborPaymentBatchRow[]).map(mapLaborPaymentBatch),
  };
}

function buildLaborSummary(
  entries: LaborEntry[],
  batches: LaborPaymentBatch[]
): LaborSummary {
  return {
    totalEntries: entries.length,
    totalHours: round2(entries.reduce((sum, entry) => sum + entry.hoursWorked, 0)),
    totalAmount: round2(entries.reduce((sum, entry) => sum + entry.amountPaid, 0)),
    pendingAmount: round2(
      entries
        .filter((entry) => entry.paymentStatus === "pending")
        .reduce((sum, entry) => sum + entry.amountPaid, 0)
    ),
    approvedAmount: round2(
      entries
        .filter((entry) => entry.paymentStatus === "approved")
        .reduce((sum, entry) => sum + entry.amountPaid, 0)
    ),
    paidAmount: round2(
      entries
        .filter((entry) => entry.paymentStatus === "paid")
        .reduce((sum, entry) => sum + entry.amountPaid, 0)
    ),
    batchCount: batches.length,
    paidBatchCount: batches.filter((batch) => batch.status === "paid").length,
  };
}

export async function getLaborOverviewByProjectDb(projectId: number): Promise<{
  entries: LaborEntry[];
  batches: LaborPaymentBatch[];
  summary: LaborSummary;
}> {
  const { entries, batches } = await loadLaborOverview(projectId);
  return {
    entries,
    batches,
    summary: buildLaborSummary(entries, batches),
  };
}

export async function getLaborEntriesByProjectDb(projectId: number): Promise<LaborEntry[]> {
  const { entries } = await loadLaborOverview(projectId);
  return entries;
}

export async function getLaborPaymentBatchesByProjectDb(
  projectId: number
): Promise<LaborPaymentBatch[]> {
  const { batches } = await loadLaborOverview(projectId);
  return batches;
}

export async function getLaborSummaryByProjectDb(projectId: number): Promise<LaborSummary> {
  const overview = await getLaborOverviewByProjectDb(projectId);
  return overview.summary;
}

export type CreateLaborEntryInput = Omit<
  LaborEntry,
  | "id"
  | "createdAt"
  | "amountPaid"
  | "paymentBatchId"
  | "approvedBy"
  | "approvedAt"
  | "paidBy"
  | "paidAt"
> & {
  amountPaid?: number;
};

export async function createLaborEntryDb(input: CreateLaborEntryInput): Promise<LaborEntry> {
  if (input.paymentStatus === "paid") {
    throw new Error("El pago real se registra desde un lote de liquidación.");
  }

  const amountPaid =
    typeof input.amountPaid === "number" && input.amountPaid >= 0
      ? input.amountPaid
      : Number(input.hoursWorked) * Number(input.hourlyRate);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("labor_entries")
    .insert({
      project_id: input.projectId,
      phase_id: input.phaseId,
      work_package_id: input.workPackageId,
      employee_id: input.employeeId,
      work_date: input.workDate,
      hours_worked: input.hoursWorked,
      hourly_rate: input.hourlyRate,
      amount_paid: amountPaid,
      payment_status: input.paymentStatus,
      notes: input.notes,
      created_by: input.createdBy,
      approved_by: input.paymentStatus === "approved" ? input.createdBy : null,
      approved_at: input.paymentStatus === "approved" ? now : null,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error creating labor entry:", error?.message);
    throw new Error("No se pudo registrar la mano de obra.");
  }

  const row = data as LaborEntryRow;

  await logCurrentUserAuditEvent({
    entityType: "labor_entry",
    entityId: row.id,
    projectId: row.project_id,
    action: "create",
    fromState: null,
    toState: row.payment_status,
    metadata: {
      employeeId: row.employee_id,
      phaseId: row.phase_id,
      workPackageId: row.work_package_id,
      hoursWorked: row.hours_worked,
      hourlyRate: row.hourly_rate,
      amountPaid: row.amount_paid,
    },
  });

  return mapLaborEntry(row);
}

export async function updateLaborEntryPaymentStatusDb(
  id: string,
  status: LaborPaymentStatus,
  actorEmployeeId: number | null
): Promise<LaborEntry> {
  const { data: currentData, error: currentError } = await supabase
    .from("labor_entries")
    .select("*")
    .eq("id", id)
    .single();

  if (currentError || !currentData) {
    console.error("Error loading labor entry:", currentError?.message);
    throw new Error("No se encontró el parte de mano de obra.");
  }

  const current = currentData as LaborEntryRow;

  if (status === "paid") {
    throw new Error("El pago real se registra desde el lote de liquidación.");
  }

  const now = new Date().toISOString();
  const updates: Database["public"]["Tables"]["labor_entries"]["Update"] =
    status === "pending"
      ? {
          payment_status: "pending",
          payment_batch_id: null,
          approved_by: null,
          approved_at: null,
          paid_by: null,
          paid_at: null,
        }
      : {
          payment_status: "approved",
          payment_batch_id: null,
          approved_by: actorEmployeeId ?? current.approved_by,
          approved_at: current.approved_at ?? now,
          paid_by: null,
          paid_at: null,
        };

  const { data, error } = await supabase
    .from("labor_entries")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error updating labor entry:", error?.message);
    throw new Error("No se pudo actualizar el estado de la mano de obra.");
  }

  const updated = data as LaborEntryRow;

  await logCurrentUserAuditEvent({
    entityType: "labor_entry",
    entityId: updated.id,
    projectId: updated.project_id,
    action: "status_change",
    fromState: current.payment_status,
    toState: updated.payment_status,
    metadata: {
      employeeId: updated.employee_id,
      previousBatchId: current.payment_batch_id,
      currentBatchId: updated.payment_batch_id,
      amountPaid: updated.amount_paid,
    },
  });

  return mapLaborEntry(updated);
}

export type CreateLaborPaymentBatchInput = {
  projectId: number;
  batchNumber: string;
  periodStart: string;
  periodEnd: string;
  entryIds: string[];
  notes?: string | null;
  createdBy?: number | null;
};

export async function createLaborPaymentBatchDb(
  input: CreateLaborPaymentBatchInput
): Promise<LaborPaymentBatch> {
  const uniqueEntryIds = Array.from(new Set(input.entryIds));
  if (uniqueEntryIds.length === 0) {
    throw new Error("Seleccioná al menos una entrada aprobada para armar el lote.");
  }

  const { data: selectedEntriesData, error: selectedEntriesError } = await supabase
    .from("labor_entries")
    .select("*")
    .eq("project_id", input.projectId)
    .in("id", uniqueEntryIds);

  if (selectedEntriesError) {
    console.error("Error loading labor entries for batch:", selectedEntriesError.message);
    throw new Error("No se pudieron cargar las entradas seleccionadas.");
  }

  const selectedEntries = (selectedEntriesData ?? []) as LaborEntryRow[];
  if (selectedEntries.length !== uniqueEntryIds.length) {
    throw new Error("Algunas entradas seleccionadas ya no están disponibles.");
  }

  const invalidEntry = selectedEntries.find(
    (entry) => entry.payment_status !== "approved" || entry.payment_batch_id !== null
  );
  if (invalidEntry) {
    throw new Error(
      "El lote solo puede incluir entradas aprobadas y todavía no liquidadas."
    );
  }

  const { data: batchData, error: batchError } = await supabase
    .from("labor_payment_batches")
    .insert({
      project_id: input.projectId,
      batch_number: input.batchNumber,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      status: "draft",
      notes: input.notes ?? null,
      created_by: input.createdBy ?? null,
    })
    .select("*")
    .single();

  if (batchError || !batchData) {
    console.error("Error creating labor payment batch:", batchError?.message);
    throw new Error("No se pudo crear el lote de liquidación.");
  }

  const batch = batchData as LaborPaymentBatchRow;

  const { data: updatedEntriesData, error: attachError } = await supabase
    .from("labor_entries")
    .update({
      payment_batch_id: batch.id,
    })
    .eq("project_id", input.projectId)
    .in("id", uniqueEntryIds)
    .select("id");

  if (attachError || (updatedEntriesData ?? []).length !== uniqueEntryIds.length) {
    console.error("Error attaching labor entries to batch:", attachError?.message);
    await supabase.from("labor_payment_batches").delete().eq("id", batch.id);
    throw new Error("No se pudieron asociar las entradas al lote.");
  }

  const { data: refreshedBatchData, error: refreshedBatchError } = await supabase
    .from("labor_payment_batches")
    .select("*")
    .eq("id", batch.id)
    .single();

  if (refreshedBatchError || !refreshedBatchData) {
    console.error(
      "Error loading created labor payment batch:",
      refreshedBatchError?.message
    );
    throw new Error("El lote se creó, pero no se pudo recuperar su estado final.");
  }

  const totalAmount = round2(
    selectedEntries.reduce((sum, entry) => sum + Number(entry.amount_paid ?? 0), 0)
  );

  await logCurrentUserAuditEvent({
    entityType: "labor_payment_batch",
    entityId: batch.id,
    projectId: batch.project_id,
    action: "create",
    fromState: null,
    toState: "approved",
    metadata: {
      batchNumber: batch.batch_number,
      periodStart: batch.period_start,
      periodEnd: batch.period_end,
      entryCount: uniqueEntryIds.length,
      totalAmount,
    },
  });

  return mapLaborPaymentBatch(refreshedBatchData as LaborPaymentBatchRow);
}

export async function markLaborPaymentBatchPaidDb(
  batchId: string,
  actorEmployeeId: number | null
): Promise<LaborPaymentBatch> {
  const { data: currentData, error: currentError } = await supabase
    .from("labor_payment_batches")
    .select("*")
    .eq("id", batchId)
    .single();

  if (currentError || !currentData) {
    console.error("Error loading labor payment batch:", currentError?.message);
    throw new Error("No se encontró el lote de liquidación.");
  }

  const current = currentData as LaborPaymentBatchRow;
  if (current.status === "paid") {
    return mapLaborPaymentBatch(current);
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("labor_payment_batches")
    .update({
      status: "paid",
      paid_by: actorEmployeeId,
      paid_at: now,
    })
    .eq("id", batchId)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error paying labor payment batch:", error?.message);
    throw new Error("No se pudo registrar el pago del lote.");
  }

  const updated = data as LaborPaymentBatchRow;

  await logCurrentUserAuditEvent({
    entityType: "labor_payment_batch",
    entityId: updated.id,
    projectId: updated.project_id,
    action: "status_change",
    fromState: current.status,
    toState: updated.status,
    metadata: {
      batchNumber: updated.batch_number,
      totalAmount: updated.total_amount,
      paidAt: updated.paid_at,
    },
  });

  return mapLaborPaymentBatch(updated);
}
