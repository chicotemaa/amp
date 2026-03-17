"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellRing, CalendarClock, CheckCheck, CircleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAgendaNotificationsDb, markAgendaNotificationsReadDb } from "@/lib/api/agenda-notifications";
import type { AppRole } from "@/lib/auth/roles";
import type {
  AgendaNotification,
  AgendaNotificationsDataset,
} from "@/lib/types/agenda-notifications";
import { AGENDA_EVENT_TYPE_LABELS } from "@/lib/types/operations-agenda";

const ACTIVE_ROLES = new Set<AppRole>(["operator", "pm", "inspector"]);

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getNotificationBadgeVariant(notification: AgendaNotification) {
  if (notification.severity === "critical") return "destructive" as const;
  if (notification.severity === "warning") return "secondary" as const;
  return "outline" as const;
}

function getNotificationIcon(notification: AgendaNotification) {
  if (notification.severity === "critical") {
    return CircleAlert;
  }

  if (
    notification.category === "reminder_due" ||
    notification.category === "reminder_upcoming"
  ) {
    return BellRing;
  }

  return CalendarClock;
}

export function AgendaNotificationsMenu({
  userId,
  role,
  employeeId,
}: {
  userId: string | null;
  role: AppRole | null;
  employeeId: number | null;
}) {
  const router = useRouter();
  const [dataset, setDataset] = useState<AgendaNotificationsDataset>({
    notifications: [],
    unreadCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const shownToastIdsRef = useRef<Set<string>>(new Set());

  const loadNotifications = useCallback(async () => {
    if (!userId || !role || !ACTIVE_ROLES.has(role)) {
      setDataset({ notifications: [], unreadCount: 0 });
      return;
    }

    setIsLoading(true);
    try {
      const nextDataset = await getAgendaNotificationsDb({
        userId,
        role,
        employeeId,
      });
      setDataset(nextDataset);
    } catch (error: any) {
      console.error("Agenda notifications error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, role, userId]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!userId || !role || !ACTIVE_ROLES.has(role)) {
      return;
    }

    const reload = () => {
      void loadNotifications();
    };

    const events = [
      "projectAgendaUpdated",
      "projectPlanningUpdated",
      "projectProgressUpdated",
      "projectProcurementUpdated",
      "projectRevenueUpdated",
      "projectContractsUpdated",
      "projectLaborUpdated",
      "agendaNotificationsUpdated",
    ];

    const intervalId = window.setInterval(reload, 60_000);
    events.forEach((eventName) => window.addEventListener(eventName, reload));

    return () => {
      window.clearInterval(intervalId);
      events.forEach((eventName) => window.removeEventListener(eventName, reload));
    };
  }, [loadNotifications, role, userId]);

  useEffect(() => {
    const toastCandidates = dataset.notifications
      .filter(
        (notification) =>
          !notification.readAt &&
          (notification.category === "reminder_due" || notification.category === "overdue")
      )
      .slice(0, 3);

    toastCandidates.forEach((notification) => {
      if (shownToastIdsRef.current.has(notification.id)) {
        return;
      }

      shownToastIdsRef.current.add(notification.id);
      const description = `${notification.description} · ${formatDateTime(notification.dueAt)}`;

      if (notification.severity === "critical") {
        toast.error(notification.title, { description });
      } else {
        toast(notification.title, { description });
      }
    });
  }, [dataset.notifications]);

  const unreadNotifications = useMemo(
    () => dataset.notifications.filter((notification) => !notification.readAt),
    [dataset.notifications]
  );

  const handleOpenNotification = async (notification: AgendaNotification) => {
    if (userId && !notification.readAt) {
      try {
        await markAgendaNotificationsReadDb({
          userId,
          notificationKeys: [notification.id],
        });
      } catch (error: any) {
        toast.error(error?.message ?? "No se pudo actualizar la notificación.");
      }
    }

    router.push("/calendar");
    router.refresh();
  };

  const handleMarkAllAsRead = async () => {
    if (!userId || unreadNotifications.length === 0) {
      return;
    }

    try {
      await markAgendaNotificationsReadDb({
        userId,
        notificationKeys: unreadNotifications.map((notification) => notification.id),
      });
      toast.success("Alertas marcadas como leídas.");
      void loadNotifications();
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudieron actualizar las alertas.");
    }
  };

  if (!role || !ACTIVE_ROLES.has(role) || !userId) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          {dataset.unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {dataset.unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {dataset.unreadCount > 9 ? "9+" : dataset.unreadCount}
            </span>
          ) : null}
          <span className="sr-only">Abrir alertas operativas</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px]">
        <DropdownMenuLabel className="flex items-center justify-between gap-3">
          <span>Alertas operativas</span>
          {dataset.unreadCount > 0 ? (
            <Badge variant="secondary">{dataset.unreadCount} sin leer</Badge>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {unreadNotifications.length > 0 ? (
          <DropdownMenuItem onSelect={() => void handleMarkAllAsRead()} className="gap-2">
            <CheckCheck className="h-4 w-4 text-muted-foreground" />
            Marcar todas como leídas
          </DropdownMenuItem>
        ) : null}

        {isLoading ? (
          <DropdownMenuItem disabled>Cargando alertas...</DropdownMenuItem>
        ) : dataset.notifications.length === 0 ? (
          <DropdownMenuItem disabled>No hay alertas operativas activas.</DropdownMenuItem>
        ) : (
          dataset.notifications.slice(0, 8).map((notification) => {
            const Icon = getNotificationIcon(notification);
            return (
              <DropdownMenuItem
                key={notification.id}
                onSelect={() => void handleOpenNotification(notification)}
                className="items-start gap-3 py-3"
              >
                <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium leading-tight">
                      {notification.title}
                    </p>
                    {!notification.readAt ? (
                      <Badge variant={getNotificationBadgeVariant(notification)}>
                        Nueva
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {notification.description}
                    {notification.assigneeName
                      ? ` · Responsable: ${notification.assigneeName}`
                      : ""}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{AGENDA_EVENT_TYPE_LABELS[notification.eventType]}</span>
                    <span>·</span>
                    <span>{formatDateTime(notification.dueAt)}</span>
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/calendar")}>
          Ver agenda operativa completa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
