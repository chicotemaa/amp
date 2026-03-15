import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/types/supabase";
import { Incident, IncidentSummary } from "@/lib/types/incident";
import { logCurrentUserAuditEvent } from "@/lib/api/audit";

type IncidentRow = Database["public"]["Tables"]["incidents"]["Row"];

function mapIncident(row: IncidentRow): Incident {
  return {
    id: row.id,
    projectId: row.project_id,
    phaseId: row.phase_id,
    title: row.title,
    incidentType: row.incident_type as Incident["incidentType"],
    severity: row.severity as Incident["severity"],
    impactDays: row.impact_days,
    impactCost: row.impact_cost,
    ownerId: row.owner_id,
    status: row.status as Incident["status"],
    openedAt: row.opened_at,
    resolvedAt: row.resolved_at,
    description: row.description,
    createdAt: row.created_at,
  };
}

export async function getIncidentsByProjectDb(projectId: number): Promise<Incident[]> {
  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("project_id", projectId)
    .order("opened_at", { ascending: false });

  if (error) {
    console.error("Supabase incidents error:", error.message);
    return [];
  }

  return ((data ?? []) as IncidentRow[]).map(mapIncident);
}

export async function getIncidentSummaryByProjectDb(
  projectId: number
): Promise<IncidentSummary> {
  const incidents = await getIncidentsByProjectDb(projectId);
  const active = incidents.filter(
    (incident) => incident.status !== "resolved" && incident.status !== "closed"
  );

  return {
    totalOpen: active.length,
    criticalOpen: active.filter((incident) => incident.severity === "critical")
      .length,
    highOpen: active.filter((incident) => incident.severity === "high").length,
    blocked: active.filter((incident) => incident.status === "blocked").length,
  };
}

export type CreateIncidentInput = Omit<Incident, "id" | "createdAt">;

export async function createIncidentDb(input: CreateIncidentInput): Promise<Incident> {
  const { data, error } = await supabase
    .from("incidents")
    .insert({
      project_id: input.projectId,
      phase_id: input.phaseId,
      title: input.title,
      incident_type: input.incidentType,
      severity: input.severity,
      impact_days: input.impactDays,
      impact_cost: input.impactCost,
      owner_id: input.ownerId,
      status: input.status,
      opened_at: input.openedAt,
      resolved_at: input.resolvedAt,
      description: input.description,
    })
    .select("*")
    .single();

  const row = data as IncidentRow | null;

  if (error) {
    console.error("Error creating incident:", error.message);
    throw new Error("No se pudo crear el incidente.");
  }

  if (!row) {
    throw new Error("No se pudo crear el incidente.");
  }

  await logCurrentUserAuditEvent({
    entityType: "incident",
    entityId: row.id,
    projectId: input.projectId,
    action: "create",
    fromState: null,
    toState: input.status,
    metadata: {
      severity: input.severity,
      incidentType: input.incidentType,
      impactDays: input.impactDays,
      impactCost: input.impactCost,
    },
  });

  return mapIncident(row);
}

export async function updateIncidentStatusDb(
  id: string,
  status: Incident["status"]
): Promise<Incident> {
  const { data: currentData, error: currentError } = await supabase
    .from("incidents")
    .select("*")
    .eq("id", id)
    .single();

  if (currentError || !currentData) {
    console.error("Error loading incident:", currentError?.message);
    throw new Error("No se encontró el incidente.");
  }

  const updates: Database["public"]["Tables"]["incidents"]["Update"] = {
    status,
    resolved_at: status === "resolved" || status === "closed" ? new Date().toISOString().slice(0, 10) : null,
  };

  const { data, error } = await supabase
    .from("incidents")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("Error updating incident:", error.message);
    throw new Error("No se pudo actualizar el estado del incidente.");
  }

  const current = currentData as IncidentRow;
  await logCurrentUserAuditEvent({
    entityType: "incident",
    entityId: id,
    projectId: current.project_id,
    action: "status_change",
    fromState: current.status,
    toState: status,
    metadata: {
      severity: current.severity,
      ownerId: current.owner_id,
    },
  });

  return mapIncident(data as IncidentRow);
}
