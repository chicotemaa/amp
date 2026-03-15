"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getEmployeesByProjectDb } from "@/lib/api/employees";
import {
  createLaborEntryDb,
  createLaborPaymentBatchDb,
  getLaborOverviewByProjectDb,
  markLaborPaymentBatchPaidDb,
  updateLaborEntryPaymentStatusDb,
} from "@/lib/api/labor";
import { getProjectPhasesDb, getWorkPackagesByProjectDb } from "@/lib/api/progress";
import type { AppRole } from "@/lib/auth/roles";
import { can } from "@/lib/auth/roles";
import { getSupabaseAuthBrowserClient } from "@/lib/supabase/auth-browser";
import type { Employee } from "@/lib/types/employee";
import type {
  LaborEntry,
  LaborPaymentBatch,
  LaborPaymentBatchStatus,
  LaborPaymentStatus,
  LaborSummary,
} from "@/lib/types/labor";
import {
  LABOR_PAYMENT_BATCH_STATUS_LABELS,
  LABOR_PAYMENT_STATUS_LABELS,
} from "@/lib/types/labor";
import type { ProjectPhase, WorkPackage } from "@/lib/types/progress";

interface LaborCostsProps {
  projectId: string;
}

const money = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("es-AR");
}

function getStatusBadgeVariant(status: LaborPaymentStatus) {
  if (status === "paid") return "secondary";
  if (status === "approved") return "outline";
  return "destructive";
}

function getBatchBadgeVariant(status: LaborPaymentBatchStatus) {
  if (status === "paid") return "secondary";
  if (status === "approved") return "outline";
  return "destructive";
}

export function LaborCosts({ projectId }: LaborCostsProps) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);
  const [entries, setEntries] = useState<LaborEntry[]>([]);
  const [batches, setBatches] = useState<LaborPaymentBatch[]>([]);
  const [summary, setSummary] = useState<LaborSummary>({
    totalEntries: 0,
    totalHours: 0,
    totalAmount: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    paidAmount: 0,
    batchCount: 0,
    paidBatchCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);
  const [payingBatchId, setPayingBatchId] = useState<string | null>(null);
  const [updatingEntryId, setUpdatingEntryId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [phaseId, setPhaseId] = useState<string>("none");
  const [workPackageId, setWorkPackageId] = useState<string>("none");
  const [workDate, setWorkDate] = useState(today);
  const [hoursWorked, setHoursWorked] = useState(8);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<LaborPaymentStatus>("pending");
  const [notes, setNotes] = useState("");
  const [actorEmployeeId, setActorEmployeeId] = useState<number | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [batchNumber, setBatchNumber] = useState("");
  const [batchPeriodStart, setBatchPeriodStart] = useState(today);
  const [batchPeriodEnd, setBatchPeriodEnd] = useState(today);
  const [batchNotes, setBatchNotes] = useState("");

  const canApproveEntries = can(role, "progress.validate");
  const canPrepareBatches = canApproveEntries;
  const canPayBatches = can(role, "cashflow.view");

  const load = useCallback(async () => {
    setIsLoading(true);
    const [
      employeesData,
      phasesData,
      workPackagesData,
      laborOverview,
    ] = await Promise.all([
      getEmployeesByProjectDb(Number(projectId)),
      getProjectPhasesDb(Number(projectId)),
      getWorkPackagesByProjectDb(Number(projectId)),
      getLaborOverviewByProjectDb(Number(projectId)),
    ]);
    setEmployees(employeesData);
    setPhases(phasesData);
    setWorkPackages(workPackagesData);
    setEntries(laborOverview.entries);
    setBatches(laborOverview.batches);
    setSummary(laborOverview.summary);
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    void load();

    const handleUpdated = () => {
      void load();
    };

    window.addEventListener("projectLaborUpdated", handleUpdated);
    window.addEventListener("projectPlanningUpdated", handleUpdated);
    return () => {
      window.removeEventListener("projectLaborUpdated", handleUpdated);
      window.removeEventListener("projectPlanningUpdated", handleUpdated);
    };
  }, [load]);

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = getSupabaseAuthBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("employee_id, role")
        .eq("id", user.id)
        .single();

      setActorEmployeeId(profile?.employee_id ?? null);
      setRole((profile?.role as AppRole | null) ?? null);
    };

    void loadProfile();
  }, []);

  useEffect(() => {
    if (!canApproveEntries) {
      setPaymentStatus("pending");
    }
  }, [canApproveEntries]);

  const employeeMap = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees]
  );
  const phaseMap = useMemo(
    () => new Map(phases.map((phase) => [phase.id, phase])),
    [phases]
  );
  const workPackageMap = useMemo(
    () => new Map(workPackages.map((workPackage) => [workPackage.id, workPackage])),
    [workPackages]
  );
  const batchMap = useMemo(
    () => new Map(batches.map((batch) => [batch.id, batch])),
    [batches]
  );

  const selectedPhaseWorkPackages = useMemo(() => {
    if (phaseId === "none") return [];
    return workPackages.filter((workPackage) => workPackage.phaseId === phaseId);
  }, [phaseId, workPackages]);

  const approvedUnbatchedEntries = useMemo(
    () =>
      entries.filter(
        (entry) => entry.paymentStatus === "approved" && entry.paymentBatchId === null
      ),
    [entries]
  );

  const selectedEntriesForBatch = useMemo(
    () =>
      approvedUnbatchedEntries.filter((entry) => selectedEntryIds.includes(entry.id)),
    [approvedUnbatchedEntries, selectedEntryIds]
  );

  const selectedEntriesTotal = useMemo(
    () =>
      selectedEntriesForBatch.reduce((sum, entry) => sum + entry.amountPaid, 0),
    [selectedEntriesForBatch]
  );

  const openBatches = useMemo(
    () => batches.filter((batch) => batch.status !== "paid"),
    [batches]
  );

  useEffect(() => {
    if (phaseId === "none" || selectedPhaseWorkPackages.length === 0) {
      setWorkPackageId("none");
      return;
    }

    if (
      workPackageId === "none" ||
      !selectedPhaseWorkPackages.some((workPackage) => workPackage.id === workPackageId)
    ) {
      setWorkPackageId(selectedPhaseWorkPackages[0].id);
    }
  }, [phaseId, selectedPhaseWorkPackages, workPackageId]);

  useEffect(() => {
    setSelectedEntryIds((current) =>
      current.filter((entryId) =>
        approvedUnbatchedEntries.some((entry) => entry.id === entryId)
      )
    );
  }, [approvedUnbatchedEntries]);

  useEffect(() => {
    if (selectedEntriesForBatch.length === 0) {
      setBatchPeriodStart(today);
      setBatchPeriodEnd(today);
      return;
    }

    const dates = selectedEntriesForBatch
      .map((entry) => entry.workDate)
      .sort((left, right) => left.localeCompare(right));
    setBatchPeriodStart(dates[0]);
    setBatchPeriodEnd(dates[dates.length - 1]);
  }, [selectedEntriesForBatch, today]);

  useEffect(() => {
    if (!batchNumber) {
      setBatchNumber(`MO-${projectId}-${String(batches.length + 1).padStart(3, "0")}`);
    }
  }, [batchNumber, batches.length, projectId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!employeeId) return;

    setIsSubmitting(true);
    try {
      await createLaborEntryDb({
        projectId: Number(projectId),
        phaseId: phaseId === "none" ? null : phaseId,
        workPackageId:
          phaseId !== "none" && workPackageId !== "none" ? workPackageId : null,
        employeeId: Number(employeeId),
        workDate,
        hoursWorked,
        hourlyRate,
        paymentStatus: canApproveEntries ? paymentStatus : "pending",
        notes: notes.trim() || null,
        createdBy: actorEmployeeId,
      });
      toast.success("Parte de mano de obra registrado.");
      setEmployeeId("");
      setPhaseId("none");
      setWorkPackageId("none");
      setWorkDate(today);
      setHoursWorked(8);
      setHourlyRate(0);
      setPaymentStatus("pending");
      setNotes("");
      window.dispatchEvent(new Event("projectLaborUpdated"));
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo registrar la mano de obra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEntryStatusChange = async (
    entryId: string,
    nextStatus: Exclude<LaborPaymentStatus, "paid">
  ) => {
    setUpdatingEntryId(entryId);
    try {
      await updateLaborEntryPaymentStatusDb(entryId, nextStatus, actorEmployeeId);
      toast.success(
        nextStatus === "approved"
          ? "Parte de mano de obra aprobado."
          : "Parte de mano de obra devuelto a pendiente."
      );
      window.dispatchEvent(new Event("projectLaborUpdated"));
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo actualizar el estado.");
    } finally {
      setUpdatingEntryId(null);
    }
  };

  const handleCreateBatch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canPrepareBatches || selectedEntryIds.length === 0 || !batchNumber.trim()) return;

    setIsCreatingBatch(true);
    try {
      await createLaborPaymentBatchDb({
        projectId: Number(projectId),
        batchNumber: batchNumber.trim(),
        periodStart: batchPeriodStart,
        periodEnd: batchPeriodEnd,
        entryIds: selectedEntryIds,
        notes: batchNotes.trim() || null,
        createdBy: actorEmployeeId,
      });
      toast.success("Lote de liquidación creado.");
      setSelectedEntryIds([]);
      setBatchNotes("");
      setBatchNumber(`MO-${projectId}-${String(batches.length + 2).padStart(3, "0")}`);
      window.dispatchEvent(new Event("projectLaborUpdated"));
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo crear el lote.");
    } finally {
      setIsCreatingBatch(false);
    }
  };

  const handlePayBatch = async (batchId: string) => {
    setPayingBatchId(batchId);
    try {
      await markLaborPaymentBatchPaidDb(batchId, actorEmployeeId);
      toast.success("Pago del lote registrado.");
      window.dispatchEvent(new Event("projectLaborUpdated"));
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo registrar el pago.");
    } finally {
      setPayingBatchId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Costos de Personal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Horas registradas</p>
            <p className="text-xl font-semibold">{summary.totalHours}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Costo total</p>
            <p className="text-xl font-semibold">{money(summary.totalAmount)}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Pendiente de aprobar</p>
            <p className="text-xl font-semibold">{money(summary.pendingAmount)}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Listo para pagar</p>
            <p className="text-xl font-semibold">{money(summary.approvedAmount)}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Pagado</p>
            <p className="text-xl font-semibold">{money(summary.paidAmount)}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Lotes</p>
            <p className="text-xl font-semibold">
              {summary.paidBatchCount}/{summary.batchCount}
            </p>
          </div>
        </div>

        <form className="grid gap-4 rounded-md border p-4" onSubmit={handleSubmit}>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Empleado</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={String(employee.id)}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Fase</Label>
              <Select value={phaseId} onValueChange={setPhaseId}>
                <SelectTrigger>
                  <SelectValue placeholder="General / Sin fase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General / Sin fase</SelectItem>
                  {phases.map((phase) => (
                    <SelectItem key={phase.id} value={phase.id}>
                      {phase.phaseOrder}. {phase.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Partida</Label>
              <Select
                value={workPackageId}
                onValueChange={setWorkPackageId}
                disabled={phaseId === "none" || selectedPhaseWorkPackages.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      phaseId === "none"
                        ? "Seleccionar fase"
                        : selectedPhaseWorkPackages.length === 0
                          ? "Sin partidas"
                          : "Seleccionar partida"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin partida específica</SelectItem>
                  {selectedPhaseWorkPackages.map((workPackage) => (
                    <SelectItem key={workPackage.id} value={workPackage.id}>
                      {workPackage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="laborWorkDate">Fecha</Label>
              <Input
                id="laborWorkDate"
                type="date"
                value={workDate}
                onChange={(event) => setWorkDate(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="laborHoursWorked">Horas trabajadas</Label>
              <Input
                id="laborHoursWorked"
                type="number"
                min={0}
                step={0.5}
                value={hoursWorked}
                onChange={(event) => setHoursWorked(Number(event.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="laborHourlyRate">Tarifa por hora (USD)</Label>
              <Input
                id="laborHourlyRate"
                type="number"
                min={0}
                step={0.01}
                value={hourlyRate}
                onChange={(event) => setHourlyRate(Number(event.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Estado inicial</Label>
              {canApproveEntries ? (
                <Select
                  value={paymentStatus}
                  onValueChange={(value) => setPaymentStatus(value as LaborPaymentStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      {LABOR_PAYMENT_STATUS_LABELS.pending}
                    </SelectItem>
                    <SelectItem value="approved">
                      {LABOR_PAYMENT_STATUS_LABELS.approved}
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex h-10 items-center rounded-md border px-3 text-sm text-muted-foreground">
                  Pendiente de aprobación
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="laborNotes">Observaciones</Label>
            <Textarea
              id="laborNotes"
              rows={3}
              placeholder="Ej: cuadrilla reducida, horas extra, tarea puntual."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !employeeId}>
              {isSubmitting ? "Guardando..." : "Registrar Mano de Obra"}
            </Button>
          </div>
        </form>

        {canPrepareBatches ? (
          <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Liquidación por lote</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Entradas listas</p>
                    <p className="text-lg font-semibold">
                      {selectedEntriesForBatch.length}
                    </p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Monto seleccionado</p>
                    <p className="text-lg font-semibold">{money(selectedEntriesTotal)}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Disponible</p>
                    <p className="text-lg font-semibold">
                      {approvedUnbatchedEntries.length}
                    </p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Lotes abiertos</p>
                    <p className="text-lg font-semibold">{openBatches.length}</p>
                  </div>
                </div>

                <form className="grid gap-4" onSubmit={handleCreateBatch}>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="batchNumber">Nro. de lote</Label>
                      <Input
                        id="batchNumber"
                        value={batchNumber}
                        onChange={(event) => setBatchNumber(event.target.value)}
                        placeholder="MO-7-001"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="batchPeriodStart">Desde</Label>
                      <Input
                        id="batchPeriodStart"
                        type="date"
                        value={batchPeriodStart}
                        onChange={(event) => setBatchPeriodStart(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="batchPeriodEnd">Hasta</Label>
                      <Input
                        id="batchPeriodEnd"
                        type="date"
                        value={batchPeriodEnd}
                        onChange={(event) => setBatchPeriodEnd(event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="batchNotes">Observaciones del lote</Label>
                    <Textarea
                      id="batchNotes"
                      rows={3}
                      placeholder="Ej: liquidación semanal frente A."
                      value={batchNotes}
                      onChange={(event) => setBatchNotes(event.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Seleccioná desde la tabla las entradas aprobadas que querés liquidar.
                    </p>
                    <Button
                      type="submit"
                      disabled={isCreatingBatch || selectedEntriesForBatch.length === 0}
                    >
                      {isCreatingBatch ? "Creando..." : "Crear Lote"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Flujo administrativo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="rounded-md border p-3">
                  <p className="font-medium">Inspector</p>
                  <p className="text-muted-foreground">
                    Registra horas, tarifa y trazabilidad de campo. No puede marcar pagos.
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="font-medium">PM</p>
                  <p className="text-muted-foreground">
                    Aprueba partes y arma lotes de liquidación con alcance y período.
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="font-medium">Director</p>
                  <p className="text-muted-foreground">
                    Registra el pago real del lote y lo refleja en caja con fecha efectiva.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            Cargando registros de mano de obra...
          </p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay registros de mano de obra cargados para este proyecto.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {canPrepareBatches ? <TableHead>Lote</TableHead> : null}
                    <TableHead>Fecha</TableHead>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Fase</TableHead>
                    <TableHead>Partida</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead>Tarifa</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Batch</TableHead>
                    {canApproveEntries ? <TableHead>Acción</TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => {
                    const batch = entry.paymentBatchId
                      ? batchMap.get(entry.paymentBatchId) ?? null
                      : null;
                    const canSelectForBatch =
                      canPrepareBatches &&
                      entry.paymentStatus === "approved" &&
                      entry.paymentBatchId === null;

                    return (
                      <TableRow key={entry.id}>
                        {canPrepareBatches ? (
                          <TableCell>
                            {canSelectForBatch ? (
                              <Checkbox
                                checked={selectedEntryIds.includes(entry.id)}
                                onCheckedChange={(checked) => {
                                  setSelectedEntryIds((current) =>
                                    checked === true
                                      ? [...current, entry.id]
                                      : current.filter((id) => id !== entry.id)
                                  );
                                }}
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        ) : null}
                        <TableCell>{formatDate(entry.workDate)}</TableCell>
                        <TableCell>
                          {employeeMap.get(entry.employeeId)?.name ??
                            `Empleado ${entry.employeeId}`}
                        </TableCell>
                        <TableCell>
                          {entry.phaseId
                            ? phaseMap.get(entry.phaseId)?.name ?? "Fase"
                            : "General"}
                        </TableCell>
                        <TableCell>
                          {entry.workPackageId
                            ? workPackageMap.get(entry.workPackageId)?.name ?? "Partida"
                            : "Sin partida"}
                        </TableCell>
                        <TableCell>{entry.hoursWorked}</TableCell>
                        <TableCell>{money(entry.hourlyRate)}</TableCell>
                        <TableCell>{money(entry.amountPaid)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(entry.paymentStatus)}>
                            {LABOR_PAYMENT_STATUS_LABELS[entry.paymentStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {batch ? (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{batch.batchNumber}</p>
                              <p className="text-xs text-muted-foreground">
                                {LABOR_PAYMENT_BATCH_STATUS_LABELS[batch.status]}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin lote</span>
                          )}
                        </TableCell>
                        {canApproveEntries ? (
                          <TableCell>
                            {entry.paymentStatus === "pending" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updatingEntryId === entry.id}
                                onClick={() =>
                                  void handleEntryStatusChange(entry.id, "approved")
                                }
                              >
                                Aprobar
                              </Button>
                            ) : entry.paymentStatus === "approved" &&
                              entry.paymentBatchId === null ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={updatingEntryId === entry.id}
                                onClick={() =>
                                  void handleEntryStatusChange(entry.id, "pending")
                                }
                              >
                                Volver
                              </Button>
                            ) : entry.paymentStatus === "paid" ? (
                              <span className="text-xs text-muted-foreground">
                                Pagado {formatDate(entry.paidAt)}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                En lote
                              </span>
                            )}
                          </TableCell>
                        ) : null}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lotes de liquidación</CardTitle>
              </CardHeader>
              <CardContent>
                {batches.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Todavía no hay lotes de liquidación para esta obra.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lote</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Pago</TableHead>
                        {canPayBatches ? <TableHead>Acción</TableHead> : null}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batches.map((batch) => (
                        <TableRow key={batch.id}>
                          <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                          <TableCell>
                            {formatDate(batch.periodStart)} - {formatDate(batch.periodEnd)}
                          </TableCell>
                          <TableCell>{money(batch.totalAmount)}</TableCell>
                          <TableCell>
                            <Badge variant={getBatchBadgeVariant(batch.status)}>
                              {LABOR_PAYMENT_BATCH_STATUS_LABELS[batch.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {batch.status === "paid" ? formatDate(batch.paidAt) : "Pendiente"}
                          </TableCell>
                          {canPayBatches ? (
                            <TableCell>
                              {batch.status === "approved" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={payingBatchId === batch.id}
                                  onClick={() => void handlePayBatch(batch.id)}
                                >
                                  {payingBatchId === batch.id
                                    ? "Registrando..."
                                    : "Registrar pago"}
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  {batch.status === "paid"
                                    ? "Pagado"
                                    : "Completar lote"}
                                </span>
                              )}
                            </TableCell>
                          ) : null}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
