import type { AgendaEventPriority, AgendaEventType } from "@/lib/types/operations-agenda";

export type AgendaNotificationCategory =
  | "reminder_due"
  | "reminder_upcoming"
  | "due_today"
  | "overdue";

export type AgendaNotificationSeverity = "info" | "warning" | "critical";

export type AgendaNotification = {
  id: string;
  category: AgendaNotificationCategory;
  severity: AgendaNotificationSeverity;
  title: string;
  description: string;
  projectId: number;
  projectName: string;
  phaseName: string | null;
  assigneeName: string | null;
  eventType: AgendaEventType;
  eventPriority: AgendaEventPriority;
  eventStart: string;
  dueAt: string;
  readAt: string | null;
};

export type AgendaNotificationsDataset = {
  notifications: AgendaNotification[];
  unreadCount: number;
};
