import { getCachedQuery } from "@/lib/api/query-cache";
import { logCurrentUserAuditEvent } from "@/lib/api/audit";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/types/supabase";
import type {
  AgendaEventPriority,
  AgendaEventStatus,
  OperationsAgendaAssignee,
  OperationsAgendaDataset,
  OperationsAgendaEvent,
  OperationsAgendaPhase,
  OperationsAgendaProject,
  ProjectAgendaEvent,
} from "@/lib/types/operations-agenda";

type ProjectRow = Pick<
  Database["public"]["Tables"]["projects"]["Row"],
  "id" | "name" | "status" | "start_date" | "end_date"
>;
type EmployeeRow = Pick<
  Database["public"]["Tables"]["employees"]["Row"],
  "id" | "name"
>;
type EmployeeProjectRow = Database["public"]["Tables"]["employee_projects"]["Row"];
type PhaseRow = Pick<
  Database["public"]["Tables"]["project_phases"]["Row"],
  "id" | "project_id" | "name"
>;
type ManualEventRow = Database["public"]["Tables"]["project_agenda_events"]["Row"];
type MilestoneRow = Pick<
  Database["public"]["Tables"]["milestones"]["Row"],
  "id" | "project_id" | "phase_id" | "name" | "due_date" | "completed_at" | "status"
>;
type SiteDailyLogRow = Pick<
  Database["public"]["Tables"]["site_daily_logs"]["Row"],
  | "id"
  | "project_id"
  | "phase_id"
  | "log_date"
  | "weather_condition"
  | "weather_impact"
  | "hours_lost"
  | "notes"
>;
type IncidentRow = Pick<
  Database["public"]["Tables"]["incidents"]["Row"],
  | "id"
  | "project_id"
  | "phase_id"
  | "title"
  | "severity"
  | "status"
  | "opened_at"
  | "description"
>;
type PurchaseOrderRow = Pick<
  Database["public"]["Tables"]["purchase_orders"]["Row"],
  | "id"
  | "project_id"
  | "phase_id"
  | "category"
  | "description"
  | "expected_date"
  | "due_date"
  | "status"
  | "total_amount"
>;
type CertificateRow = Pick<
  Database["public"]["Tables"]["project_certificates"]["Row"],
  | "id"
  | "project_id"
  | "phase_id"
  | "certificate_number"
  | "description"
  | "issue_date"
  | "due_date"
  | "status"
  | "amount"
>;
type ReportRow = Pick<
  Database["public"]["Tables"]["reports"]["Row"],
  "id" | "project_id" | "title" | "report_date" | "status"
>;
type ContractRow = Pick<
  Database["public"]["Tables"]["project_contracts"]["Row"],
  "id" | "project_id" | "contract_number" | "title" | "status" | "start_date" | "end_date"
>;
type ContractAmendmentRow = Pick<
  Database["public"]["Tables"]["project_contract_amendments"]["Row"],
  "id" | "project_id" | "title" | "amendment_type" | "status" | "effective_date" | "amount_delta"
>;
type LaborBatchRow = Pick<
  Database["public"]["Tables"]["labor_payment_batches"]["Row"],
  "id" | "project_id" | "batch_number" | "period_start" | "period_end" | "total_amount" | "status"
>;

type EventDraft = Omit<OperationsAgendaEvent, "projectName" | "phaseName">;

function emptyAgendaDataset(): OperationsAgendaDataset {
  return {
    projects: [],
    phases: [],
    assignees: [],
    manualEvents: [],
    events: [],
  };
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function isPastDate(value: string | null, today: string) {
  return value !== null && value < today;
}

function sortByStart(left: OperationsAgendaEvent, right: OperationsAgendaEvent) {
  return new Date(left.start).getTime() - new Date(right.start).getTime();
}

function mapManualEvent(
  row: ManualEventRow,
  assigneeMap: Map<number, OperationsAgendaAssignee>
): ProjectAgendaEvent {
  return {
    id: row.id,
    projectId: row.project_id,
    phaseId: row.phase_id,
    title: row.title,
    description: row.description,
    category: row.category as ProjectAgendaEvent["category"],
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isAllDay: row.is_all_day,
    status: row.status as ProjectAgendaEvent["status"],
    priority: row.priority as ProjectAgendaEvent["priority"],
    assigneeId: row.assigned_to,
    assigneeName: row.assigned_to ? assigneeMap.get(row.assigned_to)?.name ?? null : null,
    reminderAt: row.reminder_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildBaseEvent(
  event: EventDraft,
  projectMap: Map<number, OperationsAgendaProject>,
  phaseMap: Map<string, OperationsAgendaPhase>
): OperationsAgendaEvent {
  return {
    ...event,
    projectName: projectMap.get(event.projectId)?.name ?? `Proyecto ${event.projectId}`,
    phaseName: event.phaseId ? phaseMap.get(event.phaseId)?.name ?? null : null,
  };
}

function buildStaticEvent(
  input: Omit<EventDraft, "assigneeId" | "assigneeName" | "reminderAt">
): EventDraft {
  return {
    ...input,
    assigneeId: null,
    assigneeName: null,
    reminderAt: null,
  };
}

export async function getOperationsAgendaDatasetDb(): Promise<OperationsAgendaDataset> {
  return getCachedQuery("agenda:dataset", async () => {
    const [
      { data: projectsData, error: projectsError },
      { data: employeesData, error: employeesError },
      { data: employeeProjectData, error: employeeProjectError },
      { data: phasesData, error: phasesError },
      { data: manualData, error: manualError },
      { data: milestoneData, error: milestoneError },
      { data: siteLogData, error: siteLogError },
      { data: incidentData, error: incidentError },
      { data: purchaseOrderData, error: purchaseOrderError },
      { data: certificateData, error: certificateError },
      { data: reportData, error: reportError },
      { data: contractData, error: contractError },
      { data: contractAmendmentData, error: contractAmendmentError },
      { data: laborBatchData, error: laborBatchError },
    ] = await Promise.all([
      supabase.from("projects").select("id, name, status, start_date, end_date"),
      supabase.from("employees").select("id, name"),
      supabase.from("employee_projects").select("*"),
      supabase.from("project_phases").select("id, project_id, name"),
      supabase.from("project_agenda_events").select("*").order("starts_at", { ascending: true }),
      supabase.from("milestones").select("id, project_id, phase_id, name, due_date, completed_at, status"),
      supabase.from("site_daily_logs").select("id, project_id, phase_id, log_date, weather_condition, weather_impact, hours_lost, notes"),
      supabase.from("incidents").select("id, project_id, phase_id, title, severity, status, opened_at, description"),
      supabase.from("purchase_orders").select("id, project_id, phase_id, category, description, expected_date, due_date, status, total_amount"),
      supabase.from("project_certificates").select("id, project_id, phase_id, certificate_number, description, issue_date, due_date, status, amount"),
      supabase.from("reports").select("id, project_id, title, report_date, status"),
      supabase.from("project_contracts").select("id, project_id, contract_number, title, status, start_date, end_date"),
      supabase.from("project_contract_amendments").select("id, project_id, title, amendment_type, status, effective_date, amount_delta"),
      supabase.from("labor_payment_batches").select("id, project_id, batch_number, period_start, period_end, total_amount, status"),
    ]);

    if (
      projectsError ||
      employeesError ||
      employeeProjectError ||
      phasesError ||
      manualError ||
      milestoneError ||
      siteLogError ||
      incidentError ||
      purchaseOrderError ||
      certificateError ||
      reportError ||
      contractError ||
      contractAmendmentError ||
      laborBatchError
    ) {
      console.error(
        "Supabase agenda error:",
        projectsError?.message ??
          employeesError?.message ??
          employeeProjectError?.message ??
          phasesError?.message ??
          manualError?.message ??
          milestoneError?.message ??
          siteLogError?.message ??
          incidentError?.message ??
          purchaseOrderError?.message ??
          certificateError?.message ??
          reportError?.message ??
          contractError?.message ??
          contractAmendmentError?.message ??
          laborBatchError?.message
      );

      return emptyAgendaDataset();
    }

    const today = getToday();
    const projects = ((projectsData ?? []) as ProjectRow[]).map((project) => ({
      id: project.id,
      name: project.name,
      status: project.status,
    }));
    const phases = ((phasesData ?? []) as PhaseRow[]).map((phase) => ({
      id: phase.id,
      projectId: phase.project_id,
      name: phase.name,
    }));

    const employeeLinks = (employeeProjectData ?? []) as EmployeeProjectRow[];
    const projectIdsByEmployee = employeeLinks.reduce<Record<number, number[]>>((acc, row) => {
      if (!acc[row.employee_id]) {
        acc[row.employee_id] = [];
      }
      acc[row.employee_id].push(row.project_id);
      return acc;
    }, {});
    const assignees = ((employeesData ?? []) as EmployeeRow[]).map((employee) => ({
      id: employee.id,
      name: employee.name,
      projectIds: projectIdsByEmployee[employee.id] ?? [],
    }));

    const projectMap = new Map(projects.map((project) => [project.id, project]));
    const phaseMap = new Map(phases.map((phase) => [phase.id, phase]));
    const assigneeMap = new Map(assignees.map((assignee) => [assignee.id, assignee]));

    const manualEvents = ((manualData ?? []) as ManualEventRow[]).map((row) =>
      mapManualEvent(row, assigneeMap)
    );

    const events: OperationsAgendaEvent[] = [];

    for (const project of (projectsData ?? []) as ProjectRow[]) {
      if (project.start_date) {
        events.push(
          buildBaseEvent(
            buildStaticEvent({
              id: `project-start:${project.id}`,
              sourceId: String(project.id),
              sourceTable: "projects",
              type: "project_start",
              status:
                project.status === "completed"
                  ? "completed"
                  : project.status === "in-progress"
                    ? "in_progress"
                    : "scheduled",
              priority: "high",
              title: "Inicio de obra",
              description: null,
              projectId: project.id,
              phaseId: null,
              start: project.start_date,
              end: null,
              allDay: true,
              editable: false,
            }),
            projectMap,
            phaseMap
          )
        );
      }

      if (project.end_date) {
        events.push(
          buildBaseEvent(
            buildStaticEvent({
              id: `project-end:${project.id}`,
              sourceId: String(project.id),
              sourceTable: "projects",
              type: "project_end",
              status:
                project.status === "completed"
                  ? "completed"
                  : isPastDate(project.end_date, today)
                    ? "delayed"
                    : "pending",
              priority: "high",
              title: "Cierre previsto de obra",
              description: null,
              projectId: project.id,
              phaseId: null,
              start: project.end_date,
              end: null,
              allDay: true,
              editable: false,
            }),
            projectMap,
            phaseMap
          )
        );
      }
    }

    for (const event of manualEvents) {
      events.push(
        buildBaseEvent(
          {
            id: `manual:${event.id}`,
            sourceId: event.id,
            sourceTable: "project_agenda_events",
            type: "manual",
            status: event.status,
            priority: event.priority,
            title: event.title,
            description: event.description,
            projectId: event.projectId,
            phaseId: event.phaseId,
            start: event.isAllDay ? event.startsAt.slice(0, 10) : event.startsAt,
            end: event.isAllDay ? null : event.endsAt,
            allDay: event.isAllDay,
            editable: true,
            assigneeId: event.assigneeId,
            assigneeName: event.assigneeName,
            reminderAt: event.reminderAt,
          },
          projectMap,
          phaseMap
        )
      );
    }

    for (const row of (milestoneData ?? []) as MilestoneRow[]) {
      const status: AgendaEventStatus =
        row.status === "closed" || row.status === "published" || row.status === "validated"
          ? "completed"
          : row.status === "field_completed"
            ? "in_progress"
            : row.status === "rejected"
              ? "blocked"
              : isPastDate(row.due_date, today)
                ? "delayed"
                : "pending";

      events.push(
        buildBaseEvent(
          buildStaticEvent({
            id: `milestone:${row.id}`,
            sourceId: row.id,
            sourceTable: "milestones",
            type: "milestone",
            status,
            priority: status === "delayed" ? "critical" : "high",
            title: row.name,
            description: row.completed_at ? `Completado: ${row.completed_at}` : null,
            projectId: row.project_id,
            phaseId: row.phase_id,
            start: row.due_date,
            end: null,
            allDay: true,
            editable: false,
          }),
          projectMap,
          phaseMap
        )
      );
    }

    for (const row of (siteLogData ?? []) as SiteDailyLogRow[]) {
      const hasImpact = row.weather_impact !== "none" || Number(row.hours_lost ?? 0) > 0;
      if (!hasImpact) continue;

      events.push(
        buildBaseEvent(
          buildStaticEvent({
            id: `site-log:${row.id}`,
            sourceId: row.id,
            sourceTable: "site_daily_logs",
            type: "weather_delay",
            status: "delayed",
            priority: row.weather_impact === "severe" ? "critical" : "high",
            title: "Parte con impacto climático",
            description: `${row.weather_condition} · ${Number(row.hours_lost ?? 0)} hs perdidas${row.notes ? ` · ${row.notes}` : ""}`,
            projectId: row.project_id,
            phaseId: row.phase_id,
            start: row.log_date,
            end: null,
            allDay: true,
            editable: false,
          }),
          projectMap,
          phaseMap
        )
      );
    }

    for (const row of (incidentData ?? []) as IncidentRow[]) {
      const status: AgendaEventStatus =
        row.status === "resolved" || row.status === "closed"
          ? "completed"
          : row.status === "blocked"
            ? "blocked"
            : "open";
      const priority: AgendaEventPriority =
        row.severity === "critical"
          ? "critical"
          : row.severity === "high"
            ? "high"
            : row.severity === "medium"
              ? "medium"
              : "low";

      events.push(
        buildBaseEvent(
          buildStaticEvent({
            id: `incident:${row.id}`,
            sourceId: row.id,
            sourceTable: "incidents",
            type: "incident",
            status,
            priority,
            title: row.title,
            description: row.description,
            projectId: row.project_id,
            phaseId: row.phase_id,
            start: row.opened_at,
            end: null,
            allDay: true,
            editable: false,
          }),
          projectMap,
          phaseMap
        )
      );
    }

    for (const row of (purchaseOrderData ?? []) as PurchaseOrderRow[]) {
      if (row.expected_date) {
        events.push(
          buildBaseEvent(
            buildStaticEvent({
              id: `purchase-expected:${row.id}`,
              sourceId: row.id,
              sourceTable: "purchase_orders",
              type: "purchase_expected",
              status:
                row.status === "received" || row.status === "paid"
                  ? "completed"
                  : isPastDate(row.expected_date, today)
                    ? "delayed"
                    : "pending",
              priority: "high",
              title: "Recepción esperada de compra",
              description: `${row.description} · ${row.category}`,
              projectId: row.project_id,
              phaseId: row.phase_id,
              start: row.expected_date,
              end: null,
              allDay: true,
              editable: false,
            }),
            projectMap,
            phaseMap
          )
        );
      }

      if (row.due_date) {
        events.push(
          buildBaseEvent(
            buildStaticEvent({
              id: `purchase-due:${row.id}`,
              sourceId: row.id,
              sourceTable: "purchase_orders",
              type: "purchase_due",
              status:
                row.status === "paid"
                  ? "completed"
                  : isPastDate(row.due_date, today)
                    ? "delayed"
                    : "pending",
              priority: isPastDate(row.due_date, today) ? "critical" : "high",
              title: "Vencimiento de compra",
              description: `${row.description} · USD ${Number(row.total_amount ?? 0).toLocaleString("es-AR")}`,
              projectId: row.project_id,
              phaseId: row.phase_id,
              start: row.due_date,
              end: null,
              allDay: true,
              editable: false,
            }),
            projectMap,
            phaseMap
          )
        );
      }
    }

    for (const row of (certificateData ?? []) as CertificateRow[]) {
      events.push(
        buildBaseEvent(
          buildStaticEvent({
            id: `certificate-issue:${row.id}`,
            sourceId: row.id,
            sourceTable: "project_certificates",
            type: "certificate_issue",
            status:
              row.status === "cancelled"
                ? "cancelled"
                : row.status === "collected"
                  ? "completed"
                  : "in_progress",
            priority: "medium",
            title: `Certificado ${row.certificate_number}`,
            description: `${row.description} · USD ${Number(row.amount ?? 0).toLocaleString("es-AR")}`,
            projectId: row.project_id,
            phaseId: row.phase_id,
            start: row.issue_date,
            end: null,
            allDay: true,
            editable: false,
          }),
          projectMap,
          phaseMap
        )
      );

      if (row.due_date) {
        events.push(
          buildBaseEvent(
            buildStaticEvent({
              id: `certificate-due:${row.id}`,
              sourceId: row.id,
              sourceTable: "project_certificates",
              type: "certificate_due",
              status:
                row.status === "collected"
                  ? "completed"
                  : isPastDate(row.due_date, today)
                    ? "delayed"
                    : "pending",
              priority: isPastDate(row.due_date, today) ? "critical" : "high",
              title: `Cobro esperado ${row.certificate_number}`,
              description: `${row.description} · USD ${Number(row.amount ?? 0).toLocaleString("es-AR")}`,
              projectId: row.project_id,
              phaseId: row.phase_id,
              start: row.due_date,
              end: null,
              allDay: true,
              editable: false,
            }),
            projectMap,
            phaseMap
          )
        );
      }
    }

    for (const row of (reportData ?? []) as ReportRow[]) {
      events.push(
        buildBaseEvent(
          buildStaticEvent({
            id: `report:${row.id}`,
            sourceId: String(row.id),
            sourceTable: "reports",
            type: "report",
            status:
              row.status === "completed"
                ? "completed"
                : row.status === "in-review"
                  ? "in_progress"
                  : "pending",
            priority: "medium",
            title: row.title,
            description: `Estado: ${row.status}`,
            projectId: row.project_id,
            phaseId: null,
            start: row.report_date,
            end: null,
            allDay: true,
            editable: false,
          }),
          projectMap,
          phaseMap
        )
      );
    }

    for (const row of (contractData ?? []) as ContractRow[]) {
      if (row.start_date) {
        events.push(
          buildBaseEvent(
            buildStaticEvent({
              id: `contract-start:${row.id}`,
              sourceId: row.id,
              sourceTable: "project_contracts",
              type: "contract_start",
              status:
                row.status === "terminated"
                  ? "cancelled"
                  : row.status === "completed"
                    ? "completed"
                    : row.status === "active"
                      ? "in_progress"
                      : "scheduled",
              priority: "medium",
              title: `Inicio contractual ${row.contract_number}`,
              description: row.title,
              projectId: row.project_id,
              phaseId: null,
              start: row.start_date,
              end: null,
              allDay: true,
              editable: false,
            }),
            projectMap,
            phaseMap
          )
        );
      }

      if (row.end_date) {
        events.push(
          buildBaseEvent(
            buildStaticEvent({
              id: `contract-end:${row.id}`,
              sourceId: row.id,
              sourceTable: "project_contracts",
              type: "contract_end",
              status:
                row.status === "completed"
                  ? "completed"
                  : isPastDate(row.end_date, today)
                    ? "delayed"
                    : "pending",
              priority: "high",
              title: `Fin contractual ${row.contract_number}`,
              description: row.title,
              projectId: row.project_id,
              phaseId: null,
              start: row.end_date,
              end: null,
              allDay: true,
              editable: false,
            }),
            projectMap,
            phaseMap
          )
        );
      }
    }

    for (const row of (contractAmendmentData ?? []) as ContractAmendmentRow[]) {
      events.push(
        buildBaseEvent(
          buildStaticEvent({
            id: `contract-amendment:${row.id}`,
            sourceId: row.id,
            sourceTable: "project_contract_amendments",
            type: "contract_amendment",
            status:
              row.status === "approved"
                ? isPastDate(row.effective_date, today)
                  ? "completed"
                  : "scheduled"
                : row.status === "rejected" || row.status === "cancelled"
                  ? "cancelled"
                  : "pending",
            priority: row.status === "submitted" ? "high" : "medium",
            title: row.title,
            description: `${row.amendment_type} · USD ${Number(row.amount_delta ?? 0).toLocaleString("es-AR")}`,
            projectId: row.project_id,
            phaseId: null,
            start: row.effective_date,
            end: null,
            allDay: true,
            editable: false,
          }),
          projectMap,
          phaseMap
        )
      );
    }

    for (const row of (laborBatchData ?? []) as LaborBatchRow[]) {
      events.push(
        buildBaseEvent(
          buildStaticEvent({
            id: `labor-batch:${row.id}`,
            sourceId: row.id,
            sourceTable: "labor_payment_batches",
            type: "labor_batch",
            status:
              row.status === "paid"
                ? "completed"
                : isPastDate(row.period_end, today)
                  ? "delayed"
                  : row.status === "approved"
                    ? "pending"
                    : "scheduled",
            priority: row.status === "paid" ? "medium" : "high",
            title: `Cierre lote ${row.batch_number}`,
            description: `Período ${row.period_start} a ${row.period_end} · USD ${Number(row.total_amount ?? 0).toLocaleString("es-AR")}`,
            projectId: row.project_id,
            phaseId: null,
            start: row.period_end,
            end: null,
            allDay: true,
            editable: false,
          }),
          projectMap,
          phaseMap
        )
      );
    }

    return {
      projects,
      phases,
      assignees,
      manualEvents,
      events: events.sort(sortByStart),
    };
  });
}

export type CreateProjectAgendaEventInput = Omit<
  ProjectAgendaEvent,
  "id" | "createdBy" | "createdAt" | "updatedAt" | "assigneeName"
>;

export async function createProjectAgendaEventDb(
  input: CreateProjectAgendaEventInput
): Promise<ProjectAgendaEvent> {
  const { data, error } = await supabase
    .from("project_agenda_events")
    .insert({
      project_id: input.projectId,
      phase_id: input.phaseId,
      title: input.title,
      description: input.description,
      category: input.category,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      is_all_day: input.isAllDay,
      status: input.status,
      priority: input.priority,
      assigned_to: input.assigneeId,
      reminder_at: input.reminderAt,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error creating agenda event:", error?.message);
    throw new Error(error?.message || "No se pudo registrar el evento en agenda.");
  }

  const row = data as ManualEventRow;

  await logCurrentUserAuditEvent({
    entityType: "project_agenda_event",
    entityId: row.id,
    projectId: row.project_id,
    action: "create",
    fromState: null,
    toState: row.status,
    metadata: {
      category: row.category,
      priority: row.priority,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      assignedTo: row.assigned_to,
      reminderAt: row.reminder_at,
    },
  });

  return mapManualEvent(row, new Map());
}

export type UpdateProjectAgendaEventInput = CreateProjectAgendaEventInput;

export async function updateProjectAgendaEventDb(
  id: string,
  input: UpdateProjectAgendaEventInput
): Promise<ProjectAgendaEvent> {
  const { data: currentData, error: currentError } = await supabase
    .from("project_agenda_events")
    .select("*")
    .eq("id", id)
    .single();

  if (currentError || !currentData) {
    console.error("Error loading agenda event:", currentError?.message);
    throw new Error("No se encontró el evento de agenda.");
  }

  const { data, error } = await supabase
    .from("project_agenda_events")
    .update({
      project_id: input.projectId,
      phase_id: input.phaseId,
      title: input.title,
      description: input.description,
      category: input.category,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      is_all_day: input.isAllDay,
      status: input.status,
      priority: input.priority,
      assigned_to: input.assigneeId,
      reminder_at: input.reminderAt,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error updating agenda event:", error?.message);
    throw new Error(error?.message || "No se pudo actualizar el evento.");
  }

  const current = currentData as ManualEventRow;
  const row = data as ManualEventRow;

  await logCurrentUserAuditEvent({
    entityType: "project_agenda_event",
    entityId: row.id,
    projectId: row.project_id,
    action: "update",
    fromState: current.status,
    toState: row.status,
    metadata: {
      category: row.category,
      priority: row.priority,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      assignedTo: row.assigned_to,
      reminderAt: row.reminder_at,
    },
  });

  return mapManualEvent(row, new Map());
}

export async function updateProjectAgendaEventStatusDb(
  id: string,
  status: ProjectAgendaEvent["status"]
): Promise<ProjectAgendaEvent> {
  const { data: currentData, error: currentError } = await supabase
    .from("project_agenda_events")
    .select("*")
    .eq("id", id)
    .single();

  if (currentError || !currentData) {
    console.error("Error loading agenda event:", currentError?.message);
    throw new Error("No se encontró el evento de agenda.");
  }

  const { data, error } = await supabase
    .from("project_agenda_events")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error updating agenda event:", error?.message);
    throw new Error("No se pudo actualizar el estado del evento.");
  }

  const current = currentData as ManualEventRow;
  const row = data as ManualEventRow;

  await logCurrentUserAuditEvent({
    entityType: "project_agenda_event",
    entityId: row.id,
    projectId: row.project_id,
    action: "status_change",
    fromState: current.status,
    toState: row.status,
    metadata: {
      category: row.category,
      priority: row.priority,
    },
  });

  return mapManualEvent(row, new Map());
}

export async function deleteProjectAgendaEventDb(id: string): Promise<void> {
  const { data: currentData, error: currentError } = await supabase
    .from("project_agenda_events")
    .select("*")
    .eq("id", id)
    .single();

  if (currentError || !currentData) {
    console.error("Error loading agenda event:", currentError?.message);
    throw new Error("No se encontró el evento de agenda.");
  }

  const row = currentData as ManualEventRow;
  const { error } = await supabase.from("project_agenda_events").delete().eq("id", id);

  if (error) {
    console.error("Error deleting agenda event:", error.message);
    throw new Error("No se pudo eliminar el evento.");
  }

  await logCurrentUserAuditEvent({
    entityType: "project_agenda_event",
    entityId: row.id,
    projectId: row.project_id,
    action: "delete",
    fromState: row.status,
    toState: null,
    metadata: {
      category: row.category,
      priority: row.priority,
      assignedTo: row.assigned_to,
      reminderAt: row.reminder_at,
    },
  });
}
