"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createProgressUpdateDb,
  getProjectPhasesDb,
  getWorkPackagesByProjectDb,
} from "@/lib/api/progress";
import type { ProjectPhase, WorkPackage } from "@/lib/types/progress";
import { toast } from "sonner";
import { getSupabaseAuthBrowserClient } from "@/lib/supabase/auth-browser";

interface DailyProgressFormProps {
  projectId: string;
}

const COMMON_ACTIVITIES = [
  "Movimiento de Suelos",
  "Armado / Encofrado",
  "Hormigonado / Llenado",
  "Mampostería / Muros",
  "Instalaciones Eléctricas",
  "Instalaciones Sanitarias / Gas",
  "Revoques y Cubiertas",
  "Pisos y Revestimientos",
  "Carpintería",
  "Pintura y Acabados",
  "Limpieza / Tareas Menores",
  "Otros"
];

export function DailyProgressForm({ projectId }: DailyProgressFormProps) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [reportDate, setReportDate] = useState(today);
  const [progressDelta, setProgressDelta] = useState(0);
  const [phaseId, setPhaseId] = useState<string>("none");
  const [activity, setActivity] = useState<string>("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);
  const [workPackageId, setWorkPackageId] = useState<string>("none");
  const [executedQty, setExecutedQty] = useState(0);

  const loadEmployeeAndPlanning = useCallback(async () => {
    const supabase = getSupabaseAuthBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("employee_id")
        .eq("id", user.id)
        .single();
      setEmployeeId(profile?.employee_id ?? null);
    }

    const [projectPhases, projectWorkPackages] = await Promise.all([
      getProjectPhasesDb(Number(projectId)),
      getWorkPackagesByProjectDb(Number(projectId)),
    ]);
    setPhases(projectPhases);
    setWorkPackages(projectWorkPackages);
  }, [projectId]);

  useEffect(() => {
    void loadEmployeeAndPlanning();
  }, [loadEmployeeAndPlanning]);

  useEffect(() => {
    const handlePlanningRefresh = () => {
      void loadEmployeeAndPlanning();
    };

    window.addEventListener("projectPlanningUpdated", handlePlanningRefresh);
    return () => {
      window.removeEventListener("projectPlanningUpdated", handlePlanningRefresh);
    };
  }, [loadEmployeeAndPlanning]);

  const selectedPhaseWorkPackages = useMemo(() => {
    if (phaseId === "none") return [];
    return workPackages.filter((workPackage) => workPackage.phaseId === phaseId);
  }, [phaseId, workPackages]);

  const selectedWorkPackage = useMemo(
    () => selectedPhaseWorkPackages.find((workPackage) => workPackage.id === workPackageId) ?? null,
    [selectedPhaseWorkPackages, workPackageId]
  );

  const measuredMode = phaseId !== "none" && selectedPhaseWorkPackages.length > 0;

  useEffect(() => {
    if (!measuredMode) {
      setWorkPackageId("none");
      setExecutedQty(0);
      return;
    }

    if (
      workPackageId === "none" ||
      !selectedPhaseWorkPackages.some((workPackage) => workPackage.id === workPackageId)
    ) {
      setWorkPackageId(selectedPhaseWorkPackages[0]?.id ?? "none");
      setExecutedQty(0);
    }
  }, [measuredMode, selectedPhaseWorkPackages, workPackageId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      if (measuredMode) {
        if (workPackageId === "none") {
          throw new Error("Seleccioná una partida para registrar avance medible.");
        }

        if (executedQty <= 0) {
          throw new Error("Ingresá una cantidad ejecutada mayor a cero.");
        }
      }

      const finalNoteParts = [];
      if (activity && activity !== "none") {
        finalNoteParts.push(`[Actividad: ${activity}]`);
      }
      if (note.trim()) {
        finalNoteParts.push(note.trim());
      }
      const finalNote = finalNoteParts.join("\n") || null;

      await createProgressUpdateDb({
        projectId: Number(projectId),
        phaseId: phaseId === "none" ? null : phaseId,
        reportDate,
        progressDelta: measuredMode ? 0 : Number(progressDelta),
        workPackageId: measuredMode ? workPackageId : null,
        executedQty: measuredMode ? Number(executedQty) : null,
        note: finalNote,
        reportedBy: employeeId,
      });

      toast.success("Avance registrado correctamente.");
      setProgressDelta(0);
      setExecutedQty(0);
      setNote("");
      setActivity("none");
      setPhaseId("none");
      setWorkPackageId("none");
      window.dispatchEvent(new Event("projectProgressUpdated"));
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo registrar el avance.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Carga Sistemática de Avance</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reportDate">Fecha</Label>
              <Input
                id="reportDate"
                type="date"
                value={reportDate}
                onChange={(event) => setReportDate(event.target.value)}
                required
              />
            </div>
            {measuredMode ? (
              <div className="space-y-1.5">
                <Label htmlFor="executedQty">
                  Cantidad ejecutada {selectedWorkPackage ? `(${selectedWorkPackage.unit})` : ""}
                </Label>
                <Input
                  id="executedQty"
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={executedQty}
                  onChange={(event) => setExecutedQty(Number(event.target.value))}
                  required
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="progressDelta">Avance del día (%)</Label>
                <Input
                  id="progressDelta"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={progressDelta}
                  onChange={(event) => setProgressDelta(Number(event.target.value))}
                  required
                />
              </div>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Fase de Obra</Label>
              <Select value={phaseId} onValueChange={setPhaseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona fase asociada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General / Múltiples Fases</SelectItem>
                  {phases.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {measuredMode ? (
              <div className="space-y-1.5">
                <Label>Partida Medible</Label>
                <Select value={workPackageId} onValueChange={setWorkPackageId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná partida" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedPhaseWorkPackages.map((workPackage) => (
                      <SelectItem key={workPackage.id} value={workPackage.id}>
                        {workPackage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Actividad Principal</Label>
                <Select value={activity} onValueChange={setActivity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Clasificación de tarea" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Seleccionar...</SelectItem>
                    {COMMON_ACTIVITIES.map((act) => (
                      <SelectItem key={act} value={act}>
                        {act}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {measuredMode ? (
            <p className="text-xs text-muted-foreground">
              Esta fase usa avance medible por partidas. El porcentaje oficial se recalcula al validar
              la cantidad ejecutada.
            </p>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="note">Observaciones adicionales</Label>
            <Textarea
              id="note"
              rows={3}
              placeholder="Ej: Condiciones climáticas, interferencias o detalles operativos."
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : measuredMode ? "Registrar Ejecución" : "Registrar Avance"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
