"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  createProjectContractAmendmentDb,
  createProjectContractDb,
  getProjectContractOverviewByProjectDb,
  updateProjectContractAmendmentClientVisibilityDb,
  updateProjectContractAmendmentStatusDb,
  updateProjectContractClientVisibilityDb,
  updateProjectContractStatusDb,
} from "@/lib/api/contracts";
import type { AppRole } from "@/lib/auth/roles";
import { can } from "@/lib/auth/roles";
import { getSupabaseAuthBrowserClient } from "@/lib/supabase/auth-browser";
import type {
  ProjectContract,
  ProjectContractAmendment,
  ProjectContractAmendmentStatus,
  ProjectContractAmendmentType,
  ProjectContractSummary,
  ProjectContractStatus,
} from "@/lib/types/contracts";
import {
  PROJECT_CONTRACT_AMENDMENT_STATUS_LABELS,
  PROJECT_CONTRACT_AMENDMENT_TYPE_LABELS,
  PROJECT_CONTRACT_STATUS_LABELS,
} from "@/lib/types/contracts";

interface ProjectContractPanelProps {
  projectId: string;
}

const money = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

function getContractBadgeVariant(status: ProjectContractStatus) {
  if (status === "terminated") return "destructive";
  if (status === "active" || status === "completed") return "secondary";
  return "outline";
}

function getAmendmentBadgeVariant(status: ProjectContractAmendmentStatus) {
  if (status === "approved") return "secondary";
  if (status === "rejected" || status === "cancelled") return "destructive";
  return "outline";
}

export function ProjectContractPanel({ projectId }: ProjectContractPanelProps) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [role, setRole] = useState<AppRole | null>(null);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [contract, setContract] = useState<ProjectContract | null>(null);
  const [amendments, setAmendments] = useState<ProjectContractAmendment[]>([]);
  const [summary, setSummary] = useState<ProjectContractSummary>({
    configured: false,
    contractStatus: null,
    originalAmount: 0,
    currentAmount: 0,
    approvedAmountDelta: 0,
    approvedDaysDelta: 0,
    pendingAmountDelta: 0,
    pendingDaysDelta: 0,
    pendingAmendmentsCount: 0,
    certifiedCoveragePct: null,
    collectedCoveragePct: null,
    projectedMargin: null,
    cashMargin: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingContract, setIsSubmittingContract] = useState(false);
  const [isSubmittingAmendment, setIsSubmittingAmendment] = useState(false);
  const [updatingContractStatus, setUpdatingContractStatus] = useState(false);
  const [updatingAmendmentId, setUpdatingAmendmentId] = useState<string | null>(null);

  const [contractNumber, setContractNumber] = useState("");
  const [contractTitle, setContractTitle] = useState("");
  const [contractStatus, setContractStatus] =
    useState<ProjectContractStatus>("active");
  const [contractSignedDate, setContractSignedDate] = useState(today);
  const [contractStartDate, setContractStartDate] = useState(today);
  const [contractEndDate, setContractEndDate] = useState("");
  const [contractAmount, setContractAmount] = useState(0);
  const [contractNotes, setContractNotes] = useState("");

  const [amendmentNumber, setAmendmentNumber] = useState("");
  const [amendmentTitle, setAmendmentTitle] = useState("");
  const [amendmentType, setAmendmentType] =
    useState<ProjectContractAmendmentType>("scope_adjustment");
  const [amendmentStatus, setAmendmentStatus] =
    useState<ProjectContractAmendmentStatus>("draft");
  const [amendmentDate, setAmendmentDate] = useState(today);
  const [amendmentAmountDelta, setAmendmentAmountDelta] = useState(0);
  const [amendmentDaysDelta, setAmendmentDaysDelta] = useState(0);
  const [amendmentDescription, setAmendmentDescription] = useState("");

  const canManageContracts = can(role, "budget.edit") || can(role, "projects.edit");
  const canPublishContracts = can(role, "client_publication.manage");
  const canApproveAmendments = canPublishContracts;

  const load = useCallback(async () => {
    setIsLoading(true);
    const data = await getProjectContractOverviewByProjectDb(Number(projectId));
    setContract(data.contract);
    setAmendments(data.amendments);
    setSummary(data.summary);
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    void load();

    const handleUpdated = () => {
      void load();
    };

    window.addEventListener("projectContractsUpdated", handleUpdated);
    window.addEventListener("projectRevenueUpdated", handleUpdated);
    window.addEventListener("projectLaborUpdated", handleUpdated);
    window.addEventListener("projectProcurementUpdated", handleUpdated);

    return () => {
      window.removeEventListener("projectContractsUpdated", handleUpdated);
      window.removeEventListener("projectRevenueUpdated", handleUpdated);
      window.removeEventListener("projectLaborUpdated", handleUpdated);
      window.removeEventListener("projectProcurementUpdated", handleUpdated);
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

      setEmployeeId(profile?.employee_id ?? null);
      setRole((profile?.role as AppRole | null) ?? null);
    };

    void loadProfile();
  }, []);

  const handleCreateContract = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageContracts || contract || !contractNumber.trim() || !contractTitle.trim()) return;

    setIsSubmittingContract(true);
    try {
      await createProjectContractDb({
        projectId: Number(projectId),
        contractNumber: contractNumber.trim(),
        title: contractTitle.trim(),
        status: contractStatus,
        signedDate: contractSignedDate || null,
        startDate: contractStartDate || null,
        endDate: contractEndDate || null,
        originalAmount: contractAmount,
        clientVisible: false,
        notes: contractNotes.trim() || null,
        createdBy: employeeId,
      });
      toast.success("Contrato base registrado.");
      setContractNumber("");
      setContractTitle("");
      setContractStatus("active");
      setContractSignedDate(today);
      setContractStartDate(today);
      setContractEndDate("");
      setContractAmount(0);
      setContractNotes("");
      await load();
      window.dispatchEvent(new Event("projectContractsUpdated"));
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo registrar el contrato.");
    } finally {
      setIsSubmittingContract(false);
    }
  };

  const handleCreateAmendment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageContracts || !contract || !amendmentNumber.trim() || !amendmentTitle.trim()) return;

    setIsSubmittingAmendment(true);
    try {
      const nextStatus = canApproveAmendments ? amendmentStatus : "draft";
      await createProjectContractAmendmentDb({
        contractId: contract.id,
        amendmentNumber: amendmentNumber.trim(),
        title: amendmentTitle.trim(),
        amendmentType,
        status: nextStatus,
        effectiveDate: amendmentDate,
        amountDelta: amendmentAmountDelta,
        daysDelta: amendmentDaysDelta,
        clientVisible: false,
        description: amendmentDescription.trim() || null,
        createdBy: employeeId,
      });
      toast.success("Adenda registrada.");
      setAmendmentNumber("");
      setAmendmentTitle("");
      setAmendmentType("scope_adjustment");
      setAmendmentStatus("draft");
      setAmendmentDate(today);
      setAmendmentAmountDelta(0);
      setAmendmentDaysDelta(0);
      setAmendmentDescription("");
      await load();
      window.dispatchEvent(new Event("projectContractsUpdated"));
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo registrar la adenda.");
    } finally {
      setIsSubmittingAmendment(false);
    }
  };

  const handleContractStatusChange = async (status: ProjectContractStatus) => {
    if (!contract) return;
    setUpdatingContractStatus(true);
    try {
      await updateProjectContractStatusDb(contract.id, status);
      toast.success("Estado contractual actualizado.");
      await load();
      window.dispatchEvent(new Event("projectContractsUpdated"));
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo actualizar el contrato.");
    } finally {
      setUpdatingContractStatus(false);
    }
  };

  const handleContractVisibilityChange = async (clientVisible: boolean) => {
    if (!contract) return;
    setUpdatingContractStatus(true);
    try {
      await updateProjectContractClientVisibilityDb(contract.id, clientVisible);
      toast.success(
        clientVisible
          ? "Contrato publicado en el portal del cliente."
          : "Contrato ocultado del portal del cliente."
      );
      await load();
      window.dispatchEvent(new Event("projectContractsUpdated"));
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo actualizar la publicación contractual.");
    } finally {
      setUpdatingContractStatus(false);
    }
  };

  const handleAmendmentStatusChange = async (
    amendment: ProjectContractAmendment,
    status: ProjectContractAmendmentStatus
  ) => {
    setUpdatingAmendmentId(amendment.id);
    try {
      await updateProjectContractAmendmentStatusDb(amendment.id, status);
      toast.success("Estado de adenda actualizado.");
      await load();
      window.dispatchEvent(new Event("projectContractsUpdated"));
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo actualizar la adenda.");
    } finally {
      setUpdatingAmendmentId(null);
    }
  };

  const handleAmendmentVisibilityChange = async (
    amendment: ProjectContractAmendment,
    clientVisible: boolean
  ) => {
    setUpdatingAmendmentId(amendment.id);
    try {
      await updateProjectContractAmendmentClientVisibilityDb(amendment.id, clientVisible);
      toast.success(
        clientVisible
          ? "Adenda publicada en el portal del cliente."
          : "Adenda ocultada del portal del cliente."
      );
      await load();
      window.dispatchEvent(new Event("projectContractsUpdated"));
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo actualizar la visibilidad de la adenda.");
    } finally {
      setUpdatingAmendmentId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contrato y Adendas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando estructura contractual...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Contrato y Adendas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-5">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Contrato vigente</p>
            <p className="text-lg font-semibold">
              {summary.configured ? money(summary.currentAmount) : "Sin contrato"}
            </p>
            <p className="text-xs text-muted-foreground">
              Base {money(summary.originalAmount)}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Adendas aprobadas</p>
            <p className="text-lg font-semibold">
              {summary.approvedAmountDelta >= 0 ? "+" : ""}
              {money(summary.approvedAmountDelta)}
            </p>
            <p className="text-xs text-muted-foreground">
              {summary.approvedDaysDelta >= 0 ? "+" : ""}
              {summary.approvedDaysDelta} día(s)
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Adendas pendientes</p>
            <p className="text-lg font-semibold">{summary.pendingAmendmentsCount}</p>
            <p className="text-xs text-muted-foreground">
              {summary.pendingAmountDelta >= 0 ? "+" : ""}
              {money(summary.pendingAmountDelta)} · {summary.pendingDaysDelta >= 0 ? "+" : ""}
              {summary.pendingDaysDelta} día(s)
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Cobertura contractual</p>
            <p className="text-lg font-semibold">
              {summary.certifiedCoveragePct?.toFixed(1) ?? "n/d"}%
            </p>
            <p className="text-xs text-muted-foreground">
              Cobrado {summary.collectedCoveragePct?.toFixed(1) ?? "n/d"}%
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Margen proyectado</p>
            <p className="text-lg font-semibold">
              {summary.projectedMargin !== null ? money(summary.projectedMargin) : "n/d"}
            </p>
            <p className="text-xs text-muted-foreground">
              Caja real {summary.cashMargin !== null ? money(summary.cashMargin) : "n/d"}
            </p>
          </div>
        </div>

        {contract ? (
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{contract.contractNumber}</p>
                  <Badge variant={getContractBadgeVariant(contract.status)}>
                    {PROJECT_CONTRACT_STATUS_LABELS[contract.status]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{contract.title}</p>
                <p className="text-xs text-muted-foreground">
                  Firma {contract.signedDate ?? "n/d"} · Inicio {contract.startDate ?? "n/d"} · Fin{" "}
                  {contract.endDate ?? "n/d"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {contract.clientVisible
                    ? `Publicado al cliente${contract.publishedAt ? ` · ${new Date(contract.publishedAt).toLocaleString("es-AR")}` : ""}`
                    : "Uso interno. Todavía no está publicado al cliente."}
                </p>
              </div>
              {canManageContracts ? (
                <div className="flex flex-wrap gap-2">
                  {contract.status !== "active" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingContractStatus}
                      onClick={() => void handleContractStatusChange("active")}
                    >
                      Activar
                    </Button>
                  ) : null}
                  {contract.status !== "suspended" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingContractStatus}
                      onClick={() => void handleContractStatusChange("suspended")}
                    >
                      Suspender
                    </Button>
                  ) : null}
                  {contract.status !== "completed" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingContractStatus}
                      onClick={() => void handleContractStatusChange("completed")}
                    >
                      Completar
                    </Button>
                  ) : null}
                  {contract.status !== "terminated" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingContractStatus}
                      onClick={() => void handleContractStatusChange("terminated")}
                    >
                      Terminar
                    </Button>
                  ) : null}
                  {canPublishContracts &&
                  ["active", "completed"].includes(contract.status) &&
                  !contract.clientVisible ? (
                    <Button
                      size="sm"
                      disabled={updatingContractStatus}
                      onClick={() => void handleContractVisibilityChange(true)}
                    >
                      Publicar al cliente
                    </Button>
                  ) : null}
                  {canPublishContracts && contract.clientVisible ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingContractStatus}
                      onClick={() => void handleContractVisibilityChange(false)}
                    >
                      Ocultar del portal
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>

            {contract.notes ? <p className="text-sm">{contract.notes}</p> : null}
          </div>
        ) : canManageContracts ? (
          <form className="grid gap-4 rounded-lg border p-4" onSubmit={handleCreateContract}>
            <div>
              <p className="text-sm font-semibold">Alta de contrato base</p>
              <p className="text-xs text-muted-foreground">
                Configura el marco contractual sobre el que después se emitirán certificados y adendas.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="contractNumber">Número de contrato</Label>
                <Input
                  id="contractNumber"
                  value={contractNumber}
                  onChange={(event) => setContractNumber(event.target.value)}
                  placeholder="CT-2026-001"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contractTitle">Título</Label>
                <Input
                  id="contractTitle"
                  value={contractTitle}
                  onChange={(event) => setContractTitle(event.target.value)}
                  placeholder="Contrato principal de obra"
                  required
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select
                  value={contractStatus}
                  onValueChange={(value) => setContractStatus(value as ProjectContractStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROJECT_CONTRACT_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contractSignedDate">Firma</Label>
                <Input
                  id="contractSignedDate"
                  type="date"
                  value={contractSignedDate}
                  onChange={(event) => setContractSignedDate(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contractStartDate">Inicio</Label>
                <Input
                  id="contractStartDate"
                  type="date"
                  value={contractStartDate}
                  onChange={(event) => setContractStartDate(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contractEndDate">Fin previsto</Label>
                <Input
                  id="contractEndDate"
                  type="date"
                  value={contractEndDate}
                  onChange={(event) => setContractEndDate(event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[240px_1fr]">
              <div className="space-y-1.5">
                <Label htmlFor="contractAmount">Monto original</Label>
                <Input
                  id="contractAmount"
                  type="number"
                  min={0}
                  step={0.01}
                  value={contractAmount}
                  onChange={(event) => setContractAmount(Number(event.target.value))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contractNotes">Notas</Label>
                <Textarea
                  id="contractNotes"
                  rows={3}
                  value={contractNotes}
                  onChange={(event) => setContractNotes(event.target.value)}
                  placeholder="Alcance base, forma de pago, observaciones."
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmittingContract}>
                {isSubmittingContract ? "Guardando..." : "Crear contrato base"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Este proyecto todavía no tiene contrato base configurado.
          </div>
        )}

        {contract ? (
          <>
            {canManageContracts ? (
              <form className="grid gap-4 rounded-lg border p-4" onSubmit={handleCreateAmendment}>
                <div>
                  <p className="text-sm font-semibold">Nueva adenda</p>
                  <p className="text-xs text-muted-foreground">
                    Ajusta monto y plazo contractual sin perder trazabilidad comercial.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PM prepara y envia. Dirección aprueba y decide qué se publica al cliente.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="amendmentNumber">Número de adenda</Label>
                    <Input
                      id="amendmentNumber"
                      value={amendmentNumber}
                      onChange={(event) => setAmendmentNumber(event.target.value)}
                      placeholder="AD-01"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="amendmentTitle">Título</Label>
                    <Input
                      id="amendmentTitle"
                      value={amendmentTitle}
                      onChange={(event) => setAmendmentTitle(event.target.value)}
                      placeholder="Ampliación de alcance"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label>Tipo</Label>
                    <Select
                      value={amendmentType}
                      onValueChange={(value) =>
                        setAmendmentType(value as ProjectContractAmendmentType)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PROJECT_CONTRACT_AMENDMENT_TYPE_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {canApproveAmendments ? (
                    <div className="space-y-1.5">
                      <Label>Estado inicial</Label>
                      <Select
                        value={amendmentStatus}
                        onValueChange={(value) =>
                          setAmendmentStatus(value as ProjectContractAmendmentStatus)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PROJECT_CONTRACT_AMENDMENT_STATUS_LABELS).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label>Estado inicial</Label>
                      <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                        Borrador interno. Luego se envía a Dirección para aprobación.
                      </div>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="amendmentDate">Fecha efectiva</Label>
                    <Input
                      id="amendmentDate"
                      type="date"
                      value={amendmentDate}
                      onChange={(event) => setAmendmentDate(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="amendmentDaysDelta">Delta plazo</Label>
                    <Input
                      id="amendmentDaysDelta"
                      type="number"
                      step={1}
                      value={amendmentDaysDelta}
                      onChange={(event) => setAmendmentDaysDelta(Number(event.target.value))}
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-[240px_1fr]">
                  <div className="space-y-1.5">
                    <Label htmlFor="amendmentAmountDelta">Delta monto</Label>
                    <Input
                      id="amendmentAmountDelta"
                      type="number"
                      step={0.01}
                      value={amendmentAmountDelta}
                      onChange={(event) => setAmendmentAmountDelta(Number(event.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="amendmentDescription">Descripción</Label>
                    <Textarea
                      id="amendmentDescription"
                      rows={3}
                      value={amendmentDescription}
                      onChange={(event) => setAmendmentDescription(event.target.value)}
                      placeholder="Justificación comercial, técnica o contractual."
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmittingAmendment}>
                    {isSubmittingAmendment ? "Guardando..." : "Registrar adenda"}
                  </Button>
                </div>
              </form>
            ) : null}

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">Historial contractual</p>
                  <p className="text-xs text-muted-foreground">
                    {amendments.length} adenda(s) registradas
                  </p>
                </div>
              </div>

              {amendments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay adendas registradas para este contrato.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Adenda</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Impacto</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {amendments.map((amendment) => {
                      const canSubmit = canManageContracts && amendment.status === "draft";
                      const canApprove =
                        canApproveAmendments && amendment.status === "submitted";
                      const canCancel =
                        canManageContracts && ["draft", "submitted"].includes(amendment.status);
                      const canPublish =
                        canPublishContracts && amendment.status === "approved";

                      return (
                        <TableRow key={amendment.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{amendment.amendmentNumber}</p>
                              <p className="text-xs text-muted-foreground">
                                {amendment.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Efectiva {amendment.effectiveDate}
                              </p>
                              {amendment.submittedAt ? (
                                <p className="text-xs text-muted-foreground">
                                  Enviada {new Date(amendment.submittedAt).toLocaleString("es-AR")}
                                </p>
                              ) : null}
                              {amendment.approvedAt ? (
                                <p className="text-xs text-muted-foreground">
                                  Aprobada {new Date(amendment.approvedAt).toLocaleString("es-AR")}
                                </p>
                              ) : null}
                              <p className="text-xs text-muted-foreground">
                                {amendment.clientVisible
                                  ? `Visible al cliente${amendment.publishedAt ? ` · ${new Date(amendment.publishedAt).toLocaleString("es-AR")}` : ""}`
                                  : "No publicada al cliente"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {PROJECT_CONTRACT_AMENDMENT_TYPE_LABELS[amendment.amendmentType]}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getAmendmentBadgeVariant(amendment.status)}>
                              {PROJECT_CONTRACT_AMENDMENT_STATUS_LABELS[amendment.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-muted-foreground">
                              <p>
                                {amendment.amountDelta >= 0 ? "+" : ""}
                                {money(amendment.amountDelta)}
                              </p>
                              <p>
                                {amendment.daysDelta >= 0 ? "+" : ""}
                                {amendment.daysDelta} día(s)
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              {canSubmit ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={updatingAmendmentId === amendment.id}
                                  onClick={() =>
                                    void handleAmendmentStatusChange(amendment, "submitted")
                                  }
                                >
                                  Enviar
                                </Button>
                              ) : null}
                              {canApprove ? (
                                <Button
                                  size="sm"
                                  disabled={updatingAmendmentId === amendment.id}
                                  onClick={() =>
                                    void handleAmendmentStatusChange(amendment, "approved")
                                  }
                                >
                                  Aprobar
                                </Button>
                              ) : null}
                              {canApprove ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={updatingAmendmentId === amendment.id}
                                  onClick={() =>
                                    void handleAmendmentStatusChange(amendment, "rejected")
                                  }
                                >
                                  Rechazar
                                </Button>
                              ) : null}
                              {canCancel ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={updatingAmendmentId === amendment.id}
                                  onClick={() =>
                                    void handleAmendmentStatusChange(amendment, "cancelled")
                                  }
                                >
                                  Cancelar
                                </Button>
                              ) : null}
                              {canPublish && !amendment.clientVisible ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={updatingAmendmentId === amendment.id}
                                  onClick={() =>
                                    void handleAmendmentVisibilityChange(amendment, true)
                                  }
                                >
                                  Publicar
                                </Button>
                              ) : null}
                              {canPublish && amendment.clientVisible ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={updatingAmendmentId === amendment.id}
                                  onClick={() =>
                                    void handleAmendmentVisibilityChange(amendment, false)
                                  }
                                >
                                  Ocultar
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
