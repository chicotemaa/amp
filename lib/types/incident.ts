export type IncidentType =
  | "safety"
  | "quality"
  | "scope"
  | "cost"
  | "schedule"
  | "other";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus =
  | "open"
  | "in-progress"
  | "blocked"
  | "resolved"
  | "closed";

export interface Incident {
  id: string;
  projectId: number;
  phaseId: string | null;
  title: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  impactDays: number;
  impactCost: number;
  ownerId: number | null;
  status: IncidentStatus;
  openedAt: string;
  resolvedAt: string | null;
  description: string | null;
  createdAt: string;
}

export interface IncidentSummary {
  totalOpen: number;
  criticalOpen: number;
  highOpen: number;
  blocked: number;
}

export const INCIDENT_SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Crítica",
};

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  open: "Abierto",
  "in-progress": "En Progreso",
  blocked: "Bloqueado",
  resolved: "Resuelto",
  closed: "Cerrado",
};

