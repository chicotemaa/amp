"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProjectControlSummaryDb } from "@/lib/api/project-control";
import type { ProjectControlSummary } from "@/lib/types/project-control";

interface ProjectControlSnapshotProps {
  projectId: string;
}

const money = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export function ProjectControlSnapshot({ projectId }: ProjectControlSnapshotProps) {
  const [summary, setSummary] = useState<ProjectControlSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const data = await getProjectControlSummaryDb(Number(projectId));
      if (!mounted) return;
      setSummary(data);
      setIsLoading(false);
    };

    void load();

    const handleUpdated = () => {
      setIsLoading(true);
      void load();
    };

    window.addEventListener("projectLaborUpdated", handleUpdated);
    window.addEventListener("projectProcurementUpdated", handleUpdated);
    window.addEventListener("projectSiteLogUpdated", handleUpdated);
    window.addEventListener("projectIncidentsUpdated", handleUpdated);
    window.addEventListener("projectRevenueUpdated", handleUpdated);
    window.addEventListener("projectProgressUpdated", handleUpdated);
    window.addEventListener("projectPlanningUpdated", handleUpdated);
    window.addEventListener("projectContractsUpdated", handleUpdated);

    return () => {
      mounted = false;
      window.removeEventListener("projectLaborUpdated", handleUpdated);
      window.removeEventListener("projectProcurementUpdated", handleUpdated);
      window.removeEventListener("projectSiteLogUpdated", handleUpdated);
      window.removeEventListener("projectIncidentsUpdated", handleUpdated);
      window.removeEventListener("projectRevenueUpdated", handleUpdated);
      window.removeEventListener("projectProgressUpdated", handleUpdated);
      window.removeEventListener("projectPlanningUpdated", handleUpdated);
      window.removeEventListener("projectContractsUpdated", handleUpdated);
    };
  }, [projectId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Control Ejecutivo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando control ejecutivo...</p>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Control Ejecutivo</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border p-4 space-y-2">
          <p className="text-xs text-muted-foreground">Contrato</p>
          <p className="text-lg font-semibold">
            {summary.contractConfigured ? money(summary.contractCurrentAmount) : "Sin contrato"}
          </p>
          <p className="text-xs text-muted-foreground">
            Base {money(summary.contractOriginalAmount)} · Adendas {summary.approvedContractAmendmentAmount > 0 ? "+" : ""}{money(summary.approvedContractAmendmentAmount)}
          </p>
          <p className="text-xs text-muted-foreground">
            Cobertura cert. {summary.certifiedCoveragePct?.toFixed(1) ?? "n/d"}% · Cobrado {summary.collectedCoveragePct?.toFixed(1) ?? "n/d"}%
          </p>
          <Badge
            variant={
              summary.contractConfigured
                ? summary.projectedContractMargin !== null && summary.projectedContractMargin < 0
                  ? "destructive"
                  : "secondary"
                : "outline"
            }
          >
            {summary.contractConfigured
              ? `Margen ${money(summary.projectedContractMargin ?? 0)}`
              : "Pendiente de configurar"}
          </Badge>
        </div>

        <div className="rounded-md border p-4 space-y-2">
          <p className="text-xs text-muted-foreground">Presupuesto</p>
          <p className="text-lg font-semibold">{money(summary.currentBudget)}</p>
          <p className="text-xs text-muted-foreground">
            Base {money(summary.baselineBudget)} · Comprometido {money(summary.committedAmount)}
          </p>
          <p className="text-xs text-muted-foreground">
            Compras ordenadas {money(summary.procurementOrderedAmount)} · Recepcionado {money(summary.procurementReceivedAmount)}
          </p>
          <Badge variant={summary.forecastCostDelta > 0 ? "destructive" : "secondary"}>
            Forecast {summary.forecastCostDelta > 0 ? "+" : ""}{money(summary.forecastCostDelta)}
          </Badge>
        </div>

        <div className="rounded-md border p-4 space-y-2">
          <p className="text-xs text-muted-foreground">Caja de la obra</p>
          <p className="text-lg font-semibold">{money(summary.netCash)}</p>
          <p className="text-xs text-muted-foreground">
            Ingresos {money(summary.incomes)} · Egresos {money(summary.expenses)}
          </p>
          <p className="text-xs text-muted-foreground">
            Mano de obra {money(summary.laborExpenses)} ({summary.laborHours} hs) · Materiales {money(summary.materialsExpenses)}
          </p>
          <p className="text-xs text-muted-foreground">
            Compras pagadas {money(summary.procurementPaidAmount)} · Pendientes {money(summary.pendingProcurementAmount)}
          </p>
          <p className="text-xs text-muted-foreground">
            Compras vencidas {money(summary.overdueProcurementAmount)}
          </p>
          <p className="text-xs text-muted-foreground">
            MO pagada {money(summary.paidLaborAmount)} · aprobada {money(summary.approvedLaborAmount)} · pendiente {money(summary.pendingLaborAmount)}
          </p>
        </div>

        <div className="rounded-md border p-4 space-y-2">
          <p className="text-xs text-muted-foreground">Certificación y Cobro</p>
          <p className="text-lg font-semibold">{money(summary.collectedAmount)}</p>
          <p className="text-xs text-muted-foreground">
            Certificado {money(summary.certifiedAmount)} · Pendiente {money(summary.pendingCollectionAmount)}
          </p>
          <p className="text-xs text-muted-foreground">
            Vencido {money(summary.overdueCollectionAmount)}
          </p>
          <Badge variant={summary.overdueCollectionAmount > 0 ? "destructive" : "outline"}>
            {summary.overdueCollectionAmount > 0 ? "Cobros vencidos" : "Cobranza al dia"}
          </Badge>
        </div>

        <div className="rounded-md border p-4 space-y-2">
          <p className="text-xs text-muted-foreground">Forecast de plazo</p>
          <p className="text-lg font-semibold">{summary.forecastDelayDays} días</p>
          <p className="text-xs text-muted-foreground">
            Clima {summary.weatherDelayDays} · Incidencias {summary.incidentDelayDays} · Cambios {summary.approvedChangeDays}
          </p>
          <Badge variant={summary.forecastDelayDays > 0 ? "destructive" : "secondary"}>
            {summary.weatherAffectedDays} partes con impacto
          </Badge>
        </div>

        <div className="rounded-md border p-4 space-y-2">
          <p className="text-xs text-muted-foreground">Productividad medida</p>
          <p className="text-lg font-semibold">
            {summary.productivityIndex?.toFixed(2) ?? "n/d"}
          </p>
          <p className="text-xs text-muted-foreground">
            {summary.measuredEarnedHours} hs ganadas · {summary.measuredActualHours} hs reales
          </p>
          <p className="text-xs text-muted-foreground">
            EV {money(summary.measuredEarnedValue)} · costo {money(summary.measuredActualCost)}
          </p>
          <Badge
            variant={
              summary.measuredCostVariance > 0
                ? "destructive"
                : summary.measuredWorkPackageCount > 0
                  ? "secondary"
                  : "outline"
            }
          >
            {summary.measuredWorkPackageCount > 0
              ? `${summary.measuredWorkPackageCount} partidas medidas`
              : "Sin baseline medible"}
          </Badge>
        </div>

        <div className="rounded-md border p-4 space-y-2">
          <p className="text-xs text-muted-foreground">Riesgos activos</p>
          <p className="text-lg font-semibold">{summary.openIncidentCount}</p>
          <p className="text-xs text-muted-foreground">
            {summary.criticalIncidentCount} críticas · {summary.blockedIncidentCount} bloqueadas
          </p>
          <p className="text-xs text-muted-foreground">
            Riesgo económico {money(summary.incidentRiskCost)} · Cambios pendientes {summary.pendingChangeOrders}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
