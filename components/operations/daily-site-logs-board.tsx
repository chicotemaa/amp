"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProjectPhasesDb } from "@/lib/api/progress";
import {
  getSiteDailyLogsByProjectDb,
  getSiteDailyLogSummaryByProjectDb,
} from "@/lib/api/site-daily-logs";
import type { ProjectPhase } from "@/lib/types/progress";
import type { SiteDailyLog, SiteDailyLogSummary } from "@/lib/types/site-daily-log";
import {
  SITE_WEATHER_CONDITION_LABELS,
  SITE_WEATHER_IMPACT_LABELS,
} from "@/lib/types/site-daily-log";

interface DailySiteLogsBoardProps {
  projectId: string;
}

function getImpactBadgeVariant(log: SiteDailyLog) {
  if (log.weatherImpact === "severe") return "destructive";
  if (log.weatherImpact === "moderate" || log.hoursLost > 0) return "secondary";
  return "outline";
}

export function DailySiteLogsBoard({ projectId }: DailySiteLogsBoardProps) {
  const [logs, setLogs] = useState<SiteDailyLog[]>([]);
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [summary, setSummary] = useState<SiteDailyLogSummary>({
    totalLogs: 0,
    weatherAffectedDays: 0,
    totalHoursWorked: 0,
    totalHoursLost: 0,
    equivalentDelayDays: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const [logsData, phasesData, summaryData] = await Promise.all([
      getSiteDailyLogsByProjectDb(Number(projectId)),
      getProjectPhasesDb(Number(projectId)),
      getSiteDailyLogSummaryByProjectDb(Number(projectId)),
    ]);
    setLogs(logsData);
    setPhases(phasesData);
    setSummary(summaryData);
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    void load();

    const handleUpdated = () => {
      void load();
    };

    window.addEventListener("projectSiteLogUpdated", handleUpdated);
    return () => window.removeEventListener("projectSiteLogUpdated", handleUpdated);
  }, [load]);

  const phaseMap = useMemo(
    () => new Map(phases.map((phase) => [phase.id, phase.name])),
    [phases]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Partes Diarios Recientes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Partes cargados</p>
            <p className="text-xl font-semibold">{summary.totalLogs}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Días con impacto</p>
            <p className="text-xl font-semibold">{summary.weatherAffectedDays}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Horas perdidas</p>
            <p className="text-xl font-semibold">{summary.totalHoursLost}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Demora equivalente</p>
            <p className="text-xl font-semibold">{summary.equivalentDelayDays} d</p>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando partes diarios...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay partes diarios registrados para este proyecto.
          </p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="rounded-md border p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(log.logDate).toLocaleDateString("es-AR")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.phaseId ? phaseMap.get(log.phaseId) ?? "Fase no encontrada" : "Registro general"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {SITE_WEATHER_CONDITION_LABELS[log.weatherCondition]}
                    </Badge>
                    <Badge variant={getImpactBadgeVariant(log)}>
                      {SITE_WEATHER_IMPACT_LABELS[log.weatherImpact]}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                  <p>Dotación: {log.workforceCount}</p>
                  <p>Horas efectivas: {log.hoursWorked}</p>
                  <p>Horas perdidas: {log.hoursLost}</p>
                </div>

                {log.notes ? <p className="text-sm">{log.notes}</p> : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
