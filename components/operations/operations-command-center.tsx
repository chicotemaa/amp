"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getOperationsCommandCenterDb } from "@/lib/api/operations-center";
import type { AppRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import type {
  OperationsCommandAction,
  OperationsCommandCenterData,
  OperationsOwnerRole,
} from "@/lib/types/operations-center";
import {
  OPERATIONS_ACTION_SEVERITY_LABELS,
  OPERATIONS_OWNER_ROLE_LABELS,
} from "@/lib/types/operations-center";

interface OperationsCommandCenterProps {
  projectId: string;
  role: AppRole | null;
}

type MetricCard = {
  label: string;
  value: string;
  helper: string;
};

const ROLE_DESCRIPTIONS: Record<OperationsOwnerRole, string> = {
  operator:
    "Direcciona la obra desde desvíos, publicación y decisiones transversales.",
  pm: "Cierra validaciones, costos y decisiones tácticas del proyecto.",
  inspector: "Sostiene la continuidad del frente, el dato de campo y la trazabilidad diaria.",
};

function formatDate(value: string | null) {
  if (!value) return "Sin registros";
  return new Date(`${value}T00:00:00`).toLocaleDateString("es-AR");
}

function getSeverityVariant(action: OperationsCommandAction) {
  if (action.severity === "critical") return "destructive";
  if (action.severity === "high") return "secondary";
  return "outline";
}

function getActionToneClass(action: OperationsCommandAction) {
  if (action.severity === "critical") {
    return "border-red-200 bg-red-50/70 dark:bg-red-950/20";
  }
  if (action.severity === "high") {
    return "border-amber-200 bg-amber-50/70 dark:bg-amber-950/20";
  }
  return "border-border bg-muted/30";
}

function getRoleMetricCards(
  role: OperationsOwnerRole,
  data: OperationsCommandCenterData
): MetricCard[] {
  const { summary, actions } = data;

  if (role === "operator") {
    return [
      {
        label: "Cola PM",
        value: String(actions.filter((action) => action.ownerRole === "pm").length),
        helper: `${summary.recordedProgressCount + summary.fieldCompletedMilestonesCount} validaciones y ${summary.unassignedLaborEntriesCount + summary.unassignedPurchaseOrdersCount} costos sin partida`,
      },
      {
        label: "Frente de obra",
        value: String(actions.filter((action) => action.ownerRole === "inspector").length),
        helper: `${summary.lowStockCount} stock crítico · ${summary.pendingReceiptCount} compras por recibir`,
      },
      {
        label: "Publicación / pagos",
        value: String(
          summary.validatedPublicationCount + summary.pendingLaborPaymentCount
        ),
        helper: `${summary.validatedPublicationCount} publicación(es) · ${summary.pendingLaborPaymentCount} pago(s) aprobados`,
      },
      {
        label: "Riesgo activo",
        value: String(
          summary.criticalIncidentsCount +
            summary.blockedIncidentsCount +
            summary.overduePurchaseOrdersCount
        ),
        helper: `${summary.equivalentDelayDays} día(s) de atraso climático equivalente`,
      },
    ];
  }

  if (role === "pm") {
    return [
      {
        label: "Validaciones",
        value: String(
          summary.recordedProgressCount + summary.fieldCompletedMilestonesCount
        ),
        helper: `${summary.recordedProgressCount} avances · ${summary.fieldCompletedMilestonesCount} hitos`,
      },
      {
        label: "Trazabilidad costo",
        value: String(
          summary.unassignedLaborEntriesCount + summary.unassignedPurchaseOrdersCount
        ),
        helper: `${summary.unassignedLaborEntriesCount} MO · ${summary.unassignedPurchaseOrdersCount} compras sin partida`,
      },
      {
        label: "Incidencias abiertas",
        value: String(summary.openIncidentsCount),
        helper: `${summary.criticalIncidentsCount} críticas · ${summary.blockedIncidentsCount} bloqueadas`,
      },
      {
        label: "Compras vencidas",
        value: String(summary.overduePurchaseOrdersCount),
        helper: `${summary.pendingLaborApprovalCount} parte(s) de MO pendientes de aprobación`,
      },
    ];
  }

  return [
    {
      label: "Último parte",
      value: formatDate(summary.latestSiteLogDate),
      helper:
        summary.latestSiteLogDate === null
          ? "Todavía no se abrió la bitácora de campo"
          : `${summary.staleSiteLogDays} día(s) desde la última carga`,
    },
    {
      label: "Hitos vencidos",
      value: String(summary.overduePendingMilestonesCount),
      helper: `${summary.fieldCompletedMilestonesCount} hito(s) esperando validación PM`,
    },
    {
      label: "Abastecimiento",
      value: String(summary.lowStockCount + summary.pendingReceiptCount),
      helper: `${summary.lowStockCount} stock crítico · ${summary.pendingReceiptCount} recepciones pendientes`,
    },
    {
      label: "Cuadrillas sin costo",
      value: String(summary.missingLaborTraceabilityDaysCount),
      helper: `${summary.recentWeatherAlertsCount} parte(s) recientes con impacto climático`,
    },
  ];
}

function getVisibleOwnerRoles(role: AppRole | null): OperationsOwnerRole[] {
  if (role === "operator") return ["operator", "pm", "inspector"];
  if (role === "pm") return ["pm"];
  return ["inspector"];
}

function filterActionsByRole(
  role: AppRole | null,
  actions: OperationsCommandAction[]
): OperationsCommandAction[] {
  if (role === "operator") return actions;
  if (role === "pm") return actions.filter((action) => action.ownerRole === "pm");
  return actions.filter((action) => action.ownerRole === "inspector");
}

function ActionLane({
  laneRole,
  actions,
}: {
  laneRole: OperationsOwnerRole;
  actions: OperationsCommandAction[];
}) {
  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">{OPERATIONS_OWNER_ROLE_LABELS[laneRole]}</p>
          <Badge variant="outline">{actions.length} pendiente(s)</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {ROLE_DESCRIPTIONS[laneRole]}
        </p>
      </div>

      {actions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sin pendientes críticos para este rol.
        </p>
      ) : (
        <div className="space-y-3">
          {actions.map((action) => (
            <div
              key={action.id}
              className={cn("rounded-md border p-3 space-y-2", getActionToneClass(action))}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={getSeverityVariant(action)}>
                  {OPERATIONS_ACTION_SEVERITY_LABELS[action.severity]}
                </Badge>
                <Badge variant="outline">{action.metric}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function OperationsCommandCenter({
  projectId,
  role,
}: OperationsCommandCenterProps) {
  const [data, setData] = useState<OperationsCommandCenterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const nextData = await getOperationsCommandCenterDb(Number(projectId));
    setData(nextData);
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    void load();

    const handleUpdated = () => {
      void load();
    };

    window.addEventListener("projectSiteLogUpdated", handleUpdated);
    window.addEventListener("projectProgressUpdated", handleUpdated);
    window.addEventListener("projectIncidentsUpdated", handleUpdated);
    window.addEventListener("projectLaborUpdated", handleUpdated);
    window.addEventListener("projectProcurementUpdated", handleUpdated);
    window.addEventListener("projectMaterialsUpdated", handleUpdated);
    window.addEventListener("projectPlanningUpdated", handleUpdated);

    return () => {
      window.removeEventListener("projectSiteLogUpdated", handleUpdated);
      window.removeEventListener("projectProgressUpdated", handleUpdated);
      window.removeEventListener("projectIncidentsUpdated", handleUpdated);
      window.removeEventListener("projectLaborUpdated", handleUpdated);
      window.removeEventListener("projectProcurementUpdated", handleUpdated);
      window.removeEventListener("projectMaterialsUpdated", handleUpdated);
      window.removeEventListener("projectPlanningUpdated", handleUpdated);
    };
  }, [load]);

  const visibleOwnerRoles = useMemo(() => getVisibleOwnerRoles(role), [role]);
  const visibleActions = useMemo(
    () => (data ? filterActionsByRole(role, data.actions) : []),
    [data, role]
  );
  const metricCards = useMemo(() => {
    if (!data) return [];
    const metricsRole = role === "operator" ? "operator" : role === "pm" ? "pm" : "inspector";
    return getRoleMetricCards(metricsRole, data);
  }, [data, role]);

  if (!role) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Centro de Mando Operativo</CardTitle>
        <p className="text-sm text-muted-foreground">
          Cola accionable por rol para cerrar validaciones, desvíos y trazabilidad
          sin depender de memoria o planillas externas.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading || !data ? (
          <p className="text-sm text-muted-foreground">
            Consolidando pendientes operativos...
          </p>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {metricCards.map((metric) => (
                <div key={metric.label} className="rounded-lg border p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="text-xl font-semibold break-words">{metric.value}</p>
                  <p className="text-xs text-muted-foreground">{metric.helper}</p>
                </div>
              ))}
            </div>

            <Separator />

            <div className="grid gap-4 xl:grid-cols-3">
              {visibleOwnerRoles.map((ownerRole) => (
                <ActionLane
                  key={ownerRole}
                  laneRole={ownerRole}
                  actions={visibleActions.filter((action) => action.ownerRole === ownerRole)}
                />
              ))}
            </div>

            <div className="rounded-lg border border-dashed p-4 grid gap-3 md:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Último parte diario</p>
                <p className="text-sm font-medium">
                  {formatDate(data.summary.latestSiteLogDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Demora clima equivalente</p>
                <p className="text-sm font-medium">
                  {data.summary.equivalentDelayDays} día(s)
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Incidencias activas</p>
                <p className="text-sm font-medium">
                  {data.summary.openIncidentsCount} abierta(s)
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Trazabilidad pendiente</p>
                <p className="text-sm font-medium">
                  {data.summary.unassignedLaborEntriesCount +
                    data.summary.unassignedPurchaseOrdersCount}{" "}
                  registro(s) sin partida
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
