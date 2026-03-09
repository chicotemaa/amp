export type ChangeOrderStatus =
  | "draft"
  | "pending_operator"
  | "pending_client"
  | "approved"
  | "rejected";

export interface ChangeOrder {
  id: string;
  projectId: number;
  reason: string;
  amountDelta: number;
  daysDelta: number;
  status: ChangeOrderStatus;
  requestedBy: number | null;
  approvedBy: number | null;
  approvedAt: string | null;
  operatorReviewedAt: string | null;
  clientComment: string | null;
  clientReviewedAt: string | null;
  createdAt: string;
}

export const CHANGE_ORDER_STATUS_LABELS: Record<ChangeOrderStatus, string> = {
  draft: "Borrador",
  pending_operator: "Pendiente Operador",
  pending_client: "Pendiente Cliente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

