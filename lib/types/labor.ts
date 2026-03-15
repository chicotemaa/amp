export type LaborPaymentStatus = "pending" | "approved" | "paid";
export type LaborPaymentBatchStatus = "draft" | "approved" | "paid";

export const LABOR_PAYMENT_STATUS_LABELS: Record<LaborPaymentStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  paid: "Pagado",
};

export const LABOR_PAYMENT_BATCH_STATUS_LABELS: Record<
  LaborPaymentBatchStatus,
  string
> = {
  draft: "Borrador",
  approved: "Listo para pagar",
  paid: "Pagado",
};

export interface LaborEntry {
  id: string;
  projectId: number;
  phaseId: string | null;
  workPackageId: string | null;
  paymentBatchId: string | null;
  employeeId: number;
  workDate: string;
  hoursWorked: number;
  hourlyRate: number;
  amountPaid: number;
  paymentStatus: LaborPaymentStatus;
  notes: string | null;
  createdBy: number | null;
  approvedBy: number | null;
  approvedAt: string | null;
  paidBy: number | null;
  paidAt: string | null;
  createdAt: string;
}

export interface LaborPaymentBatch {
  id: string;
  projectId: number;
  batchNumber: string;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  status: LaborPaymentBatchStatus;
  notes: string | null;
  createdBy: number | null;
  approvedBy: number | null;
  approvedAt: string | null;
  paidBy: number | null;
  paidAt: string | null;
  createdAt: string;
}

export interface LaborSummary {
  totalEntries: number;
  totalHours: number;
  totalAmount: number;
  pendingAmount: number;
  approvedAmount: number;
  paidAmount: number;
  batchCount: number;
  paidBatchCount: number;
}
