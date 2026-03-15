"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPortfolioControlSummariesDb } from "@/lib/api/project-control";
import type { ProjectControlSummary } from "@/lib/types/project-control";

const money = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

function getDelayBadge(summary: ProjectControlSummary) {
  if (summary.forecastDelayDays >= 10) return "destructive";
  if (summary.forecastDelayDays > 0) return "secondary";
  return "outline";
}

function getCostBadge(summary: ProjectControlSummary) {
  if (summary.forecastCostDelta > 0) return "destructive";
  if (summary.forecastCostDelta < 0) return "secondary";
  return "outline";
}

export function ProjectControlMatrix() {
  const [rows, setRows] = useState<ProjectControlSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadRows = async () => {
      setIsLoading(true);
      const data = await getPortfolioControlSummariesDb();
      if (!mounted) return;
      setRows(data);
      setIsLoading(false);
    };

    void loadRows();

    const handleUpdated = () => {
      void loadRows();
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
  }, []);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Cargando matriz de control...</div>;
  }

  if (rows.length === 0) {
    return <div className="text-sm text-muted-foreground">No hay obras para analizar.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Proyecto</TableHead>
          <TableHead>Avance</TableHead>
          <TableHead>Forecast plazo</TableHead>
          <TableHead>Forecast costo</TableHead>
          <TableHead>Contrato</TableHead>
          <TableHead>Ejecución medida</TableHead>
          <TableHead>Cobro cliente</TableHead>
          <TableHead>Caja neta</TableHead>
          <TableHead>Riesgos</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.projectId}>
            <TableCell>
              <div>
                <p className="font-medium">{row.projectName}</p>
                <p className="text-xs text-muted-foreground">{row.projectStatus ?? "Sin estado"}</p>
              </div>
            </TableCell>
            <TableCell>{row.progress}%</TableCell>
            <TableCell>
              <Badge variant={getDelayBadge(row)}>
                {row.forecastDelayDays} días
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={getCostBadge(row)}>
                {row.forecastCostDelta > 0 ? "+" : ""}{money(row.forecastCostDelta)}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="text-xs text-muted-foreground">
                <p>
                  {row.contractConfigured
                    ? money(row.contractCurrentAmount)
                    : "Sin contrato"}
                </p>
                <p>
                  {row.projectedContractMargin !== null
                    ? `Margen ${money(row.projectedContractMargin)}`
                    : "Margen n/d"}
                </p>
                <p>
                  {row.pendingContractAmendmentCount} adenda(s) pendiente(s)
                </p>
              </div>
            </TableCell>
            <TableCell>
              <div className="text-xs text-muted-foreground">
                <p>{money(row.measuredEarnedValue)} EV</p>
                <p>{money(row.measuredActualCost)} costo real</p>
                <p>PI {row.productivityIndex?.toFixed(2) ?? "n/d"} · CPI {row.costPerformanceIndex?.toFixed(2) ?? "n/d"}</p>
              </div>
            </TableCell>
            <TableCell>
              <div className="text-xs text-muted-foreground">
                <p>{money(row.collectedAmount)} cobrado</p>
                <p>{money(row.pendingCollectionAmount)} pendiente</p>
                <p>{money(row.overdueCollectionAmount)} vencido</p>
              </div>
            </TableCell>
            <TableCell>{money(row.netCash)}</TableCell>
            <TableCell>
              <div className="text-xs text-muted-foreground">
                <p>{row.openIncidentCount} incidencias abiertas</p>
                <p>{row.pendingChangeOrders} cambios pendientes</p>
                <p>{money(row.pendingProcurementAmount)} compras pendientes</p>
                <p>{money(row.overdueProcurementAmount)} compras vencidas</p>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
