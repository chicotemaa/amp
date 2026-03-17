export type AgendaManualCategory =
  | "operation"
  | "deadline"
  | "meeting"
  | "inspection"
  | "delivery"
  | "payment"
  | "client";

export type AgendaEventType =
  | "manual"
  | "project_start"
  | "project_end"
  | "milestone"
  | "weather_delay"
  | "incident"
  | "purchase_expected"
  | "purchase_due"
  | "certificate_issue"
  | "certificate_due"
  | "report"
  | "contract_start"
  | "contract_end"
  | "contract_amendment"
  | "labor_batch";

export type AgendaEventStatus =
  | "scheduled"
  | "pending"
  | "in_progress"
  | "completed"
  | "delayed"
  | "cancelled"
  | "open"
  | "blocked";

export type AgendaEventPriority = "low" | "medium" | "high" | "critical";

export type AgendaSourceTable =
  | "project_agenda_events"
  | "projects"
  | "milestones"
  | "site_daily_logs"
  | "incidents"
  | "purchase_orders"
  | "project_certificates"
  | "reports"
  | "project_contracts"
  | "project_contract_amendments"
  | "labor_payment_batches";

export type OperationsAgendaProject = {
  id: number;
  name: string;
  status: string | null;
};

export type OperationsAgendaAssignee = {
  id: number;
  name: string;
  projectIds: number[];
};

export type OperationsAgendaPhase = {
  id: string;
  projectId: number;
  name: string;
};

export type ProjectAgendaEvent = {
  id: string;
  projectId: number;
  phaseId: string | null;
  title: string;
  description: string | null;
  category: AgendaManualCategory;
  startsAt: string;
  endsAt: string | null;
  isAllDay: boolean;
  status: Extract<
    AgendaEventStatus,
    "scheduled" | "in_progress" | "completed" | "cancelled" | "delayed"
  >;
  priority: AgendaEventPriority;
  assigneeId: number | null;
  assigneeName: string | null;
  reminderAt: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
};

export type OperationsAgendaEvent = {
  id: string;
  sourceId: string;
  sourceTable: AgendaSourceTable;
  type: AgendaEventType;
  status: AgendaEventStatus;
  priority: AgendaEventPriority;
  title: string;
  description: string | null;
  projectId: number;
  projectName: string;
  phaseId: string | null;
  phaseName: string | null;
  start: string;
  end: string | null;
  allDay: boolean;
  editable: boolean;
  assigneeId: number | null;
  assigneeName: string | null;
  reminderAt: string | null;
};

export type OperationsAgendaDataset = {
  projects: OperationsAgendaProject[];
  phases: OperationsAgendaPhase[];
  assignees: OperationsAgendaAssignee[];
  manualEvents: ProjectAgendaEvent[];
  events: OperationsAgendaEvent[];
};

export const AGENDA_MANUAL_CATEGORY_LABELS: Record<AgendaManualCategory, string> = {
  operation: "Operación",
  deadline: "Plazo",
  meeting: "Reunión",
  inspection: "Inspección",
  delivery: "Entrega",
  payment: "Pago",
  client: "Cliente",
};

export const AGENDA_EVENT_TYPE_LABELS: Record<AgendaEventType, string> = {
  manual: "Agenda manual",
  project_start: "Inicio de obra",
  project_end: "Cierre de obra",
  milestone: "Hito",
  weather_delay: "Clima / atraso",
  incident: "Incidencia",
  purchase_expected: "Recepción esperada",
  purchase_due: "Pago de compra",
  certificate_issue: "Certificado emitido",
  certificate_due: "Cobro pendiente",
  report: "Reporte",
  contract_start: "Inicio contractual",
  contract_end: "Fin contractual",
  contract_amendment: "Adenda",
  labor_batch: "Lote de liquidación",
};

export const AGENDA_EVENT_STATUS_LABELS: Record<AgendaEventStatus, string> = {
  scheduled: "Programado",
  pending: "Pendiente",
  in_progress: "En curso",
  completed: "Completado",
  delayed: "Retrasado",
  cancelled: "Cancelado",
  open: "Abierto",
  blocked: "Bloqueado",
};

export const AGENDA_EVENT_PRIORITY_LABELS: Record<AgendaEventPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Crítica",
};
