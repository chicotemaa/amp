import { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/auth-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChangeOrdersClientPanel } from "@/components/client-portal/change-orders-client-panel";
import type { ChangeOrder, ChangeOrderStatus } from "@/lib/types/change-order";
import type { Database } from "@/lib/types/supabase";
import { Badge } from "@/components/ui/badge";
import {
  PROJECT_CERTIFICATE_STATUS_LABELS,
  type ProjectCertificateStatus,
} from "@/lib/types/revenue";

export const metadata: Metadata = {
  title: "Portal del Cliente | ArquiManagerPro",
  description: "Seguimiento transparente de obra para clientes",
};

type ClientProjectRow = {
  projects: {
    id: number;
    name: string;
    progress: number | null;
    status: string | null;
    start_date: string | null;
    end_date: string | null;
  } | null;
};

type ChangeOrderRow = Database["public"]["Tables"]["change_orders"]["Row"];
type MilestonePortalRow = {
  id: string;
  project_id: number;
  name: string;
  due_date: string;
  completed_at: string | null;
  status: string;
};

type ReportPortalRow = {
  id: number;
  project_id: number;
  title: string;
  report_date: string;
  status: string;
};

type CertificatePortalRow = {
  id: string;
  project_id: number;
  certificate_number: string;
  description: string;
  issue_date: string;
  due_date: string | null;
  amount: number;
  status: string;
};

type CertificateCollectionPortalRow = {
  id: string;
  certificate_id: string;
  project_id: number;
  amount: number;
  collection_date: string;
  reference: string | null;
};

type ContractPortalRow = {
  id: string;
  project_id: number;
  contract_number: string;
  title: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  original_amount: number;
  published_at: string | null;
};

type ContractAmendmentPortalRow = {
  id: string;
  project_id: number;
  amendment_number: string;
  title: string;
  effective_date: string;
  amount_delta: number;
  days_delta: number;
  published_at: string | null;
};

type ClientRevenueSummary = {
  certifiedAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  certificateCount: number;
};

const money = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

function getCertificateStatusLabel(status: string) {
  return PROJECT_CERTIFICATE_STATUS_LABELS[
    status as ProjectCertificateStatus
  ] ?? status;
}

function mapChangeOrder(row: ChangeOrderRow): ChangeOrder {
  return {
    id: row.id,
    projectId: row.project_id,
    reason: row.reason,
    amountDelta: row.amount_delta,
    daysDelta: row.days_delta,
    status: row.status as ChangeOrderStatus,
    requestedBy: row.requested_by,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    operatorReviewedAt: row.operator_reviewed_at,
    clientComment: row.client_comment,
    clientReviewedAt: row.client_reviewed_at,
    createdAt: row.created_at,
  };
}

export default async function ClientPortalPage() {
  let projects: ClientProjectRow[] = [];
  let pendingChangeOrders: ChangeOrder[] = [];
  let visibleMilestones: MilestonePortalRow[] = [];
  let visibleReports: ReportPortalRow[] = [];
  let visibleCertificates: CertificatePortalRow[] = [];
  let visibleCollections: CertificateCollectionPortalRow[] = [];
  let visibleContracts: ContractPortalRow[] = [];
  let visibleContractAmendments: ContractAmendmentPortalRow[] = [];

  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("client_id")
        .eq("id", user.id)
        .single();

      if (profile?.client_id) {
        const { data } = await supabase
          .from("client_projects")
          .select(
            "projects:project_id ( id, name, progress, status, start_date, end_date )"
          )
          .eq("client_id", profile.client_id);
        projects = (data ?? []) as ClientProjectRow[];

        const projectIds = projects
          .map((row) => row.projects?.id)
          .filter((id): id is number => typeof id === "number");

        if (projectIds.length > 0) {
          const [
            { data: changeOrders },
            { data: milestones },
            { data: reports },
            { data: certificates },
            { data: collections },
            { data: contracts },
            { data: contractAmendments },
          ] = await Promise.all([
            supabase
              .from("change_orders")
              .select("*")
              .in("project_id", projectIds)
              .eq("client_visible", true)
              .eq("status", "pending_client")
              .order("created_at", { ascending: false }),
            (supabase as any)
              .from("milestones")
              .select("id, project_id, name, due_date, completed_at, status")
              .in("project_id", projectIds)
              .eq("is_client_visible", true)
              .order("due_date", { ascending: true }),
            supabase
              .from("reports")
              .select("id, project_id, title, report_date, status")
              .in("project_id", projectIds)
              .eq("is_client_visible", true)
              .order("report_date", { ascending: false }),
            supabase
              .from("project_certificates")
              .select(
                "id, project_id, certificate_number, description, issue_date, due_date, amount, status"
              )
              .in("project_id", projectIds)
              .eq("client_visible", true)
              .order("issue_date", { ascending: false }),
            supabase
              .from("project_certificate_collections")
              .select("id, certificate_id, project_id, amount, collection_date, reference")
              .in("project_id", projectIds)
              .order("collection_date", { ascending: false }),
            supabase
              .from("project_contracts")
              .select(
                "id, project_id, contract_number, title, status, start_date, end_date, original_amount, published_at"
              )
              .in("project_id", projectIds)
              .eq("client_visible", true),
            supabase
              .from("project_contract_amendments")
              .select(
                "id, project_id, amendment_number, title, effective_date, amount_delta, days_delta, published_at"
              )
              .in("project_id", projectIds)
              .eq("client_visible", true)
              .eq("status", "approved")
              .order("effective_date", { ascending: false }),
          ]);

          pendingChangeOrders = ((changeOrders ?? []) as ChangeOrderRow[]).map(mapChangeOrder);
          visibleMilestones = (milestones ?? []) as MilestonePortalRow[];
          visibleReports = (reports ?? []) as ReportPortalRow[];

          visibleCertificates = ((certificates ?? []) as Array<
            Omit<CertificatePortalRow, "amount"> & { amount: number | string }
          >).map((certificate) => ({
            ...certificate,
            amount: Number(certificate.amount ?? 0),
          }));

          visibleCollections = ((collections ?? []) as Array<
            Omit<CertificateCollectionPortalRow, "amount"> & { amount: number | string }
          >).map((collection) => ({
            ...collection,
            amount: Number(collection.amount ?? 0),
          }));

          visibleContracts = ((contracts ?? []) as Array<
            Omit<ContractPortalRow, "original_amount"> & { original_amount: number | string }
          >).map((contract) => ({
            ...contract,
            original_amount: Number(contract.original_amount ?? 0),
          }));

          visibleContractAmendments = ((contractAmendments ?? []) as Array<
            Omit<ContractAmendmentPortalRow, "amount_delta"> & { amount_delta: number | string }
          >).map((amendment) => ({
            ...amendment,
            amount_delta: Number(amendment.amount_delta ?? 0),
          }));
        }
      }
    }
  } catch {
    projects = [];
    pendingChangeOrders = [];
    visibleMilestones = [];
    visibleReports = [];
    visibleCertificates = [];
    visibleCollections = [];
    visibleContracts = [];
    visibleContractAmendments = [];
  }

  const collectionsByCertificate = new Map<string, CertificateCollectionPortalRow[]>();
  for (const collection of visibleCollections) {
    const current = collectionsByCertificate.get(collection.certificate_id) ?? [];
    current.push(collection);
    collectionsByCertificate.set(collection.certificate_id, current);
  }

  const revenueByProject = new Map<number, ClientRevenueSummary>();
  const today = new Date().toISOString().slice(0, 10);

  for (const certificate of visibleCertificates) {
    const paidAmount = (collectionsByCertificate.get(certificate.id) ?? []).reduce(
      (sum, collection) => sum + Number(collection.amount ?? 0),
      0
    );
    const remainingAmount = Math.max(Number(certificate.amount ?? 0) - paidAmount, 0);
    const current = revenueByProject.get(certificate.project_id) ?? {
      certifiedAmount: 0,
      collectedAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
      certificateCount: 0,
    };

    if (!["draft", "cancelled"].includes(certificate.status)) {
      current.certifiedAmount += Number(certificate.amount ?? 0);
      current.pendingAmount += remainingAmount;
      if (certificate.due_date && certificate.due_date < today && remainingAmount > 0) {
        current.overdueAmount += remainingAmount;
      }
    }

    current.collectedAmount += paidAmount;
    current.certificateCount += 1;
    revenueByProject.set(certificate.project_id, current);
  }

  const projectNameById = new Map(
    projects
      .map((row) => row.projects)
      .filter(
        (project): project is NonNullable<ClientProjectRow["projects"]> => project !== null
      )
      .map((project) => [project.id, project.name])
  );
  const visibleContractsByProject = new Map<number, ContractPortalRow>();
  for (const contract of visibleContracts) {
    visibleContractsByProject.set(contract.project_id, contract);
  }
  const visibleContractAmendmentsByProject = new Map<number, ContractAmendmentPortalRow[]>();
  for (const amendment of visibleContractAmendments) {
    const current = visibleContractAmendmentsByProject.get(amendment.project_id) ?? [];
    current.push(amendment);
    visibleContractAmendmentsByProject.set(amendment.project_id, current);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-montserrat text-3xl font-bold tracking-tight mb-2">
          Portal del Cliente
        </h1>
        <p className="text-muted-foreground">
          Avance de tus proyectos, hitos y estado general de obra.
        </p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            No hay proyectos asignados a tu cuenta.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((row) => {
              const project = row.projects;
              if (!project) return null;
              const revenue = revenueByProject.get(project.id);
              const contract = visibleContractsByProject.get(project.id) ?? null;
              const contractAmendments =
                visibleContractAmendmentsByProject.get(project.id) ?? [];
              return (
                <Card key={project.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{project.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Avance general</p>
                      <Progress value={project.progress ?? 0} className="h-2" />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {project.progress ?? 0}% completado
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Estado: {project.status ?? "Sin estado"}
                    </div>
                    <div className="grid gap-2 rounded-md border p-3 text-xs text-muted-foreground sm:grid-cols-3">
                      <div>
                        <p className="mb-1">Certificado</p>
                        <p className="font-medium text-foreground">
                          {money(revenue?.certifiedAmount ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1">Cobrado</p>
                        <p className="font-medium text-foreground">
                          {money(revenue?.collectedAmount ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1">Pendiente</p>
                        <p className="font-medium text-foreground">
                          {money(revenue?.pendingAmount ?? 0)}
                        </p>
                      </div>
                    </div>
                    {contract ? (
                      <div className="rounded-md border p-3 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-medium text-foreground">
                              {contract.contract_number}
                            </p>
                            <p>{contract.title}</p>
                          </div>
                          <Badge variant="outline">{contract.status}</Badge>
                        </div>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <p>Vigente: {money(contract.original_amount)}</p>
                          <p>
                            Publicado:{" "}
                            {contract.published_at
                              ? new Date(contract.published_at).toLocaleDateString("es-AR")
                              : "n/d"}
                          </p>
                          <p>Inicio: {contract.start_date ?? "n/d"}</p>
                          <p>Fin: {contract.end_date ?? "n/d"}</p>
                        </div>
                        {contractAmendments.length > 0 ? (
                          <div className="mt-3 space-y-2">
                            <p className="font-medium text-foreground">
                              Adendas compartidas
                            </p>
                            {contractAmendments.slice(0, 2).map((amendment) => (
                              <div
                                key={amendment.id}
                                className="rounded-md bg-muted/40 px-3 py-2"
                              >
                                <p className="font-medium text-foreground">
                                  {amendment.amendment_number}
                                </p>
                                <p>{amendment.title}</p>
                                <p>
                                  {amendment.amount_delta >= 0 ? "+" : ""}
                                  {money(amendment.amount_delta)} ·{" "}
                                  {amendment.days_delta >= 0 ? "+" : ""}
                                  {amendment.days_delta} día(s)
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Hitos Publicados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {visibleMilestones.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aún no hay hitos publicados para tus proyectos.
                  </p>
                ) : (
                  visibleMilestones.map((milestone) => (
                    <div key={milestone.id} className="rounded-md border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{milestone.name}</p>
                        <Badge variant="outline">{milestone.status}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Objetivo: {new Date(milestone.due_date).toLocaleDateString("es-AR")}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reportes Compartidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {visibleReports.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Todavía no hay reportes publicados para el cliente.
                  </p>
                ) : (
                  visibleReports.map((report) => (
                    <div key={report.id} className="rounded-md border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{report.title}</p>
                        <Badge variant="outline">{report.status}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Fecha: {new Date(report.report_date).toLocaleDateString("es-AR")}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Certificados Compartidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {visibleCertificates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Todavía no hay certificados visibles para el cliente.
                  </p>
                ) : (
                  visibleCertificates.map((certificate) => {
                    const paidAmount = (collectionsByCertificate.get(certificate.id) ?? []).reduce(
                      (sum, collection) => sum + Number(collection.amount ?? 0),
                      0
                    );
                    const remainingAmount = Math.max(
                      Number(certificate.amount ?? 0) - paidAmount,
                      0
                    );

                    return (
                      <div key={certificate.id} className="rounded-md border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">
                              {certificate.certificate_number}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {projectNameById.get(certificate.project_id) ?? "Proyecto"}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {getCertificateStatusLabel(certificate.status)}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm">{certificate.description}</p>
                        <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                          <p>
                            Emitido:{" "}
                            {new Date(certificate.issue_date).toLocaleDateString("es-AR")}
                          </p>
                          <p>
                            {certificate.due_date
                              ? `Vence: ${new Date(certificate.due_date).toLocaleDateString("es-AR")}`
                              : "Sin vencimiento"}
                          </p>
                          <p>Monto: {money(Number(certificate.amount ?? 0))}</p>
                          <p>Saldo: {money(remainingAmount)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cobros Registrados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {visibleCollections.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aún no hay cobros registrados visibles para tus proyectos.
                  </p>
                ) : (
                  visibleCollections.map((collection) => {
                    const certificate = visibleCertificates.find(
                      (currentCertificate) => currentCertificate.id === collection.certificate_id
                    );

                    return (
                      <div key={collection.id} className="rounded-md border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">
                            {money(Number(collection.amount ?? 0))}
                          </p>
                          <Badge variant="outline">
                            {new Date(collection.collection_date).toLocaleDateString("es-AR")}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {certificate?.certificate_number ?? "Certificado"} ·{" "}
                          {projectNameById.get(collection.project_id) ?? "Proyecto"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Referencia: {collection.reference ?? "Sin referencia"}
                        </p>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          <ChangeOrdersClientPanel initialOrders={pendingChangeOrders} />
        </div>
      )}
    </div>
  );
}
