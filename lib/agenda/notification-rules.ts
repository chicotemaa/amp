import type { AppRole } from "@/lib/auth/roles";
import type { AgendaNotification } from "@/lib/types/agenda-notifications";
import type { OperationsAgendaEvent } from "@/lib/types/operations-agenda";

export const ACTIVE_AGENDA_NOTIFICATION_ROLES = new Set<AppRole>([
  "operator",
  "pm",
  "inspector",
]);

function toDayKey(value: string) {
  return value.slice(0, 10);
}

export function isClosedAgendaStatus(status: OperationsAgendaEvent["status"]) {
  return status === "completed" || status === "cancelled";
}

export function getAgendaNotificationSeverity(
  priority: OperationsAgendaEvent["priority"],
  urgent: boolean
): AgendaNotification["severity"] {
  if (priority === "critical" || urgent) return "critical";
  if (priority === "high") return "warning";
  return "info";
}

export function buildAgendaNotificationForEvent(
  event: OperationsAgendaEvent,
  now: Date
): AgendaNotification | null {
  if (isClosedAgendaStatus(event.status)) {
    return null;
  }

  const nowIso = now.toISOString();
  const today = toDayKey(nowIso);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const startDay = toDayKey(event.start);

  if (event.reminderAt) {
    if (event.reminderAt <= nowIso) {
      return {
        id: `reminder-due:${event.sourceTable}:${event.sourceId}:${event.reminderAt}`,
        category: "reminder_due",
        severity: getAgendaNotificationSeverity(event.priority, true),
        title: `Recordatorio vencido · ${event.title}`,
        description: `${event.projectName}${event.phaseName ? ` · ${event.phaseName}` : ""}`,
        projectId: event.projectId,
        projectName: event.projectName,
        phaseName: event.phaseName,
        assigneeName: event.assigneeName,
        eventType: event.type,
        eventPriority: event.priority,
        eventStart: event.start,
        dueAt: event.reminderAt,
        readAt: null,
      };
    }

    if (event.reminderAt <= tomorrow) {
      return {
        id: `reminder-upcoming:${event.sourceTable}:${event.sourceId}:${event.reminderAt}`,
        category: "reminder_upcoming",
        severity: getAgendaNotificationSeverity(event.priority, false),
        title: `Próximo recordatorio · ${event.title}`,
        description: `${event.projectName}${event.phaseName ? ` · ${event.phaseName}` : ""}`,
        projectId: event.projectId,
        projectName: event.projectName,
        phaseName: event.phaseName,
        assigneeName: event.assigneeName,
        eventType: event.type,
        eventPriority: event.priority,
        eventStart: event.start,
        dueAt: event.reminderAt,
        readAt: null,
      };
    }
  }

  if (startDay < today) {
    return {
      id: `overdue:${event.sourceTable}:${event.sourceId}:${startDay}`,
      category: "overdue",
      severity: getAgendaNotificationSeverity(event.priority, true),
      title: `Atrasado · ${event.title}`,
      description: `${event.projectName}${event.phaseName ? ` · ${event.phaseName}` : ""}`,
      projectId: event.projectId,
      projectName: event.projectName,
      phaseName: event.phaseName,
      assigneeName: event.assigneeName,
      eventType: event.type,
      eventPriority: event.priority,
      eventStart: event.start,
      dueAt: event.start,
      readAt: null,
    };
  }

  if (startDay === today && (event.priority === "high" || event.priority === "critical")) {
    return {
      id: `due-today:${event.sourceTable}:${event.sourceId}:${startDay}`,
      category: "due_today",
      severity: getAgendaNotificationSeverity(event.priority, false),
      title: `Vence hoy · ${event.title}`,
      description: `${event.projectName}${event.phaseName ? ` · ${event.phaseName}` : ""}`,
      projectId: event.projectId,
      projectName: event.projectName,
      phaseName: event.phaseName,
      assigneeName: event.assigneeName,
      eventType: event.type,
      eventPriority: event.priority,
      eventStart: event.start,
      dueAt: event.start,
      readAt: null,
    };
  }

  return null;
}

export function shouldIncludeAgendaEventForRole(
  event: OperationsAgendaEvent,
  role: AppRole,
  employeeId: number | null
) {
  if (role === "operator" || role === "pm") {
    return true;
  }

  if (role === "inspector") {
    if (event.type !== "manual") {
      return true;
    }

    return event.assigneeId === null || event.assigneeId === employeeId;
  }

  return false;
}

function severityRank(severity: AgendaNotification["severity"]) {
  if (severity === "critical") return 3;
  if (severity === "warning") return 2;
  return 1;
}

export function sortAgendaNotifications(
  left: AgendaNotification,
  right: AgendaNotification
) {
  if (Boolean(left.readAt) !== Boolean(right.readAt)) {
    return left.readAt ? 1 : -1;
  }

  const severityDelta = severityRank(right.severity) - severityRank(left.severity);
  if (severityDelta !== 0) {
    return severityDelta;
  }

  return new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime();
}
