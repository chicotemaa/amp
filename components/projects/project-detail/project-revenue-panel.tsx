"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";
import { getSupabaseAuthBrowserClient } from "@/lib/supabase/auth-browser";
import { getProjectPhasesDb } from "@/lib/api/progress";
import {
  createProjectCertificateCollectionDb,
  createProjectCertificateDb,
  getRevenueOverviewByProjectDb,
  updateProjectCertificateStatusDb,
} from "@/lib/api/revenue";
import type { ProjectPhase } from "@/lib/types/progress";
import type {
  ProjectCertificate,
  ProjectCertificateCollection,
  ProjectCertificateStatus,
  RevenueSummary,
} from "@/lib/types/revenue";
import { PROJECT_CERTIFICATE_STATUS_LABELS } from "@/lib/types/revenue";
import type { AppRole } from "@/lib/auth/roles";
import { can } from "@/lib/auth/roles";

interface ProjectRevenuePanelProps {
  projectId: string;
}

const money = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

function getCertificateBadgeVariant(status: ProjectCertificateStatus) {
  if (status === "cancelled") return "destructive";
  if (status === "collected") return "default";
  if (status === "partially_collected") return "secondary";
  return "outline";
}

export function ProjectRevenuePanel({ projectId }: ProjectRevenuePanelProps) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [role, setRole] = useState<AppRole | null>(null);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [certificates, setCertificates] = useState<ProjectCertificate[]>([]);
  const [collections, setCollections] = useState<ProjectCertificateCollection[]>([]);
  const [summary, setSummary] = useState<RevenueSummary>({
    totalCertificates: 0,
    certifiedAmount: 0,
    collectedAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    partiallyCollectedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submittingCertificate, setSubmittingCertificate] = useState(false);
  const [submittingCollection, setSubmittingCollection] = useState(false);
  const [updatingCertificateId, setUpdatingCertificateId] = useState<string | null>(null);

  const [certificateNumber, setCertificateNumber] = useState("");
  const [certificateDescription, setCertificateDescription] = useState("");
  const [certificatePhaseId, setCertificatePhaseId] = useState<string>("none");
  const [certificateIssueDate, setCertificateIssueDate] = useState(today);
  const [certificateDueDate, setCertificateDueDate] = useState("");
  const [certificateAmount, setCertificateAmount] = useState(0);
  const [certificateStatus, setCertificateStatus] =
    useState<ProjectCertificateStatus>("issued");
  const [certificateClientVisible, setCertificateClientVisible] = useState("yes");
  const [certificateNotes, setCertificateNotes] = useState("");

  const [collectionCertificateId, setCollectionCertificateId] = useState<string>("none");
  const [collectionAmount, setCollectionAmount] = useState(0);
  const [collectionDate, setCollectionDate] = useState(today);
  const [collectionReference, setCollectionReference] = useState("");
  const [collectionNotes, setCollectionNotes] = useState("");

  const canManageRevenue = can(role, "budget.edit");
  const payableCertificates = useMemo(
    () =>
      certificates.filter(
        (certificate) =>
          !["draft", "cancelled", "collected"].includes(certificate.status) &&
          certificate.remainingAmount > 0
      ),
    [certificates]
  );
  const selectedCollectionCertificate = useMemo(
    () =>
      collectionCertificateId !== "none"
        ? certificates.find((certificate) => certificate.id === collectionCertificateId) ?? null
        : null,
    [certificates, collectionCertificateId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    const [phasesData, revenueData] = await Promise.all([
      getProjectPhasesDb(Number(projectId)),
      getRevenueOverviewByProjectDb(Number(projectId)),
    ]);
    setPhases(phasesData);
    setCertificates(revenueData.certificates);
    setCollections(revenueData.collections);
    setSummary(revenueData.summary);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void load();

    const handleUpdated = () => {
      void load();
    };

    window.addEventListener("projectRevenueUpdated", handleUpdated);
    return () => window.removeEventListener("projectRevenueUpdated", handleUpdated);
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

  useEffect(() => {
    if (payableCertificates.length === 0) {
      setCollectionCertificateId("none");
      setCollectionAmount(0);
      return;
    }

    if (
      collectionCertificateId === "none" ||
      !payableCertificates.some((certificate) => certificate.id === collectionCertificateId)
    ) {
      setCollectionCertificateId(payableCertificates[0].id);
      setCollectionAmount(payableCertificates[0].remainingAmount);
    }
  }, [collectionCertificateId, payableCertificates]);

  useEffect(() => {
    if (!selectedCollectionCertificate) return;
    setCollectionAmount(selectedCollectionCertificate.remainingAmount);
  }, [selectedCollectionCertificate]);

  const handleCreateCertificate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageRevenue || !certificateNumber.trim() || !certificateDescription.trim()) return;

    setSubmittingCertificate(true);
    try {
      await createProjectCertificateDb({
        projectId: Number(projectId),
        phaseId: certificatePhaseId === "none" ? null : certificatePhaseId,
        certificateNumber: certificateNumber.trim(),
        description: certificateDescription.trim(),
        issueDate: certificateIssueDate,
        dueDate: certificateDueDate || null,
        amount: certificateAmount,
        status: certificateStatus,
        clientVisible: certificateClientVisible === "yes",
        notes: certificateNotes.trim() || null,
        createdBy: employeeId,
      });
      toast.success("Certificado emitido.");
      setCertificateNumber("");
      setCertificateDescription("");
      setCertificatePhaseId("none");
      setCertificateIssueDate(today);
      setCertificateDueDate("");
      setCertificateAmount(0);
      setCertificateStatus("issued");
      setCertificateClientVisible("yes");
      setCertificateNotes("");
      await load();
      window.dispatchEvent(new Event("projectRevenueUpdated"));
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo emitir el certificado.");
    } finally {
      setSubmittingCertificate(false);
    }
  };

  const handleCreateCollection = async (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !canManageRevenue ||
      !selectedCollectionCertificate ||
      collectionAmount <= 0 ||
      collectionAmount > selectedCollectionCertificate.remainingAmount
    ) {
      return;
    }

    setSubmittingCollection(true);
    try {
      await createProjectCertificateCollectionDb({
        certificateId: selectedCollectionCertificate.id,
        amount: collectionAmount,
        collectionDate,
        reference: collectionReference.trim() || null,
        notes: collectionNotes.trim() || null,
        createdBy: employeeId,
      });
      toast.success("Cobro registrado.");
      setCollectionReference("");
      setCollectionNotes("");
      await load();
      window.dispatchEvent(new Event("projectRevenueUpdated"));
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo registrar el cobro.");
    } finally {
      setSubmittingCollection(false);
    }
  };

  const handleCertificateStatusChange = async (
    certificate: ProjectCertificate,
    status: ProjectCertificateStatus
  ) => {
    setUpdatingCertificateId(certificate.id);
    try {
      await updateProjectCertificateStatusDb(certificate.id, status);
      toast.success(
        status === "issued"
          ? "Certificado emitido."
          : status === "cancelled"
            ? "Certificado cancelado."
            : "Certificado actualizado."
      );
      await load();
      window.dispatchEvent(new Event("projectRevenueUpdated"));
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo actualizar el certificado.");
    } finally {
      setUpdatingCertificateId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Facturación y Cobros</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando certificados y cobros...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Facturación y Cobros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-5">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Certificado</p>
            <p className="text-xl font-semibold">{money(summary.certifiedAmount)}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Cobrado</p>
            <p className="text-xl font-semibold">{money(summary.collectedAmount)}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Pendiente</p>
            <p className="text-xl font-semibold">{money(summary.pendingAmount)}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Vencido</p>
            <p className="text-xl font-semibold">{money(summary.overdueAmount)}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Cobros parciales</p>
            <p className="text-xl font-semibold">{summary.partiallyCollectedCount}</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-md border p-4">
            <div className="mb-3">
              <h4 className="font-medium">Emitir certificado</h4>
              <p className="text-sm text-muted-foreground">
                Registro formal de avance certificado para facturación/cobro.
              </p>
            </div>

            {!canManageRevenue ? (
              <p className="text-sm text-muted-foreground">
                Solo dirección o PM pueden emitir certificados.
              </p>
            ) : (
              <form className="grid gap-3" onSubmit={handleCreateCertificate}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="certificateNumber">Nro. certificado</Label>
                    <Input
                      id="certificateNumber"
                      value={certificateNumber}
                      onChange={(event) => setCertificateNumber(event.target.value)}
                      placeholder="Ej: CERT-2026-004"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Fase</Label>
                    <Select value={certificatePhaseId} onValueChange={setCertificatePhaseId}>
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
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="certificateDescription">Descripción</Label>
                  <Input
                    id="certificateDescription"
                    value={certificateDescription}
                    onChange={(event) => setCertificateDescription(event.target.value)}
                    placeholder="Ej: Certificación avance mes marzo"
                    required
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="certificateIssueDate">Fecha emisión</Label>
                    <Input
                      id="certificateIssueDate"
                      type="date"
                      value={certificateIssueDate}
                      onChange={(event) => setCertificateIssueDate(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="certificateDueDate">Vencimiento</Label>
                    <Input
                      id="certificateDueDate"
                      type="date"
                      value={certificateDueDate}
                      onChange={(event) => setCertificateDueDate(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="certificateAmount">Monto</Label>
                    <Input
                      id="certificateAmount"
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={certificateAmount}
                      onChange={(event) => setCertificateAmount(Number(event.target.value))}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Estado inicial</Label>
                    <Select
                      value={certificateStatus}
                      onValueChange={(value) =>
                        setCertificateStatus(value as ProjectCertificateStatus)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Borrador</SelectItem>
                        <SelectItem value="issued">Emitido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Visible para cliente</Label>
                    <Select
                      value={certificateClientVisible}
                      onValueChange={setCertificateClientVisible}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Sí</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="certificateNotes">Notas</Label>
                  <Textarea
                    id="certificateNotes"
                    rows={2}
                    value={certificateNotes}
                    onChange={(event) => setCertificateNotes(event.target.value)}
                    placeholder="Detalle de certificación, observaciones o alcance"
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={submittingCertificate}>
                    {submittingCertificate ? "Guardando..." : "Emitir Certificado"}
                  </Button>
                </div>
              </form>
            )}
          </div>

          <div className="rounded-md border p-4">
            <div className="mb-3">
              <h4 className="font-medium">Registrar cobro</h4>
              <p className="text-sm text-muted-foreground">
                Cobros parciales o totales asociados al certificado emitido.
              </p>
            </div>

            {!canManageRevenue ? (
              <p className="text-sm text-muted-foreground">
                Solo dirección o PM pueden registrar cobros.
              </p>
            ) : payableCertificates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay certificados emitidos con saldo pendiente.
              </p>
            ) : (
              <form className="grid gap-3" onSubmit={handleCreateCollection}>
                <div className="space-y-1.5">
                  <Label>Certificado</Label>
                  <Select value={collectionCertificateId} onValueChange={setCollectionCertificateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar certificado" />
                    </SelectTrigger>
                    <SelectContent>
                      {payableCertificates.map((certificate) => (
                        <SelectItem key={certificate.id} value={certificate.id}>
                          {certificate.certificateNumber} · saldo {money(certificate.remainingAmount)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="collectionAmount">Monto</Label>
                    <Input
                      id="collectionAmount"
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={collectionAmount}
                      onChange={(event) => setCollectionAmount(Number(event.target.value))}
                      max={selectedCollectionCertificate?.remainingAmount ?? undefined}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="collectionDate">Fecha cobro</Label>
                    <Input
                      id="collectionDate"
                      type="date"
                      value={collectionDate}
                      onChange={(event) => setCollectionDate(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="collectionReference">Referencia</Label>
                    <Input
                      id="collectionReference"
                      value={collectionReference}
                      onChange={(event) => setCollectionReference(event.target.value)}
                      placeholder="Transferencia / recibo / cheque"
                    />
                  </div>
                  <div className="rounded-md border px-3 py-2 text-sm">
                    <p className="text-xs text-muted-foreground">Saldo restante estimado</p>
                    <p className="font-medium">
                      {money(
                        Math.max(
                          (selectedCollectionCertificate?.remainingAmount ?? 0) -
                            Number(collectionAmount || 0),
                          0
                        )
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="collectionNotes">Notas</Label>
                  <Textarea
                    id="collectionNotes"
                    rows={2}
                    value={collectionNotes}
                    onChange={(event) => setCollectionNotes(event.target.value)}
                    placeholder="Detalle del cobro"
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={submittingCollection}>
                    {submittingCollection ? "Guardando..." : "Registrar Cobro"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-md border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-medium">Certificados</h4>
              <p className="text-xs text-muted-foreground">{certificates.length} emitidos</p>
            </div>

            {certificates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todavía no hay certificados emitidos para esta obra.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Cobrado / saldo</TableHead>
                    <TableHead>Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((certificate) => {
                    const canEmit = canManageRevenue && certificate.status === "draft";
                    const canCancel =
                      canManageRevenue &&
                      certificate.status === "issued" &&
                      certificate.paidAmount === 0;

                    return (
                      <TableRow key={certificate.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{certificate.certificateNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              {certificate.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {certificate.dueDate
                                ? certificate.dueDate < today &&
                                  certificate.remainingAmount > 0
                                  ? `Vencido ${certificate.dueDate}`
                                  : `Vence ${certificate.dueDate}`
                                : "Sin vencimiento"}
                              {" · "}
                              {certificate.clientVisible ? "Visible cliente" : "Interno"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getCertificateBadgeVariant(certificate.status)}>
                            {PROJECT_CERTIFICATE_STATUS_LABELS[certificate.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>{money(certificate.amount)}</TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            <p>{money(certificate.paidAmount)} cobrado</p>
                            <p>{money(certificate.remainingAmount)} saldo</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {canEmit ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingCertificateId === certificate.id}
                              onClick={() =>
                                void handleCertificateStatusChange(certificate, "issued")
                              }
                            >
                              {updatingCertificateId === certificate.id
                                ? "Actualizando..."
                                : "Emitir"}
                            </Button>
                          ) : canCancel ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingCertificateId === certificate.id}
                              onClick={() =>
                                void handleCertificateStatusChange(certificate, "cancelled")
                              }
                            >
                              {updatingCertificateId === certificate.id
                                ? "Actualizando..."
                                : "Cancelar"}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin acción</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="rounded-md border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-medium">Últimos cobros</h4>
              <p className="text-xs text-muted-foreground">{collections.length} registros</p>
            </div>

            {collections.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no hay cobros registrados para esta obra.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Certificado</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Referencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collections.slice(0, 8).map((collection) => {
                    const certificate = certificates.find(
                      (currentCertificate) => currentCertificate.id === collection.certificateId
                    );

                    return (
                      <TableRow key={collection.id}>
                        <TableCell>{collection.collectionDate}</TableCell>
                        <TableCell>
                          {certificate?.certificateNumber ?? collection.certificateId}
                        </TableCell>
                        <TableCell>{money(collection.amount)}</TableCell>
                        <TableCell>{collection.reference ?? "Sin referencia"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
