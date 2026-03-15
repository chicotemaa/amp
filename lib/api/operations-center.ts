import { getIncidentsByProjectDb } from "@/lib/api/incidents";
import { getLaborEntriesByProjectDb } from "@/lib/api/labor";
import { getMaterialsByProjectDb } from "@/lib/api/materials";
import { getProcurementOverviewByProjectDb } from "@/lib/api/procurement";
import {
  getMilestonesByProjectDb,
  getProgressUpdatesByProjectDb,
  getWorkPackagesByProjectDb,
} from "@/lib/api/progress";
import { getSiteDailyLogsByProjectDb } from "@/lib/api/site-daily-logs";
import type {
  OperationsCommandAction,
  OperationsCommandCenterData,
  OperationsCommandCenterSummary,
  OperationsOwnerRole,
  OperationsActionSeverity,
} from "@/lib/types/operations-center";

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function diffDays(fromDate: string, toDate: string) {
  const from = new Date(`${fromDate}T00:00:00`);
  const to = new Date(`${toDate}T00:00:00`);
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86_400_000));
}

function createAction(
  id: string,
  ownerRole: OperationsOwnerRole,
  severity: OperationsActionSeverity,
  title: string,
  description: string,
  metric: string
): OperationsCommandAction {
  return {
    id,
    ownerRole,
    severity,
    title,
    description,
    metric,
  };
}

export async function getOperationsCommandCenterDb(
  projectId: number
): Promise<OperationsCommandCenterData> {
  const today = new Date().toISOString().slice(0, 10);
  const [
    progressUpdates,
    milestones,
    incidents,
    siteLogs,
    materials,
    procurement,
    laborEntries,
    workPackages,
  ] = await Promise.all([
    getProgressUpdatesByProjectDb(projectId),
    getMilestonesByProjectDb(projectId),
    getIncidentsByProjectDb(projectId),
    getSiteDailyLogsByProjectDb(projectId, 60),
    getMaterialsByProjectDb(projectId),
    getProcurementOverviewByProjectDb(projectId),
    getLaborEntriesByProjectDb(projectId),
    getWorkPackagesByProjectDb(projectId),
  ]);

  const measuredPhaseIds = new Set(workPackages.map((workPackage) => workPackage.phaseId));
  const activeIncidents = incidents.filter(
    (incident) => incident.status !== "resolved" && incident.status !== "closed"
  );
  const latestSiteLogDate = siteLogs[0]?.logDate ?? null;
  const staleSiteLogDays = latestSiteLogDate ? diffDays(latestSiteLogDate, today) : 0;
  const recentWeatherAlerts = siteLogs.filter((log) => {
    const isRecent = diffDays(log.logDate, today) <= 7;
    return isRecent && (log.weatherImpact === "moderate" || log.weatherImpact === "severe" || log.hoursLost > 0);
  });
  const weatherHoursLost = siteLogs.reduce((sum, log) => sum + log.hoursLost, 0);
  const laborTrackedDates = new Set(
    laborEntries
      .filter((entry) => entry.hoursWorked > 0)
      .map((entry) => entry.workDate)
  );
  const missingLaborTraceabilityDates = new Set(
    siteLogs
      .filter(
        (log) =>
          log.workforceCount > 0 &&
          diffDays(log.logDate, today) <= 14 &&
          !laborTrackedDates.has(log.logDate)
      )
      .map((log) => log.logDate)
  );

  const recordedProgressCount = progressUpdates.filter(
    (update) => update.validationStatus === "recorded"
  ).length;
  const validatedPublicationCount =
    progressUpdates.filter(
      (update) =>
        update.validationStatus === "validated" && !update.isClientVisible
    ).length +
    milestones.filter(
      (milestone) => milestone.status === "validated" && !milestone.isClientVisible
    ).length;
  const fieldCompletedMilestonesCount = milestones.filter(
    (milestone) => milestone.status === "field_completed"
  ).length;
  const overduePendingMilestonesCount = milestones.filter(
    (milestone) =>
      ["pending", "field_completed"].includes(milestone.status) &&
      milestone.dueDate < today
  ).length;
  const blockedIncidentsCount = activeIncidents.filter(
    (incident) => incident.status === "blocked"
  ).length;
  const criticalIncidentsCount = activeIncidents.filter(
    (incident) => incident.severity === "critical"
  ).length;
  const lowStockCount = materials.filter(
    (material) => material.currentStock <= material.reorderPoint
  ).length;
  const overduePurchaseOrdersCount = procurement.orders.filter(
    (order) =>
      !["cancelled", "draft"].includes(order.status) &&
      order.remainingAmount > 0 &&
      order.dueDate !== null &&
      order.dueDate < today
  ).length;
  const pendingReceiptCount = procurement.orders.filter(
    (order) => order.status === "ordered"
  ).length;
  const pendingLaborApprovalCount = laborEntries.filter(
    (entry) => entry.paymentStatus === "pending"
  ).length;
  const pendingLaborPaymentCount = laborEntries.filter(
    (entry) => entry.paymentStatus === "approved"
  ).length;
  const unassignedLaborEntriesCount = laborEntries.filter(
    (entry) =>
      entry.phaseId !== null &&
      measuredPhaseIds.has(entry.phaseId) &&
      entry.workPackageId === null
  ).length;
  const unassignedPurchaseOrdersCount = procurement.orders.filter(
    (order) =>
      order.phaseId !== null &&
      measuredPhaseIds.has(order.phaseId) &&
      order.workPackageId === null &&
      !["cancelled", "draft"].includes(order.status)
  ).length;

  const summary: OperationsCommandCenterSummary = {
    recordedProgressCount,
    validatedPublicationCount,
    fieldCompletedMilestonesCount,
    overduePendingMilestonesCount,
    openIncidentsCount: activeIncidents.length,
    blockedIncidentsCount,
    criticalIncidentsCount,
    lowStockCount,
    overduePurchaseOrdersCount,
    pendingReceiptCount,
    pendingLaborApprovalCount,
    pendingLaborPaymentCount,
    unassignedLaborEntriesCount,
    unassignedPurchaseOrdersCount,
    recentWeatherAlertsCount: recentWeatherAlerts.length,
    equivalentDelayDays: round2(weatherHoursLost / 8),
    missingLaborTraceabilityDaysCount: missingLaborTraceabilityDates.size,
    staleSiteLogDays,
    latestSiteLogDate,
  };

  const actions: OperationsCommandAction[] = [];

  if (!latestSiteLogDate) {
    actions.push(
      createAction(
        "inspector-site-log-missing",
        "inspector",
        "critical",
        "Abrir seguimiento diario",
        "La obra no tiene partes diarios cargados. El frente no queda trazado ni se detectan atrasos a tiempo.",
        "Sin partes cargados"
      )
    );
  } else if (staleSiteLogDays > 0) {
    actions.push(
      createAction(
        "inspector-site-log-stale",
        "inspector",
        staleSiteLogDays > 1 ? "high" : "medium",
        "Actualizar parte diario",
        `El último parte diario quedó en ${latestSiteLogDate}. Falta cerrar la continuidad del frente con dato de campo.`,
        `${staleSiteLogDays} día(s) sin parte`
      )
    );
  }

  if (overduePendingMilestonesCount > 0) {
    actions.push(
      createAction(
        "inspector-overdue-milestones",
        "inspector",
        overduePendingMilestonesCount >= 3 ? "high" : "medium",
        "Regularizar hitos vencidos",
        "Hay hitos con fecha vencida que siguen pendientes o solo completados en campo.",
        `${overduePendingMilestonesCount} hito(s) vencido(s)`
      )
    );
  }

  if (pendingReceiptCount > 0) {
    actions.push(
      createAction(
        "inspector-pending-receipts",
        "inspector",
        "medium",
        "Recepcionar compras emitidas",
        "Hay órdenes ya emitidas que todavía no fueron recibidas en obra ni impactaron stock.",
        `${pendingReceiptCount} compra(s) por recibir`
      )
    );
  }

  if (lowStockCount > 0) {
    actions.push(
      createAction(
        "inspector-low-stock",
        "inspector",
        lowStockCount >= 2 ? "high" : "medium",
        "Reponer materiales críticos",
        "El stock operativo cayó al punto de reposición y puede afectar el ritmo de ejecución.",
        `${lowStockCount} material(es) en mínimo`
      )
    );
  }

  if (missingLaborTraceabilityDates.size > 0) {
    actions.push(
      createAction(
        "inspector-missing-labor-traceability",
        "inspector",
        "medium",
        "Cerrar trazabilidad de cuadrillas",
        "Hay partes con dotación registrada pero sin mano de obra cargada. El costo real queda incompleto.",
        `${missingLaborTraceabilityDates.size} jornada(s) sin MO`
      )
    );
  }

  if (recordedProgressCount > 0) {
    actions.push(
      createAction(
        "pm-validate-progress",
        "pm",
        recordedProgressCount >= 5 ? "high" : "medium",
        "Validar avances registrados",
        "Los avances cargados por campo todavía no están impactando el progreso oficial del proyecto.",
        `${recordedProgressCount} avance(s) por validar`
      )
    );
  }

  if (fieldCompletedMilestonesCount > 0) {
    actions.push(
      createAction(
        "pm-validate-milestones",
        "pm",
        fieldCompletedMilestonesCount >= 3 ? "high" : "medium",
        "Validar hitos completados en campo",
        "Hay hitos listos en obra que siguen pendientes de revisión formal para mover el baseline oficial.",
        `${fieldCompletedMilestonesCount} hito(s) por validar`
      )
    );
  }

  if (blockedIncidentsCount > 0 || criticalIncidentsCount > 0) {
    actions.push(
      createAction(
        "pm-critical-incidents",
        "pm",
        criticalIncidentsCount > 0 ? "critical" : "high",
        "Resolver incidentes de alto impacto",
        "El proyecto tiene incidentes bloqueados o críticos que ya afectan plazo, costo o continuidad del frente.",
        `${criticalIncidentsCount} crítica(s) · ${blockedIncidentsCount} bloqueada(s)`
      )
    );
  }

  if (unassignedLaborEntriesCount > 0 || unassignedPurchaseOrdersCount > 0) {
    actions.push(
      createAction(
        "pm-unassigned-costs",
        "pm",
        "high",
        "Asignar costo real a partidas",
        "Hay mano de obra o compras cargadas a fases medibles sin vincularlas a una partida. El control fino queda distorsionado.",
        `${unassignedLaborEntriesCount + unassignedPurchaseOrdersCount} registro(s) sin partida`
      )
    );
  }

  if (overduePurchaseOrdersCount > 0) {
    actions.push(
      createAction(
        "pm-overdue-procurement",
        "pm",
        "high",
        "Regularizar compras vencidas",
        "Hay órdenes con saldo pendiente fuera de vencimiento que impactan costo y abastecimiento.",
        `${overduePurchaseOrdersCount} compra(s) vencida(s)`
      )
    );
  }

  if (pendingLaborApprovalCount > 0) {
    actions.push(
      createAction(
        "pm-labor-approval",
        "pm",
        "medium",
        "Aprobar partes de mano de obra",
        "Hay partes de personal aún pendientes. Sin esa revisión, el costo real queda abierto y la caja proyectada pierde precisión.",
        `${pendingLaborApprovalCount} parte(s) pendientes`
      )
    );
  }

  if (validatedPublicationCount > 0) {
    actions.push(
      createAction(
        "operator-publication-queue",
        "operator",
        "medium",
        "Publicar avance validado",
        "Hay información ya validada internamente que todavía no fue curada ni publicada para el cliente.",
        `${validatedPublicationCount} elemento(s) por publicar`
      )
    );
  }

  if (pendingLaborPaymentCount > 0) {
    actions.push(
      createAction(
        "operator-labor-payments",
        "operator",
        "medium",
        "Liberar pagos aprobados",
        "La mano de obra ya fue aprobada, pero todavía no quedó regularizada como pago efectivo.",
        `${pendingLaborPaymentCount} parte(s) aprobadas`
      )
    );
  }

  if (
    criticalIncidentsCount > 0 ||
    blockedIncidentsCount > 0 ||
    overduePurchaseOrdersCount > 0 ||
    round2(weatherHoursLost / 8) > 0
  ) {
    actions.push(
      createAction(
        "operator-executive-deviation",
        "operator",
        criticalIncidentsCount > 0 ? "critical" : "high",
        "Intervenir sobre desvíos de obra",
        "La obra ya muestra señales que exceden el seguimiento táctico y requieren intervención de dirección.",
        `${round2(weatherHoursLost / 8)} d atraso · ${overduePurchaseOrdersCount} compra(s) vencida(s)`
      )
    );
  }

  return {
    summary,
    actions,
  };
}
