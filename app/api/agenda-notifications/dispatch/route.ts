import { NextRequest, NextResponse } from "next/server";
import {
  ACTIVE_AGENDA_NOTIFICATION_ROLES,
  buildAgendaNotificationForEvent,
  shouldIncludeAgendaEventForRole,
  sortAgendaNotifications,
} from "@/lib/agenda/notification-rules";
import { sendEmail } from "@/lib/server/email";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";
import type { AgendaNotification } from "@/lib/types/agenda-notifications";
import type { AppRole } from "@/lib/auth/roles";
import type { Database } from "@/lib/types/supabase";
import type { OperationsAgendaEvent } from "@/lib/types/operations-agenda";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "role" | "employee_id" | "full_name" | "is_active"
>;
type EmployeeRow = Pick<
  Database["public"]["Tables"]["employees"]["Row"],
  "id" | "name" | "email"
>;
type ProjectRow = Pick<Database["public"]["Tables"]["projects"]["Row"], "id" | "name">;
type PhaseRow = Pick<
  Database["public"]["Tables"]["project_phases"]["Row"],
  "id" | "project_id" | "name"
>;
type ManualEventRow = Database["public"]["Tables"]["project_agenda_events"]["Row"];
type ProjectMemberRow = Pick<
  Database["public"]["Tables"]["project_members"]["Row"],
  "profile_id" | "project_id"
>;
type EmployeeProjectRow = Pick<
  Database["public"]["Tables"]["employee_projects"]["Row"],
  "employee_id" | "project_id"
>;
type PreferenceRow = Database["public"]["Tables"]["user_notification_preferences"]["Row"];
type DeliveryRow = Pick<
  Database["public"]["Tables"]["agenda_notification_deliveries"]["Row"],
  "user_id" | "notification_key" | "channel" | "status"
>;

const CATEGORY_EMAIL_FLAG: Record<
  AgendaNotification["category"],
  keyof Pick<
    PreferenceRow,
    | "email_for_reminder_due"
    | "email_for_reminder_upcoming"
    | "email_for_due_today"
    | "email_for_overdue"
  >
> = {
  reminder_due: "email_for_reminder_due",
  reminder_upcoming: "email_for_reminder_upcoming",
  due_today: "email_for_due_today",
  overdue: "email_for_overdue",
};

function isAuthorized(request: NextRequest) {
  const secrets = [
    process.env.AGENDA_NOTIFICATION_DISPATCH_SECRET,
    process.env.CRON_SECRET,
  ].filter((value): value is string => Boolean(value));
  const header = request.headers.get("authorization");
  return secrets.length > 0 && secrets.some((secret) => header === `Bearer ${secret}`);
}

function getProfileProjectIds(
  profileId: string,
  employeeId: number | null,
  projectIdsByProfile: Map<string, number[]>,
  projectIdsByEmployee: Map<number, number[]>
) {
  const profileProjects = projectIdsByProfile.get(profileId) ?? [];
  if (profileProjects.length > 0) {
    return profileProjects;
  }

  if (!employeeId) {
    return [];
  }

  return projectIdsByEmployee.get(employeeId) ?? [];
}

function buildEmailSubject(notification: AgendaNotification) {
  return `[AMP] ${notification.title}`;
}

function buildEmailMarkup(notification: AgendaNotification) {
  const calendarUrl = process.env.APP_URL
    ? `${process.env.APP_URL.replace(/\/$/, "")}/calendar`
    : null;
  const details = [
    `Proyecto: ${notification.projectName}`,
    notification.phaseName ? `Fase: ${notification.phaseName}` : null,
    notification.assigneeName ? `Responsable: ${notification.assigneeName}` : null,
    `Fecha: ${new Date(notification.dueAt).toLocaleString("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    })}`,
  ].filter(Boolean);

  const intro = `${notification.title}. ${notification.description}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111827;">
      <h2 style="margin-bottom: 8px;">${notification.title}</h2>
      <p style="margin-top: 0; color: #4b5563;">${notification.description}</p>
      <ul style="padding-left: 18px; color: #111827;">
        ${details.map((item) => `<li>${item}</li>`).join("")}
      </ul>
      ${
        calendarUrl
          ? `<p style="margin-top: 24px;"><a href="${calendarUrl}" style="display: inline-block; padding: 10px 14px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 8px;">Abrir agenda operativa</a></p>`
          : ""
      }
    </div>
  `;

  const text = [intro, ...details, calendarUrl ? `Abrir agenda: ${calendarUrl}` : null]
    .filter(Boolean)
    .join("\n");

  return { html, text };
}

function mapManualEvent(
  row: ManualEventRow,
  projectNameById: Map<number, string>,
  phaseNameById: Map<string, string>,
  employeeNameById: Map<number, string>
): OperationsAgendaEvent {
  return {
    id: row.id,
    sourceId: row.id,
    sourceTable: "project_agenda_events",
    type: "manual",
    status: row.status as OperationsAgendaEvent["status"],
    priority: row.priority as OperationsAgendaEvent["priority"],
    title: row.title,
    description: row.description,
    projectId: row.project_id,
    projectName: projectNameById.get(row.project_id) ?? `Proyecto ${row.project_id}`,
    phaseId: row.phase_id,
    phaseName: row.phase_id ? phaseNameById.get(row.phase_id) ?? null : null,
    start: row.starts_at,
    end: row.ends_at,
    allDay: row.is_all_day,
    editable: true,
    assigneeId: row.assigned_to,
    assigneeName: row.assigned_to ? employeeNameById.get(row.assigned_to) ?? null : null,
    reminderAt: row.reminder_at,
  };
}

function getPrefFlag(row: PreferenceRow | null, category: AgendaNotification["category"]) {
  if (!row) {
    return category !== "due_today";
  }

  return row[CATEGORY_EMAIL_FLAG[category]];
}

async function runDispatch() {
  try {
    const supabase = getSupabaseAdminClient();
    const [
      profilesResponse,
      employeesResponse,
      projectsResponse,
      phasesResponse,
      manualEventsResponse,
      projectMembersResponse,
      employeeProjectsResponse,
      preferencesResponse,
      deliveriesResponse,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, role, employee_id, full_name, is_active")
        .eq("is_active", true),
      supabase.from("employees").select("id, name, email"),
      supabase.from("projects").select("id, name"),
      supabase.from("project_phases").select("id, project_id, name"),
      supabase.from("project_agenda_events").select("*"),
      supabase.from("project_members").select("profile_id, project_id"),
      supabase.from("employee_projects").select("employee_id, project_id"),
      supabase.from("user_notification_preferences").select("*"),
      supabase
        .from("agenda_notification_deliveries")
        .select("user_id, notification_key, channel, status")
        .eq("channel", "email")
        .eq("status", "sent"),
    ]);

    const responses = [
      profilesResponse,
      employeesResponse,
      projectsResponse,
      phasesResponse,
      manualEventsResponse,
      projectMembersResponse,
      employeeProjectsResponse,
      preferencesResponse,
      deliveriesResponse,
    ];

    const firstError = responses.find((response) => response.error)?.error;
    if (firstError) {
      throw new Error(firstError.message);
    }

    const profiles = ((profilesResponse.data ?? []) as ProfileRow[]).filter((profile) =>
      ACTIVE_AGENDA_NOTIFICATION_ROLES.has(profile.role as AppRole)
    );
    const employees = (employeesResponse.data ?? []) as EmployeeRow[];
    const projects = (projectsResponse.data ?? []) as ProjectRow[];
    const phases = (phasesResponse.data ?? []) as PhaseRow[];
    const manualEventRows = (manualEventsResponse.data ?? []) as ManualEventRow[];
    const projectMembers = (projectMembersResponse.data ?? []) as ProjectMemberRow[];
    const employeeProjects = (employeeProjectsResponse.data ?? []) as EmployeeProjectRow[];
    const preferences = (preferencesResponse.data ?? []) as PreferenceRow[];
    const deliveries = (deliveriesResponse.data ?? []) as DeliveryRow[];

    const employeeById = new Map(employees.map((employee) => [employee.id, employee]));
    const projectNameById = new Map(projects.map((project) => [project.id, project.name]));
    const phaseNameById = new Map(phases.map((phase) => [phase.id, phase.name]));
    const projectIdsByProfile = new Map<string, number[]>();
    const projectIdsByEmployee = new Map<number, number[]>();
    const preferenceByUserId = new Map(preferences.map((row) => [row.user_id, row]));
    const sentKeySet = new Set(
      deliveries.map((delivery) => `${delivery.user_id}:${delivery.notification_key}`)
    );

    projectMembers.forEach((row) => {
      const current = projectIdsByProfile.get(row.profile_id) ?? [];
      current.push(row.project_id);
      projectIdsByProfile.set(row.profile_id, current);
    });

    employeeProjects.forEach((row) => {
      const current = projectIdsByEmployee.get(row.employee_id) ?? [];
      current.push(row.project_id);
      projectIdsByEmployee.set(row.employee_id, current);
    });

    const manualEvents = manualEventRows.map((row) =>
      mapManualEvent(
        row,
        projectNameById,
        phaseNameById,
        new Map(employees.map((employee) => [employee.id, employee.name]))
      )
    );

    const now = new Date();
    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const profile of profiles) {
      const role = profile.role as AppRole;
      const employee = profile.employee_id ? employeeById.get(profile.employee_id) : undefined;
      const preference = preferenceByUserId.get(profile.id) ?? null;

      if (!employee?.email || !(preference?.email_enabled ?? false)) {
        skippedCount += 1;
        continue;
      }

      const accessibleProjectIds =
        role === "operator"
          ? null
          : getProfileProjectIds(
              profile.id,
              profile.employee_id,
              projectIdsByProfile,
              projectIdsByEmployee
            );

      const notifications = manualEvents
        .filter((event) =>
          accessibleProjectIds === null ? true : accessibleProjectIds.includes(event.projectId)
        )
        .filter((event) =>
          shouldIncludeAgendaEventForRole(event, role, profile.employee_id)
        )
        .map((event) => buildAgendaNotificationForEvent(event, now))
        .filter((notification): notification is AgendaNotification => notification !== null)
        .filter((notification) => getPrefFlag(preference, notification.category))
        .sort(sortAgendaNotifications);

      for (const notification of notifications) {
        const sentKey = `${profile.id}:${notification.id}`;
        if (sentKeySet.has(sentKey)) {
          continue;
        }

        const subject = buildEmailSubject(notification);
        const { html, text } = buildEmailMarkup(notification);

        try {
          await sendEmail({
            to: employee.email,
            subject,
            html,
            text,
          });

          const { error } = await supabase
            .from("agenda_notification_deliveries")
            .upsert(
              {
                user_id: profile.id,
                notification_key: notification.id,
                channel: "email",
                recipient: employee.email,
                subject,
                status: "sent",
                sent_at: new Date().toISOString(),
                error_message: null,
              },
              { onConflict: "user_id,notification_key,channel", ignoreDuplicates: false }
            );

          if (error) {
            throw new Error(error.message);
          }

          sentKeySet.add(sentKey);
          sentCount += 1;
        } catch (error: any) {
          failedCount += 1;

          await supabase.from("agenda_notification_deliveries").upsert(
            {
              user_id: profile.id,
              notification_key: notification.id,
              channel: "email",
              recipient: employee.email,
              subject,
              status: "failed",
              sent_at: null,
              error_message: error?.message ?? "Unknown email delivery error.",
            },
            { onConflict: "user_id,notification_key,channel", ignoreDuplicates: false }
          );
        }
      }
    }

    return {
      ok: true,
      sentCount,
      failedCount,
      skippedCount,
      processedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      ok: false,
      error: error?.message ?? "Unknown dispatch error.",
    };
  }
}

async function handleDispatch(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDispatch();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export async function GET(request: NextRequest) {
  return handleDispatch(request);
}

export async function POST(request: NextRequest) {
  return handleDispatch(request);
}
