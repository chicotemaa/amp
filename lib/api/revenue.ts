import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/types/supabase";
import { logCurrentUserAuditEvent } from "@/lib/api/audit";
import type {
  ProjectCertificate,
  ProjectCertificateCollection,
  ProjectCertificateStatus,
  RevenueSummary,
} from "@/lib/types/revenue";

type ProjectCertificateRow = Database["public"]["Tables"]["project_certificates"]["Row"];
type ProjectCertificateCollectionRow =
  Database["public"]["Tables"]["project_certificate_collections"]["Row"];

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function mapCollection(
  row: ProjectCertificateCollectionRow
): ProjectCertificateCollection {
  return {
    id: row.id,
    certificateId: row.certificate_id,
    projectId: row.project_id,
    amount: Number(row.amount),
    collectionDate: row.collection_date,
    reference: row.reference,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function mapCertificate(row: ProjectCertificateRow): ProjectCertificate {
  return {
    id: row.id,
    projectId: row.project_id,
    phaseId: row.phase_id,
    certificateNumber: row.certificate_number,
    description: row.description,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    amount: Number(row.amount),
    status: row.status as ProjectCertificateStatus,
    clientVisible: row.client_visible,
    paidAmount: 0,
    remainingAmount: Number(row.amount),
    collectionCount: 0,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function enrichCertificates(
  certificateRows: ProjectCertificateRow[],
  collectionRows: ProjectCertificateCollectionRow[]
): ProjectCertificate[] {
  const collectionsByCertificate = new Map<string, ProjectCertificateCollectionRow[]>();

  for (const row of collectionRows) {
    const current = collectionsByCertificate.get(row.certificate_id) ?? [];
    current.push(row);
    collectionsByCertificate.set(row.certificate_id, current);
  }

  return certificateRows.map((row) => {
    const collections = collectionsByCertificate.get(row.id) ?? [];
    const paidAmount = collections.reduce((sum, collection) => sum + Number(collection.amount ?? 0), 0);
    const base = mapCertificate(row);

    return {
      ...base,
      paidAmount: round2(paidAmount),
      remainingAmount: round2(Math.max(Number(row.amount ?? 0) - paidAmount, 0)),
      collectionCount: collections.length,
    };
  });
}

async function loadCertificatesWithCollections(projectId: number) {
  const [
    { data: certificateData, error: certificateError },
    { data: collectionData, error: collectionError },
  ] = await Promise.all([
    supabase
      .from("project_certificates")
      .select("*")
      .eq("project_id", projectId)
      .order("issue_date", { ascending: false }),
    supabase
      .from("project_certificate_collections")
      .select("*")
      .eq("project_id", projectId)
      .order("collection_date", { ascending: false }),
  ]);

  if (certificateError || collectionError) {
    console.error(
      "Supabase revenue error:",
      certificateError?.message ?? collectionError?.message
    );
    return {
      certificates: [] as ProjectCertificate[],
      collections: [] as ProjectCertificateCollection[],
    };
  }

  const certificateRows = (certificateData ?? []) as ProjectCertificateRow[];
  const collectionRows = (collectionData ?? []) as ProjectCertificateCollectionRow[];

  return {
    certificates: enrichCertificates(certificateRows, collectionRows),
    collections: collectionRows.map(mapCollection),
  };
}

export async function getRevenueOverviewByProjectDb(projectId: number): Promise<{
  certificates: ProjectCertificate[];
  collections: ProjectCertificateCollection[];
  summary: RevenueSummary;
}> {
  const { certificates, collections } = await loadCertificatesWithCollections(projectId);
  const today = new Date().toISOString().slice(0, 10);

  return {
    certificates,
    collections,
    summary: {
      totalCertificates: certificates.length,
      certifiedAmount: round2(
        certificates
          .filter((certificate) => !["draft", "cancelled"].includes(certificate.status))
          .reduce((sum, certificate) => sum + certificate.amount, 0)
      ),
      collectedAmount: round2(
        certificates.reduce((sum, certificate) => sum + certificate.paidAmount, 0)
      ),
      pendingAmount: round2(
        certificates
          .filter((certificate) => !["draft", "cancelled"].includes(certificate.status))
          .reduce((sum, certificate) => sum + certificate.remainingAmount, 0)
      ),
      overdueAmount: round2(
        certificates
          .filter(
            (certificate) =>
              !["draft", "cancelled", "collected"].includes(certificate.status) &&
              certificate.remainingAmount > 0 &&
              certificate.dueDate !== null &&
              certificate.dueDate < today
          )
          .reduce((sum, certificate) => sum + certificate.remainingAmount, 0)
      ),
      partiallyCollectedCount: certificates.filter(
        (certificate) => certificate.paidAmount > 0 && certificate.remainingAmount > 0
      ).length,
    },
  };
}

export async function getProjectCertificatesByProjectDb(
  projectId: number
): Promise<ProjectCertificate[]> {
  const { certificates } = await loadCertificatesWithCollections(projectId);
  return certificates;
}

export async function getProjectCertificateCollectionsByProjectDb(
  projectId: number
): Promise<ProjectCertificateCollection[]> {
  const { collections } = await loadCertificatesWithCollections(projectId);
  return collections;
}

export type CreateProjectCertificateInput = Omit<
  ProjectCertificate,
  "id" | "createdAt" | "paidAmount" | "remainingAmount" | "collectionCount"
>;

export async function createProjectCertificateDb(
  input: CreateProjectCertificateInput
): Promise<ProjectCertificate> {
  const { data, error } = await supabase
    .from("project_certificates")
    .insert({
      project_id: input.projectId,
      phase_id: input.phaseId,
      certificate_number: input.certificateNumber,
      description: input.description,
      issue_date: input.issueDate,
      due_date: input.dueDate,
      amount: input.amount,
      status: input.status,
      client_visible: input.clientVisible,
      notes: input.notes,
      created_by: input.createdBy,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error creating project certificate:", error?.message);
    throw new Error("No se pudo emitir el certificado.");
  }

  const row = data as ProjectCertificateRow;

  await logCurrentUserAuditEvent({
    entityType: "project_certificate",
    entityId: row.id,
    projectId: row.project_id,
    action: "create",
    fromState: null,
    toState: row.status,
    metadata: {
      certificateNumber: row.certificate_number,
      amount: row.amount,
      dueDate: row.due_date,
      clientVisible: row.client_visible,
    },
  });

  return {
    ...mapCertificate(row),
    paidAmount: 0,
    remainingAmount: Number(row.amount),
    collectionCount: 0,
  };
}

export type CreateProjectCertificateCollectionInput = {
  certificateId: string;
  amount: number;
  collectionDate: string;
  reference?: string | null;
  notes?: string | null;
  createdBy?: number | null;
};

export async function createProjectCertificateCollectionDb(
  input: CreateProjectCertificateCollectionInput
): Promise<ProjectCertificateCollection> {
  const { data: certificateData, error: certificateError } = await supabase
    .from("project_certificates")
    .select("*")
    .eq("id", input.certificateId)
    .single();

  if (certificateError || !certificateData) {
    console.error("Error loading certificate for collection:", certificateError?.message);
    throw new Error("No se encontró el certificado.");
  }

  const certificate = certificateData as ProjectCertificateRow;

  const { data, error } = await supabase
    .from("project_certificate_collections")
    .insert({
      certificate_id: input.certificateId,
      project_id: certificate.project_id,
      amount: input.amount,
      collection_date: input.collectionDate,
      reference: input.reference ?? null,
      notes: input.notes ?? null,
      created_by: input.createdBy ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error creating certificate collection:", error?.message);
    throw new Error("No se pudo registrar el cobro.");
  }

  const row = data as ProjectCertificateCollectionRow;

  await logCurrentUserAuditEvent({
    entityType: "project_certificate_collection",
    entityId: row.id,
    projectId: certificate.project_id,
    action: "create",
    fromState: null,
    toState: "collected_partial",
    metadata: {
      certificateId: certificate.id,
      certificateNumber: certificate.certificate_number,
      amount: row.amount,
      collectionDate: row.collection_date,
      reference: row.reference,
    },
  });

  return mapCollection(row);
}

export async function updateProjectCertificateStatusDb(
  id: string,
  status: ProjectCertificateStatus
): Promise<ProjectCertificate> {
  if (["partially_collected", "collected"].includes(status)) {
    throw new Error("El estado de cobro se actualiza a partir de los cobros registrados.");
  }

  const { data: currentData, error: currentError } = await supabase
    .from("project_certificates")
    .select("*")
    .eq("id", id)
    .single();

  if (currentError || !currentData) {
    console.error("Error loading project certificate:", currentError?.message);
    throw new Error("No se encontró el certificado.");
  }

  const current = currentData as ProjectCertificateRow;

  if (current.status === status) {
    const certificates = await getProjectCertificatesByProjectDb(current.project_id);
    return certificates.find((certificate) => certificate.id === current.id) ?? mapCertificate(current);
  }

  const { data, error } = await supabase
    .from("project_certificates")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error updating project certificate:", error?.message);
    throw new Error("No se pudo actualizar el certificado.");
  }

  const updated = data as ProjectCertificateRow;

  await logCurrentUserAuditEvent({
    entityType: "project_certificate",
    entityId: id,
    projectId: current.project_id,
    action: "status_change",
    fromState: current.status,
    toState: status,
    metadata: {
      certificateNumber: current.certificate_number,
      amount: current.amount,
    },
  });

  const certificates = await getProjectCertificatesByProjectDb(updated.project_id);
  return certificates.find((certificate) => certificate.id === updated.id) ?? mapCertificate(updated);
}
