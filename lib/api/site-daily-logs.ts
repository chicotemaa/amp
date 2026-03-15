import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/types/supabase";
import { logCurrentUserAuditEvent } from "@/lib/api/audit";
import type { SiteDailyLog, SiteDailyLogSummary } from "@/lib/types/site-daily-log";

type SiteDailyLogRow = Database["public"]["Tables"]["site_daily_logs"]["Row"];

function mapSiteDailyLog(row: SiteDailyLogRow): SiteDailyLog {
  return {
    id: row.id,
    projectId: row.project_id,
    phaseId: row.phase_id,
    logDate: row.log_date,
    weatherCondition: row.weather_condition as SiteDailyLog["weatherCondition"],
    weatherImpact: row.weather_impact as SiteDailyLog["weatherImpact"],
    workforceCount: row.workforce_count,
    hoursWorked: Number(row.hours_worked),
    hoursLost: Number(row.hours_lost),
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export async function getSiteDailyLogsByProjectDb(
  projectId: number,
  limit = 30
): Promise<SiteDailyLog[]> {
  const { data, error } = await supabase
    .from("site_daily_logs")
    .select("*")
    .eq("project_id", projectId)
    .order("log_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Supabase site_daily_logs error:", error.message);
    return [];
  }

  return ((data ?? []) as SiteDailyLogRow[]).map(mapSiteDailyLog);
}

export async function getSiteDailyLogSummaryByProjectDb(
  projectId: number
): Promise<SiteDailyLogSummary> {
  const logs = await getSiteDailyLogsByProjectDb(projectId, 90);
  const weatherAffectedDays = logs.filter(
    (log) => log.weatherImpact !== "none" || log.hoursLost > 0
  ).length;
  const totalHoursWorked = logs.reduce((sum, log) => sum + log.hoursWorked, 0);
  const totalHoursLost = logs.reduce((sum, log) => sum + log.hoursLost, 0);

  return {
    totalLogs: logs.length,
    weatherAffectedDays,
    totalHoursWorked: Math.round(totalHoursWorked * 100) / 100,
    totalHoursLost: Math.round(totalHoursLost * 100) / 100,
    equivalentDelayDays: Math.round((totalHoursLost / 8) * 100) / 100,
  };
}

export type CreateSiteDailyLogInput = Omit<SiteDailyLog, "id" | "createdAt">;

export async function createSiteDailyLogDb(
  input: CreateSiteDailyLogInput
): Promise<SiteDailyLog> {
  const { data, error } = await supabase
    .from("site_daily_logs")
    .insert({
      project_id: input.projectId,
      phase_id: input.phaseId,
      log_date: input.logDate,
      weather_condition: input.weatherCondition,
      weather_impact: input.weatherImpact,
      workforce_count: input.workforceCount,
      hours_worked: input.hoursWorked,
      hours_lost: input.hoursLost,
      notes: input.notes,
      created_by: input.createdBy,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error creating site daily log:", error?.message);
    throw new Error("No se pudo registrar el parte diario.");
  }

  const row = data as SiteDailyLogRow;

  await logCurrentUserAuditEvent({
    entityType: "site_daily_log",
    entityId: row.id,
    projectId: row.project_id,
    action: "create",
    fromState: null,
    toState: row.weather_impact,
    metadata: {
      phaseId: row.phase_id,
      workforceCount: row.workforce_count,
      hoursWorked: row.hours_worked,
      hoursLost: row.hours_lost,
      weatherCondition: row.weather_condition,
    },
  });

  return mapSiteDailyLog(row);
}
