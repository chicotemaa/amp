"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { getProjectByIdDb } from "@/lib/api/projects";
import {
  getProgressUpdatesByProjectDb,
  getProjectPhasesDb,
  getWorkPackagePhasePerformanceByProjectDb,
  getWorkPackagesByProjectDb,
  publishProgressUpdateDb,
  validateProgressUpdateDb,
} from "@/lib/api/progress";
import { Project } from "@/lib/types/project";
import {
  ProgressUpdate,
  ProjectPhase,
  WorkPackage,
  WorkPackagePhasePerformance,
} from "@/lib/types/progress";
import { BUDGET_CATEGORY_LABELS } from "@/lib/types/budget";
import { can, type AppRole } from "@/lib/auth/roles";
import { getSupabaseAuthBrowserClient } from "@/lib/supabase/auth-browser";
import { toast } from "sonner";

interface ProgressReportProps {
  projectId: string;
  role: AppRole | null;
}

const STATUS_LABELS: Record<ProgressUpdate["validationStatus"], string> = {
  recorded: "Registrado",
  validated: "Validado",
  published: "Publicado",
};

const money = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export function ProgressReport({ projectId, role }: ProgressReportProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [updates, setUpdates] = useState<ProgressUpdate[]>([]);
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);
  const [phasePerformance, setPhasePerformance] = useState<WorkPackagePhasePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const canValidate = can(role, "progress.validate");
  const canPublish = can(role, "client_publication.manage");

  const refresh = useCallback(async () => {
    const [projectData, updatesData, phasesData, workPackagesData, phasePerformanceData] = await Promise.all([
      getProjectByIdDb(Number(projectId)),
      getProgressUpdatesByProjectDb(Number(projectId)),
      getProjectPhasesDb(Number(projectId)),
      getWorkPackagesByProjectDb(Number(projectId)),
      getWorkPackagePhasePerformanceByProjectDb(Number(projectId)),
    ]);
    setProject(projectData);
    setUpdates(updatesData);
    setPhases(phasesData);
    setWorkPackages(workPackagesData);
    setPhasePerformance(phasePerformanceData);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    const loadEmployee = async () => {
      const supabase = getSupabaseAuthBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("employee_id")
        .eq("id", user.id)
        .single();

      setEmployeeId(profile?.employee_id ?? null);
    };

    void refresh();
    void loadEmployee();
  }, [projectId, refresh]);

  useEffect(() => {
    const handleRefresh = () => {
      void refresh();
    };

    window.addEventListener("projectProgressUpdated", handleRefresh);
    window.addEventListener("projectPlanningUpdated", handleRefresh);
    return () => {
      window.removeEventListener("projectProgressUpdated", handleRefresh);
      window.removeEventListener("projectPlanningUpdated", handleRefresh);
    };
  }, [refresh]);

  const phaseById = useMemo(
    () => new Map(phases.map((phase) => [phase.id, phase])),
    [phases]
  );

  const workPackagesByPhase = useMemo(() => {
    const grouped = new Map<string, WorkPackage[]>();
    for (const workPackage of workPackages) {
      const current = grouped.get(workPackage.phaseId) ?? [];
      current.push(workPackage);
      grouped.set(workPackage.phaseId, current);
    }
    return grouped;
  }, [workPackages]);

  const workPackageById = useMemo(
    () => new Map(workPackages.map((workPackage) => [workPackage.id, workPackage])),
    [workPackages]
  );
  const phasePerformanceById = useMemo(
    () => new Map(phasePerformance.map((item) => [item.phaseId, item])),
    [phasePerformance]
  );

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Cargando reporte de progreso...</p>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Proyecto no encontrado.</p>
      </Card>
    );
  }

  const progressData = {
    overall: project.progress,
    phases: phases.map((phase) => ({
      id: phase.id,
      name: phase.name,
      progress: phase.actualProgress,
      planned: phase.plannedProgress,
      status:
        phase.actualProgress >= 100
          ? "completed"
          : phase.actualProgress > 0
            ? "inProgress"
            : "pending",
    })),
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "inProgress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "delayed":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const handleValidate = async (id: string) => {
    setWorkingId(id);
    try {
      await validateProgressUpdateDb(id, employeeId);
      toast.success("Avance validado e impactado en el progreso oficial.");
      window.dispatchEvent(new Event("projectProgressUpdated"));
      await refresh();
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo validar el avance.");
    } finally {
      setWorkingId(null);
    }
  };

  const handlePublish = async (id: string) => {
    setWorkingId(id);
    try {
      await publishProgressUpdateDb(id, employeeId);
      toast.success("Avance publicado al cliente.");
      window.dispatchEvent(new Event("projectProgressUpdated"));
      await refresh();
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo publicar el avance.");
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Progreso Oficial</h3>
          <BarChart className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-4">
          <Progress value={progressData.overall} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {progressData.overall}% completado
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Progreso por Fases</h3>
        <div className="space-y-4">
          {progressData.phases.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay fases configuradas. El progreso por fases aparecerá cuando se planifique la obra.
            </p>
          ) : progressData.phases.map((phase) => (
            <div key={phase.name} className="space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(phase.status)}
                  <span className="text-sm font-medium">{phase.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {phase.progress}% real · {phase.planned}% plan
                </span>
              </div>
              <Progress value={phase.progress} className="h-2" />
              {phasePerformanceById.get(phase.id) ? (
                <div className="grid gap-2 pt-1 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-sm bg-muted/40 p-2">
                    <p className="font-medium text-foreground">Valor ganado</p>
                    <p>{money(phasePerformanceById.get(phase.id)?.earnedValue ?? 0)}</p>
                    <p>Plan {money(phasePerformanceById.get(phase.id)?.plannedValue ?? 0)}</p>
                  </div>
                  <div className="rounded-sm bg-muted/40 p-2">
                    <p className="font-medium text-foreground">Costo real fase</p>
                    <p>{money(phasePerformanceById.get(phase.id)?.actualCost ?? 0)}</p>
                    <p>
                      Desvío{" "}
                      {(phasePerformanceById.get(phase.id)?.costVariance ?? 0) > 0 ? "+" : ""}
                      {money(phasePerformanceById.get(phase.id)?.costVariance ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-sm bg-muted/40 p-2">
                    <p className="font-medium text-foreground">Productividad</p>
                    <p>
                      {phasePerformanceById.get(phase.id)?.productivityIndex?.toFixed(2) ?? "n/d"} SPI-h
                    </p>
                    <p>
                      {phasePerformanceById.get(phase.id)?.earnedHours ?? 0} hs ganadas ·{" "}
                      {phasePerformanceById.get(phase.id)?.actualHours ?? 0} hs reales
                    </p>
                  </div>
                  <div className="rounded-sm bg-muted/40 p-2">
                    <p className="font-medium text-foreground">Costo por desempeño</p>
                    <p>
                      {phasePerformanceById.get(phase.id)?.costPerformanceIndex?.toFixed(2) ?? "n/d"} CPI
                    </p>
                    <p>
                      MO {money(phasePerformanceById.get(phase.id)?.actualLaborCost ?? 0)} · Compras{" "}
                      {money(phasePerformanceById.get(phase.id)?.actualProcurementCost ?? 0)}
                    </p>
                  </div>
                </div>
              ) : null}
              {(phasePerformanceById.get(phase.id)?.unassignedActualCost ?? 0) > 0 ||
              (phasePerformanceById.get(phase.id)?.unassignedActualHours ?? 0) > 0 ? (
                <div className="rounded-sm border border-dashed p-2 text-xs text-muted-foreground">
                  Costos u horas de la fase todavía sin asignar a partida:
                  {" "}
                  {money(phasePerformanceById.get(phase.id)?.unassignedActualCost ?? 0)} y{" "}
                  {phasePerformanceById.get(phase.id)?.unassignedActualHours ?? 0} hs.
                </div>
              ) : null}
              {(workPackagesByPhase.get(phase.id) ?? []).length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  {(phasePerformanceById.get(phase.id)?.packages ?? []).map((workPackage) => {
                    const completion = workPackage.completionRate;

                    return (
                      <div key={workPackage.workPackageId} className="rounded-sm bg-muted/40 p-2">
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="font-medium">{workPackage.name}</span>
                            <p className="text-muted-foreground">
                              {BUDGET_CATEGORY_LABELS[workPackage.budgetCategory]}
                            </p>
                          </div>
                          <span className="text-muted-foreground">
                            {workPackage.executedQty} / {workPackage.plannedQty} {workPackage.unit}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                          <span>
                            Costo {workPackage.costPerformanceIndex?.toFixed(2) ?? "n/d"} CPI · Prod.{" "}
                            {workPackage.productivityIndex?.toFixed(2) ?? "n/d"}
                          </span>
                          <span>{completion.toFixed(1)}%</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>EV {money(workPackage.earnedValue)} / Plan {money(workPackage.plannedValue)}</span>
                          <span>Hs {workPackage.earnedHours.toFixed(1)} / {workPackage.actualHours.toFixed(1)}</span>
                          <span>Costo real {money(workPackage.actualCost)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <h3 className="text-lg font-semibold">Entradas de Avance</h3>
            <p className="text-sm text-muted-foreground">
              El progreso oficial solo cambia cuando una entrada es validada.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {updates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay avances registrados.</p>
          ) : (
            updates.map((update) => (
              <div key={update.id} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(update.reportDate).toLocaleDateString("es-AR")} ·{" "}
                      {update.workPackageId
                        ? `${workPackageById.get(update.workPackageId)?.name ?? "Partida"} · ${update.executedQty ?? 0} ${workPackageById.get(update.workPackageId)?.unit ?? ""}`
                        : `+${update.progressDelta}%`}
                    </p>
                    {update.phaseId ? (
                      <p className="text-xs text-muted-foreground">
                        {phaseById.get(update.phaseId)?.name ?? "Fase no encontrada"}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {update.note || "Sin observaciones."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{STATUS_LABELS[update.validationStatus]}</Badge>
                    {update.isClientVisible ? <Badge>Cliente visible</Badge> : null}
                  </div>
                </div>
                {(canValidate || canPublish) && (
                  <div className="flex flex-wrap gap-2 justify-end">
                    {canValidate && update.validationStatus === "recorded" ? (
                      <Button
                        size="sm"
                        disabled={workingId === update.id}
                        onClick={() => handleValidate(update.id)}
                      >
                        Validar avance
                      </Button>
                    ) : null}
                    {canPublish && update.validationStatus === "validated" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={workingId === update.id}
                        onClick={() => handlePublish(update.id)}
                      >
                        Publicar al cliente
                      </Button>
                    ) : null}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
