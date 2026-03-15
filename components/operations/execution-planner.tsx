"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BUDGET_CATEGORY_LABELS, type BudgetCategory } from "@/lib/types/budget";
import {
  createMilestoneDb,
  createProjectPhaseDb,
  createWorkPackageDb,
  getMilestonesByProjectDb,
  getProjectPhasesDb,
  getWorkPackagesByProjectDb,
} from "@/lib/api/progress";
import type { Milestone, ProjectPhase, WorkPackage } from "@/lib/types/progress";

interface ExecutionPlannerProps {
  projectId: string;
}

export function ExecutionPlanner({ projectId }: ExecutionPlannerProps) {
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);
  const [loading, setLoading] = useState(true);

  const [phaseName, setPhaseName] = useState("");
  const [phaseOrder, setPhaseOrder] = useState(1);
  const [phasePlanned, setPhasePlanned] = useState(0);

  const [milestoneName, setMilestoneName] = useState("");
  const [milestoneDueDate, setMilestoneDueDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [milestonePhaseId, setMilestonePhaseId] = useState<string>("none");

  const [workPackagePhaseId, setWorkPackagePhaseId] = useState<string>("none");
  const [workPackageName, setWorkPackageName] = useState("");
  const [workPackageBudgetCategory, setWorkPackageBudgetCategory] =
    useState<BudgetCategory>("labor");
  const [workPackageUnit, setWorkPackageUnit] = useState("m2");
  const [workPackagePlannedQty, setWorkPackagePlannedQty] = useState(0);
  const [workPackageWeight, setWorkPackageWeight] = useState(0);
  const [workPackagePlannedUnitCost, setWorkPackagePlannedUnitCost] = useState(0);
  const [workPackagePlannedHoursPerUnit, setWorkPackagePlannedHoursPerUnit] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const [phaseData, milestoneData, workPackageData] = await Promise.all([
      getProjectPhasesDb(Number(projectId)),
      getMilestonesByProjectDb(Number(projectId)),
      getWorkPackagesByProjectDb(Number(projectId)),
    ]);
    setPhases(phaseData);
    setMilestones(milestoneData);
    setWorkPackages(workPackageData);
    setPhaseOrder(Math.max(1, ...phaseData.map((p) => p.phaseOrder + 1)));
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handlePlanningRefresh = () => {
      void load();
    };

    window.addEventListener("projectPlanningUpdated", handlePlanningRefresh);
    return () => {
      window.removeEventListener("projectPlanningUpdated", handlePlanningRefresh);
    };
  }, [load]);

  const sortedPhases = useMemo(
    () => [...phases].sort((a, b) => a.phaseOrder - b.phaseOrder),
    [phases]
  );

  const sortedMilestones = useMemo(
    () => [...milestones].sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [milestones]
  );

  const workPackagesByPhase = useMemo(() => {
    return sortedPhases.map((phase) => ({
      phase,
      items: workPackages
        .filter((workPackage) => workPackage.phaseId === phase.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    }));
  }, [sortedPhases, workPackages]);

  useEffect(() => {
    if (workPackagePhaseId === "none" && sortedPhases.length > 0) {
      setWorkPackagePhaseId(sortedPhases[0].id);
    }
  }, [sortedPhases, workPackagePhaseId]);

  const handleCreatePhase = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await createProjectPhaseDb({
        projectId: Number(projectId),
        name: phaseName,
        phaseOrder,
        plannedProgress: phasePlanned,
      });
      toast.success("Fase creada.");
      setPhaseName("");
      setPhasePlanned(0);
      window.dispatchEvent(new Event("projectPlanningUpdated"));
      await load();
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo crear la fase.");
    }
  };

  const handleCreateMilestone = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await createMilestoneDb({
        projectId: Number(projectId),
        phaseId: milestonePhaseId === "none" ? null : milestonePhaseId,
        name: milestoneName,
        dueDate: milestoneDueDate,
      });
      toast.success("Hito creado.");
      setMilestoneName("");
      window.dispatchEvent(new Event("projectPlanningUpdated"));
      await load();
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo crear el hito.");
    }
  };

  const handleCreateWorkPackage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (workPackagePhaseId === "none") {
      toast.error("Seleccioná una fase para crear la partida.");
      return;
    }

    try {
      await createWorkPackageDb({
        projectId: Number(projectId),
        phaseId: workPackagePhaseId,
        name: workPackageName,
        budgetCategory: workPackageBudgetCategory,
        unit: workPackageUnit,
        plannedQty: Number(workPackagePlannedQty),
        weight: Number(workPackageWeight),
        plannedUnitCost: Number(workPackagePlannedUnitCost),
        plannedHoursPerUnit: Number(workPackagePlannedHoursPerUnit),
      });
      toast.success("Partida creada.");
      setWorkPackageName("");
      setWorkPackageBudgetCategory("labor");
      setWorkPackageUnit("m2");
      setWorkPackagePlannedQty(0);
      setWorkPackageWeight(0);
      setWorkPackagePlannedUnitCost(0);
      setWorkPackagePlannedHoursPerUnit(0);
      window.dispatchEvent(new Event("projectPlanningUpdated"));
      await load();
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo crear la partida.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planificación de Ejecución</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? <p className="text-sm text-muted-foreground">Cargando...</p> : null}

        <div className="grid gap-3 xl:grid-cols-3">
          <form className="rounded-md border p-3 space-y-3" onSubmit={handleCreatePhase}>
            <h4 className="font-medium text-sm">Nueva Fase</h4>
            <div className="space-y-1.5">
              <Label htmlFor="phaseName">Nombre</Label>
              <Input
                id="phaseName"
                value={phaseName}
                onChange={(e) => setPhaseName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="phaseOrder">Orden</Label>
                <Input
                  id="phaseOrder"
                  type="number"
                  min={1}
                  value={phaseOrder}
                  onChange={(e) => setPhaseOrder(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phasePlanned">% Planificado</Label>
                <Input
                  id="phasePlanned"
                  type="number"
                  min={0}
                  max={100}
                  value={phasePlanned}
                  onChange={(e) => setPhasePlanned(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm">
                Crear Fase
              </Button>
            </div>
          </form>

          <form className="rounded-md border p-3 space-y-3" onSubmit={handleCreateMilestone}>
            <h4 className="font-medium text-sm">Nuevo Hito</h4>
            <div className="space-y-1.5">
              <Label htmlFor="milestoneName">Nombre</Label>
              <Input
                id="milestoneName"
                value={milestoneName}
                onChange={(e) => setMilestoneName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="milestoneDueDate">Fecha objetivo</Label>
                <Input
                  id="milestoneDueDate"
                  type="date"
                  value={milestoneDueDate}
                  onChange={(e) => setMilestoneDueDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="milestonePhase">Fase</Label>
                <select
                  id="milestonePhase"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={milestonePhaseId}
                  onChange={(e) => setMilestonePhaseId(e.target.value)}
                >
                  <option value="none">Sin fase</option>
                  {sortedPhases.map((phase) => (
                    <option key={phase.id} value={phase.id}>
                      {phase.phaseOrder}. {phase.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm">
                Crear Hito
              </Button>
            </div>
          </form>

          <form className="rounded-md border p-3 space-y-3" onSubmit={handleCreateWorkPackage}>
            <h4 className="font-medium text-sm">Nueva Partida Medible</h4>
            <div className="space-y-1.5">
              <Label htmlFor="workPackagePhase">Fase</Label>
              <select
                id="workPackagePhase"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={workPackagePhaseId}
                onChange={(e) => setWorkPackagePhaseId(e.target.value)}
              >
                <option value="none">Seleccionar fase</option>
                {sortedPhases.map((phase) => (
                  <option key={phase.id} value={phase.id}>
                    {phase.phaseOrder}. {phase.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="workPackageName">Nombre</Label>
              <Input
                id="workPackageName"
                value={workPackageName}
                onChange={(e) => setWorkPackageName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="workPackageBudgetCategory">Rubro</Label>
                <select
                  id="workPackageBudgetCategory"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={workPackageBudgetCategory}
                  onChange={(e) => setWorkPackageBudgetCategory(e.target.value as BudgetCategory)}
                >
                  {Object.entries(BUDGET_CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="workPackageUnit">Unidad</Label>
                <Input
                  id="workPackageUnit"
                  value={workPackageUnit}
                  onChange={(e) => setWorkPackageUnit(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="workPackagePlannedQty">Cantidad</Label>
                <Input
                  id="workPackagePlannedQty"
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={workPackagePlannedQty}
                  onChange={(e) => setWorkPackagePlannedQty(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="workPackageWeight">Peso</Label>
                <Input
                  id="workPackageWeight"
                  type="number"
                  min={0}
                  step={0.01}
                  value={workPackageWeight}
                  onChange={(e) => setWorkPackageWeight(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="workPackagePlannedUnitCost">Costo unitario plan</Label>
                <Input
                  id="workPackagePlannedUnitCost"
                  type="number"
                  min={0}
                  step={0.01}
                  value={workPackagePlannedUnitCost}
                  onChange={(e) => setWorkPackagePlannedUnitCost(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="workPackagePlannedHoursPerUnit">Horas plan por unidad</Label>
                <Input
                  id="workPackagePlannedHoursPerUnit"
                  type="number"
                  min={0}
                  step={0.01}
                  value={workPackagePlannedHoursPerUnit}
                  onChange={(e) => setWorkPackagePlannedHoursPerUnit(Number(e.target.value))}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              El peso distribuye el avance oficial dentro de la fase cuando haya varias partidas.
            </p>
            <div className="flex justify-end">
              <Button type="submit" size="sm">
                Crear Partida
              </Button>
            </div>
          </form>
        </div>

        <div className="grid gap-3 xl:grid-cols-3">
          <div className="rounded-md border p-3">
            <h4 className="font-medium text-sm mb-2">Fases</h4>
            <div className="space-y-1.5 text-sm">
              {sortedPhases.length === 0 ? (
                <p className="text-muted-foreground">Sin fases.</p>
              ) : (
                sortedPhases.map((phase) => (
                  <div key={phase.id} className="flex items-center justify-between">
                    <span>
                      {phase.phaseOrder}. {phase.name}
                    </span>
                    <span className="text-muted-foreground">{phase.plannedProgress}% plan</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="rounded-md border p-3">
            <h4 className="font-medium text-sm mb-2">Hitos</h4>
            <div className="space-y-1.5 text-sm">
              {sortedMilestones.length === 0 ? (
                <p className="text-muted-foreground">Sin hitos.</p>
              ) : (
                sortedMilestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center justify-between">
                    <span>{milestone.name}</span>
                    <span className="text-muted-foreground">
                      {new Date(milestone.dueDate).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-md border p-3 xl:col-span-1">
            <h4 className="font-medium text-sm mb-2">Partidas por Fase</h4>
            <div className="space-y-3 text-sm">
              {workPackages.length === 0 ? (
                <p className="text-muted-foreground">
                  Sin partidas. Podés definir medición real por cantidad para cada fase.
                </p>
              ) : (
                workPackagesByPhase
                  .filter((entry) => entry.items.length > 0)
                  .map(({ phase, items }) => (
                    <div key={phase.id} className="space-y-1.5">
                      <p className="font-medium">
                        {phase.phaseOrder}. {phase.name}
                      </p>
                      {items.map((workPackage) => (
                        <div key={workPackage.id} className="flex items-center justify-between gap-3">
                          <div>
                            <span>{workPackage.name}</span>
                            <p className="text-xs text-muted-foreground">
                              {BUDGET_CATEGORY_LABELS[workPackage.budgetCategory]}
                            </p>
                          </div>
                          <div className="text-right text-muted-foreground">
                            <p>
                              {workPackage.plannedQty} {workPackage.unit} · peso {workPackage.weight}
                            </p>
                            <p className="text-xs">
                              costo {workPackage.plannedUnitCost} · hh/u {workPackage.plannedHoursPerUnit}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
