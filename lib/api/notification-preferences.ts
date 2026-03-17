import { getSupabaseAuthBrowserClient } from "@/lib/supabase/auth-browser";
import type { Database } from "@/lib/types/supabase";
import type { AgendaNotificationPreferences } from "@/lib/types/notification-preferences";

type ProfileRow = Pick<Database["public"]["Tables"]["profiles"]["Row"], "employee_id">;
type EmployeeRow = Pick<Database["public"]["Tables"]["employees"]["Row"], "email">;
type PreferenceRow = Database["public"]["Tables"]["user_notification_preferences"]["Row"];

const DEFAULT_PREFERENCES = {
  emailEnabled: false,
  emailForReminderDue: true,
  emailForReminderUpcoming: true,
  emailForDueToday: false,
  emailForOverdue: true,
};

function mapPreferences(
  userId: string,
  row: PreferenceRow | null,
  employeeEmail: string | null
): AgendaNotificationPreferences {
  return {
    userId,
    employeeEmail,
    emailEnabled: row?.email_enabled ?? DEFAULT_PREFERENCES.emailEnabled,
    emailForReminderDue:
      row?.email_for_reminder_due ?? DEFAULT_PREFERENCES.emailForReminderDue,
    emailForReminderUpcoming:
      row?.email_for_reminder_upcoming ?? DEFAULT_PREFERENCES.emailForReminderUpcoming,
    emailForDueToday: row?.email_for_due_today ?? DEFAULT_PREFERENCES.emailForDueToday,
    emailForOverdue: row?.email_for_overdue ?? DEFAULT_PREFERENCES.emailForOverdue,
  };
}

async function getCurrentUserContext() {
  const supabase = getSupabaseAuthBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sesión no activa. Inicia sesión nuevamente.");
  }

  return { supabase, user };
}

export async function getAgendaNotificationPreferencesDb(): Promise<AgendaNotificationPreferences> {
  const { supabase, user } = await getCurrentUserContext();

  const [{ data: profileData, error: profileError }, { data: preferenceData, error: preferenceError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("employee_id")
        .eq("id", user.id)
        .single(),
      supabase
        .from("user_notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  if (profileError) {
    throw new Error(profileError.message || "No se pudo cargar el perfil.");
  }

  if (preferenceError) {
    throw new Error(preferenceError.message || "No se pudieron cargar las preferencias.");
  }

  let employeeEmail: string | null = null;
  const profile = profileData as ProfileRow | null;
  if (profile?.employee_id) {
    const { data: employeeData, error: employeeError } = await supabase
      .from("employees")
      .select("email")
      .eq("id", profile.employee_id)
      .single();

    if (employeeError) {
      throw new Error(employeeError.message || "No se pudo cargar el email del empleado.");
    }

    employeeEmail = (employeeData as EmployeeRow | null)?.email ?? null;
  }

  return mapPreferences(user.id, (preferenceData as PreferenceRow | null) ?? null, employeeEmail);
}

export async function updateAgendaNotificationPreferencesDb(
  input: Partial<Omit<AgendaNotificationPreferences, "userId" | "employeeEmail">>
): Promise<AgendaNotificationPreferences> {
  const { supabase, user } = await getCurrentUserContext();
  const current = await getAgendaNotificationPreferencesDb();

  const payload: Database["public"]["Tables"]["user_notification_preferences"]["Insert"] = {
    user_id: user.id,
    email_enabled: input.emailEnabled ?? current.emailEnabled,
    email_for_reminder_due: input.emailForReminderDue ?? current.emailForReminderDue,
    email_for_reminder_upcoming:
      input.emailForReminderUpcoming ?? current.emailForReminderUpcoming,
    email_for_due_today: input.emailForDueToday ?? current.emailForDueToday,
    email_for_overdue: input.emailForOverdue ?? current.emailForOverdue,
  };

  const { data, error } = await supabase
    .from("user_notification_preferences")
    .upsert(payload, {
      onConflict: "user_id",
      ignoreDuplicates: false,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "No se pudieron guardar las preferencias.");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("notificationPreferencesUpdated"));
  }

  return mapPreferences(user.id, data as PreferenceRow, current.employeeEmail);
}
