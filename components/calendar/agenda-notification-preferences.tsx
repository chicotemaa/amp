"use client";

import { useEffect, useState } from "react";
import { Mail, MailWarning } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  getAgendaNotificationPreferencesDb,
  updateAgendaNotificationPreferencesDb,
} from "@/lib/api/notification-preferences";
import type { AgendaNotificationPreferences } from "@/lib/types/notification-preferences";

type PreferenceKey =
  | "emailEnabled"
  | "emailForReminderDue"
  | "emailForReminderUpcoming"
  | "emailForDueToday"
  | "emailForOverdue";

const PREFERENCE_LABELS: Array<{
  key: PreferenceKey;
  label: string;
  description: string;
}> = [
  {
    key: "emailEnabled",
    label: "Canal email",
    description: "Habilita avisos externos por correo para tu operación.",
  },
  {
    key: "emailForReminderDue",
    label: "Recordatorios vencidos",
    description: "Envia email cuando un recordatorio ya quedó vencido.",
  },
  {
    key: "emailForReminderUpcoming",
    label: "Próximos recordatorios",
    description: "Envia email cuando el recordatorio entra dentro de la próxima ventana.",
  },
  {
    key: "emailForDueToday",
    label: "Vence hoy",
    description: "Envia email para tareas de alta prioridad que vencen hoy.",
  },
  {
    key: "emailForOverdue",
    label: "Atrasos",
    description: "Envia email cuando una tarea o plazo queda atrasado.",
  },
];

const EMPTY_PREFERENCES: AgendaNotificationPreferences = {
  userId: "",
  employeeEmail: null,
  emailEnabled: false,
  emailForReminderDue: true,
  emailForReminderUpcoming: true,
  emailForDueToday: false,
  emailForOverdue: true,
};

export function AgendaNotificationPreferencesCard() {
  const [preferences, setPreferences] =
    useState<AgendaNotificationPreferences>(EMPTY_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<PreferenceKey | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const data = await getAgendaNotificationPreferencesDb();
        if (mounted) {
          setPreferences(data);
        }
      } catch (error: any) {
        toast.error(error?.message ?? "No se pudieron cargar las preferencias.");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleToggle = async (key: PreferenceKey, value: boolean) => {
    const previous = preferences;
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    setSavingKey(key);

    try {
      const updated = await updateAgendaNotificationPreferencesDb({ [key]: value });
      setPreferences(updated);
      toast.success("Preferencia de notificación actualizada.");
    } catch (error: any) {
      setPreferences(previous);
      toast.error(error?.message ?? "No se pudo actualizar la preferencia.");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4" />
          Notificaciones externas
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configurá qué alertas operativas querés recibir por email. Esta primera
          versión toma eventos manuales de agenda y sus recordatorios.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/40 p-3 text-sm">
          {preferences.employeeEmail ? (
            <p className="text-muted-foreground">
              Los emails se enviarán a <span className="font-medium text-foreground">{preferences.employeeEmail}</span>.
            </p>
          ) : (
            <div className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
              <MailWarning className="mt-0.5 h-4 w-4" />
              <p>
                Tu perfil no tiene un empleado con email asociado. Vinculá un empleado
                para activar notificaciones externas.
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-3">
          {PREFERENCE_LABELS.map((item) => {
            const checked = preferences[item.key];
            const disabled =
              isLoading ||
              savingKey === item.key ||
              (!preferences.employeeEmail && item.key === "emailEnabled");

            return (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="space-y-1 pr-4">
                  <Label className="text-sm font-medium">{item.label}</Label>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <Switch
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={(value) => void handleToggle(item.key, value)}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
