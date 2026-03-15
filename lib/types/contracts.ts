export type ProjectContractStatus =
  | "draft"
  | "active"
  | "suspended"
  | "completed"
  | "terminated";

export type ProjectContractAmendmentType =
  | "change_order"
  | "redetermination"
  | "extension"
  | "scope_adjustment"
  | "other";

export type ProjectContractAmendmentStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "cancelled";

export const PROJECT_CONTRACT_STATUS_LABELS: Record<ProjectContractStatus, string> = {
  draft: "Borrador",
  active: "Activo",
  suspended: "Suspendido",
  completed: "Completado",
  terminated: "Terminado",
};

export const PROJECT_CONTRACT_AMENDMENT_TYPE_LABELS: Record<
  ProjectContractAmendmentType,
  string
> = {
  change_order: "Orden de cambio",
  redetermination: "Redeterminación",
  extension: "Prórroga",
  scope_adjustment: "Ajuste de alcance",
  other: "Otro",
};

export const PROJECT_CONTRACT_AMENDMENT_STATUS_LABELS: Record<
  ProjectContractAmendmentStatus,
  string
> = {
  draft: "Borrador",
  submitted: "En revisión",
  approved: "Aprobada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
};

export interface ProjectContract {
  id: string;
  projectId: number;
  contractNumber: string;
  title: string;
  status: ProjectContractStatus;
  signedDate: string | null;
  startDate: string | null;
  endDate: string | null;
  originalAmount: number;
  clientVisible: boolean;
  notes: string | null;
  createdBy: number | null;
  publishedBy: number | null;
  publishedAt: string | null;
  createdAt: string;
}

export interface ProjectContractAmendment {
  id: string;
  contractId: string;
  projectId: number;
  amendmentNumber: string;
  title: string;
  amendmentType: ProjectContractAmendmentType;
  status: ProjectContractAmendmentStatus;
  effectiveDate: string;
  amountDelta: number;
  daysDelta: number;
  clientVisible: boolean;
  description: string | null;
  createdBy: number | null;
  submittedBy: number | null;
  submittedAt: string | null;
  approvedBy: number | null;
  approvedAt: string | null;
  publishedBy: number | null;
  publishedAt: string | null;
  createdAt: string;
}

export interface ProjectContractSummary {
  configured: boolean;
  contractStatus: ProjectContractStatus | null;
  originalAmount: number;
  currentAmount: number;
  approvedAmountDelta: number;
  approvedDaysDelta: number;
  pendingAmountDelta: number;
  pendingDaysDelta: number;
  pendingAmendmentsCount: number;
  certifiedCoveragePct: number | null;
  collectedCoveragePct: number | null;
  projectedMargin: number | null;
  cashMargin: number | null;
}
