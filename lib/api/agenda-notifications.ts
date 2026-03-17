import {
  ACTIVE_AGENDA_NOTIFICATION_ROLES,
  buildAgendaNotificationForEvent,
  shouldIncludeAgendaEventForRole,
  sortAgendaNotifications,
} from "@/lib/agenda/notification-rules";
import { getCachedQuery } from "@/lib/api/query-cache";
import { getOperationsAgendaDatasetDb } from "@/lib/api/operations-agenda";
import { supabase } from "@/lib/supabase";
import type { AppRole } from "@/lib/auth/roles";
import type {
  AgendaNotification,
  AgendaNotificationsDataset,
} from "@/lib/types/agenda-notifications";
import type { OperationsAgendaEvent } from "@/lib/types/operations-agenda";

type ReadStateRow = {
  notification_key: string;
  read_at: string;
};

export async function getAgendaNotificationsDb(input: {
  userId: string;
  role: AppRole | null;
  employeeId: number | null;
}): Promise<AgendaNotificationsDataset> {
  const { userId, role, employeeId } = input;

  if (!role || !ACTIVE_AGENDA_NOTIFICATION_ROLES.has(role)) {
    return { notifications: [], unreadCount: 0 };
  }

  return getCachedQuery(
    `agenda:notifications:${userId}:${role}:${employeeId ?? "none"}`,
    async () => {
      const [agenda, readStateResponse] = await Promise.all([
        getOperationsAgendaDatasetDb(),
        supabase
          .from("user_notification_reads")
          .select("notification_key, read_at")
          .eq("user_id", userId),
      ]);

      if (readStateResponse.error) {
        throw new Error(readStateResponse.error.message);
      }

      const readState = new Map<string, string>(
        ((readStateResponse.data ?? []) as ReadStateRow[]).map((row) => [
          row.notification_key,
          row.read_at,
        ])
      );

      const now = new Date();
      const notifications = agenda.events
        .filter((event) => shouldIncludeAgendaEventForRole(event, role, employeeId))
        .map((event) => buildAgendaNotificationForEvent(event, now))
        .filter((notification): notification is AgendaNotification => notification !== null)
        .map((notification) => ({
          ...notification,
          readAt: readState.get(notification.id) ?? null,
        }))
        .sort(sortAgendaNotifications);

      return {
        notifications,
        unreadCount: notifications.filter((notification) => !notification.readAt).length,
      };
    },
    30_000
  );
}

export async function markAgendaNotificationsReadDb(input: {
  userId: string;
  notificationKeys: string[];
}) {
  const notificationKeys = Array.from(new Set(input.notificationKeys.filter(Boolean)));
  if (notificationKeys.length === 0) {
    return;
  }

  const { error } = await supabase.from("user_notification_reads").upsert(
    notificationKeys.map((notificationKey) => ({
      user_id: input.userId,
      notification_key: notificationKey,
      read_at: new Date().toISOString(),
    })),
    {
      onConflict: "user_id,notification_key",
      ignoreDuplicates: false,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("agendaNotificationsUpdated"));
  }
}
