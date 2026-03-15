export type ProjectCertificateStatus =
  | "draft"
  | "issued"
  | "partially_collected"
  | "collected"
  | "cancelled";

export const PROJECT_CERTIFICATE_STATUS_LABELS: Record<ProjectCertificateStatus, string> = {
  draft: "Borrador",
  issued: "Emitido",
  partially_collected: "Cobro Parcial",
  collected: "Cobrado",
  cancelled: "Cancelado",
};

export interface ProjectCertificate {
  id: string;
  projectId: number;
  phaseId: string | null;
  certificateNumber: string;
  description: string;
  issueDate: string;
  dueDate: string | null;
  amount: number;
  status: ProjectCertificateStatus;
  clientVisible: boolean;
  paidAmount: number;
  remainingAmount: number;
  collectionCount: number;
  notes: string | null;
  createdBy: number | null;
  createdAt: string;
}

export interface ProjectCertificateCollection {
  id: string;
  certificateId: string;
  projectId: number;
  amount: number;
  collectionDate: string;
  reference: string | null;
  notes: string | null;
  createdBy: number | null;
  createdAt: string;
}

export interface RevenueSummary {
  totalCertificates: number;
  certifiedAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  partiallyCollectedCount: number;
}
