import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/types/supabase";
import { logCurrentUserAuditEvent } from "@/lib/api/audit";
import type {
  ProjectContract,
  ProjectContractAmendment,
  ProjectContractAmendmentStatus,
  ProjectContractStatus,
  ProjectContractSummary,
} from "@/lib/types/contracts";

type ProjectContractRow = Database["public"]["Tables"]["project_contracts"]["Row"];
type ProjectContractAmendmentRow =
  Database["public"]["Tables"]["project_contract_amendments"]["Row"];

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function mapContract(row: ProjectContractRow): ProjectContract {
  return {
    id: row.id,
    projectId: row.project_id,
    contractNumber: row.contract_number,
    title: row.title,
    status: row.status as ProjectContractStatus,
    signedDate: row.signed_date,
    startDate: row.start_date,
    endDate: row.end_date,
    originalAmount: Number(row.original_amount),
    clientVisible: row.client_visible,
    notes: row.notes,
    createdBy: row.created_by,
    publishedBy: row.published_by,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

function mapAmendment(row: ProjectContractAmendmentRow): ProjectContractAmendment {
  return {
    id: row.id,
    contractId: row.contract_id,
    projectId: row.project_id,
    amendmentNumber: row.amendment_number,
    title: row.title,
    amendmentType: row.amendment_type as ProjectContractAmendment["amendmentType"],
    status: row.status as ProjectContractAmendmentStatus,
    effectiveDate: row.effective_date,
    amountDelta: Number(row.amount_delta),
    daysDelta: row.days_delta,
    clientVisible: row.client_visible,
    description: row.description,
    createdBy: row.created_by,
    submittedBy: row.submitted_by,
    submittedAt: row.submitted_at,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    publishedBy: row.published_by,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

function buildContractSummary(
  contract: ProjectContract | null,
  amendments: ProjectContractAmendment[],
  certifiedAmount = 0,
  collectedAmount = 0,
  forecastFinalCost = 0,
  expenses = 0
): ProjectContractSummary {
  if (!contract) {
    return {
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
    };
  }

  const approvedAmendments = amendments.filter((item) => item.status === "approved");
  const pendingAmendments = amendments.filter((item) =>
    ["draft", "submitted"].includes(item.status)
  );
  const approvedAmountDelta = round2(
    approvedAmendments.reduce((sum, item) => sum + item.amountDelta, 0)
  );
  const approvedDaysDelta = approvedAmendments.reduce(
    (sum, item) => sum + item.daysDelta,
    0
  );
  const pendingAmountDelta = round2(
    pendingAmendments.reduce((sum, item) => sum + item.amountDelta, 0)
  );
  const pendingDaysDelta = pendingAmendments.reduce(
    (sum, item) => sum + item.daysDelta,
    0
  );
  const currentAmount = round2(contract.originalAmount + approvedAmountDelta);

  return {
    configured: true,
    contractStatus: contract.status,
    originalAmount: contract.originalAmount,
    currentAmount,
    approvedAmountDelta,
    approvedDaysDelta,
    pendingAmountDelta,
    pendingDaysDelta,
    pendingAmendmentsCount: pendingAmendments.length,
    certifiedCoveragePct:
      currentAmount > 0 ? round2((certifiedAmount / currentAmount) * 100) : null,
    collectedCoveragePct:
      currentAmount > 0 ? round2((collectedAmount / currentAmount) * 100) : null,
    projectedMargin: round2(currentAmount - forecastFinalCost),
    cashMargin: round2(collectedAmount - expenses),
  };
}

export async function getProjectContractOverviewByProjectDb(projectId: number): Promise<{
  contract: ProjectContract | null;
  amendments: ProjectContractAmendment[];
  summary: ProjectContractSummary;
}> {
  const [
    { data: contractData, error: contractError },
    { data: amendmentData, error: amendmentError },
    { data: certificateData, error: certificateError },
    { data: collectionData, error: collectionError },
    { data: budgetControlData },
    { data: transactionData },
    { data: laborData },
    { data: purchaseOrderData },
    { data: purchasePaymentData },
  ] = await Promise.all([
    supabase.from("project_contracts").select("*").eq("project_id", projectId).maybeSingle(),
    supabase
      .from("project_contract_amendments")
      .select("*")
      .eq("project_id", projectId)
      .order("effective_date", { ascending: false }),
    supabase.from("project_certificates").select("*").eq("project_id", projectId),
    supabase.from("project_certificate_collections").select("*").eq("project_id", projectId),
    supabase.from("project_budget_control").select("*").eq("project_id", projectId).maybeSingle(),
    supabase.from("transactions").select("*").eq("project_id", projectId),
    supabase.from("labor_entries").select("*").eq("project_id", projectId),
    supabase.from("purchase_orders").select("*").eq("project_id", projectId),
    supabase.from("purchase_order_payments").select("*").eq("project_id", projectId),
  ]);

  if (contractError || amendmentError || certificateError || collectionError) {
    console.error(
      "Supabase contracts error:",
      contractError?.message ??
        amendmentError?.message ??
        certificateError?.message ??
        collectionError?.message
    );
    return {
      contract: null,
      amendments: [],
      summary: buildContractSummary(null, []),
    };
  }

  const contract = contractData ? mapContract(contractData as ProjectContractRow) : null;
  const amendments = ((amendmentData ?? []) as ProjectContractAmendmentRow[]).map(mapAmendment);
  const certificates = (certificateData ?? []) as Array<{ amount: number; status: string }>;
  const collections = (collectionData ?? []) as Array<{ amount: number }>;
  const laborEntries = (laborData ?? []) as Array<{ amount_paid: number | null }>;
  const purchaseOrders = (purchaseOrderData ?? []) as Array<{
    id: string;
    total_amount: number | null;
    status: string;
  }>;
  const purchasePayments = (purchasePaymentData ?? []) as Array<{
    purchase_order_id: string;
    amount: number | null;
  }>;
  const transactions = (transactionData ?? []) as Array<{
    type: string;
    category: string;
    amount: number | null;
  }>;

  const certifiedAmount = round2(
    certificates
      .filter((certificate) => !["draft", "cancelled"].includes(certificate.status))
      .reduce((sum, certificate) => sum + Number(certificate.amount ?? 0), 0)
  );
  const collectedAmount = round2(
    collections.reduce((sum, collection) => sum + Number(collection.amount ?? 0), 0)
  );

  const paidByOrderId = new Map<string, number>();
  for (const payment of purchasePayments) {
    paidByOrderId.set(
      payment.purchase_order_id,
      (paidByOrderId.get(payment.purchase_order_id) ?? 0) + Number(payment.amount ?? 0)
    );
  }

  const procurementExpenses = round2(
    purchaseOrders.reduce((sum, order) => {
      const paidAmount =
        paidByOrderId.get(order.id) ??
        (order.status === "paid" ? Number(order.total_amount ?? 0) : 0);
      return sum + paidAmount;
    }, 0)
  );
  const laborExpenses = round2(
    laborEntries.reduce((sum, entry) => sum + Number(entry.amount_paid ?? 0), 0)
  );
  const fallbackOtherExpenses = round2(
    transactions
      .filter(
        (transaction) =>
          transaction.type === "egreso" &&
          !["labor", "materials", "services", "equipment", "subcontracts"].includes(
            transaction.category
          )
      )
      .reduce((sum, transaction) => sum + Number(transaction.amount ?? 0), 0)
  );
  const expenses = round2(laborExpenses + procurementExpenses + fallbackOtherExpenses);
  const baselineBudget = Number(
    (budgetControlData as { baseline_amount?: number | null } | null)?.baseline_amount ?? 0
  );
  const currentBudget = Number(
    (budgetControlData as { current_amount?: number | null } | null)?.current_amount ??
      baselineBudget
  );
  const forecastFinalCost = round2(Math.max(currentBudget, baselineBudget, expenses));

  return {
    contract,
    amendments,
    summary: buildContractSummary(
      contract,
      amendments,
      certifiedAmount,
      collectedAmount,
      forecastFinalCost,
      expenses
    ),
  };
}

export type CreateProjectContractInput = Omit<
  ProjectContract,
  "id" | "createdAt" | "publishedBy" | "publishedAt"
>;

export async function createProjectContractDb(
  input: CreateProjectContractInput
): Promise<ProjectContract> {
  const { data, error } = await supabase
    .from("project_contracts")
    .insert({
      project_id: input.projectId,
      contract_number: input.contractNumber,
      title: input.title,
      status: input.status,
      signed_date: input.signedDate,
      start_date: input.startDate,
      end_date: input.endDate,
      original_amount: input.originalAmount,
      client_visible: input.clientVisible,
      notes: input.notes,
      created_by: input.createdBy,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error creating project contract:", error?.message);
    throw new Error("No se pudo registrar el contrato.");
  }

  const row = data as ProjectContractRow;

  await logCurrentUserAuditEvent({
    entityType: "project_contract",
    entityId: row.id,
    projectId: row.project_id,
    action: "create",
    fromState: null,
    toState: row.status,
    metadata: {
      contractNumber: row.contract_number,
      originalAmount: row.original_amount,
      clientVisible: row.client_visible,
    },
  });

  return mapContract(row);
}

export type CreateProjectContractAmendmentInput = Omit<
  ProjectContractAmendment,
  | "id"
  | "createdAt"
  | "projectId"
  | "submittedBy"
  | "submittedAt"
  | "approvedBy"
  | "approvedAt"
  | "publishedBy"
  | "publishedAt"
>;

export async function createProjectContractAmendmentDb(
  input: CreateProjectContractAmendmentInput
): Promise<ProjectContractAmendment> {
  const { data: contractData, error: contractError } = await supabase
    .from("project_contracts")
    .select("*")
    .eq("id", input.contractId)
    .single();

  if (contractError || !contractData) {
    console.error("Error loading project contract:", contractError?.message);
    throw new Error("No se encontró el contrato base.");
  }

  const contract = contractData as ProjectContractRow;

  const { data, error } = await supabase
    .from("project_contract_amendments")
    .insert({
      contract_id: input.contractId,
      project_id: contract.project_id,
      amendment_number: input.amendmentNumber,
      title: input.title,
      amendment_type: input.amendmentType,
      status: input.status,
      effective_date: input.effectiveDate,
      amount_delta: input.amountDelta,
      days_delta: input.daysDelta,
      client_visible: input.clientVisible,
      description: input.description,
      created_by: input.createdBy,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error creating project contract amendment:", error?.message);
    throw new Error("No se pudo registrar la adenda.");
  }

  const row = data as ProjectContractAmendmentRow;

  await logCurrentUserAuditEvent({
    entityType: "project_contract_amendment",
    entityId: row.id,
    projectId: row.project_id,
    action: "create",
    fromState: null,
    toState: row.status,
    metadata: {
      contractId: row.contract_id,
      amendmentNumber: row.amendment_number,
      amountDelta: row.amount_delta,
      daysDelta: row.days_delta,
      amendmentType: row.amendment_type,
    },
  });

  return mapAmendment(row);
}

export async function updateProjectContractStatusDb(
  id: string,
  status: ProjectContractStatus
): Promise<ProjectContract> {
  const { data: currentData, error: currentError } = await supabase
    .from("project_contracts")
    .select("*")
    .eq("id", id)
    .single();

  if (currentError || !currentData) {
    console.error("Error loading project contract:", currentError?.message);
    throw new Error("No se encontró el contrato.");
  }

  const current = currentData as ProjectContractRow;

  const { data, error } = await supabase
    .from("project_contracts")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error updating project contract status:", error?.message);
    throw new Error("No se pudo actualizar el estado contractual.");
  }

  await logCurrentUserAuditEvent({
    entityType: "project_contract",
    entityId: id,
    projectId: current.project_id,
    action: "status_change",
    fromState: current.status,
    toState: status,
    metadata: {
      contractNumber: current.contract_number,
    },
  });

  return mapContract(data as ProjectContractRow);
}

export async function updateProjectContractClientVisibilityDb(
  id: string,
  clientVisible: boolean
): Promise<ProjectContract> {
  const { data: currentData, error: currentError } = await supabase
    .from("project_contracts")
    .select("*")
    .eq("id", id)
    .single();

  if (currentError || !currentData) {
    console.error("Error loading project contract:", currentError?.message);
    throw new Error("No se encontró el contrato.");
  }

  const current = currentData as ProjectContractRow;

  const { data, error } = await supabase
    .from("project_contracts")
    .update({ client_visible: clientVisible })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error updating project contract visibility:", error?.message);
    throw new Error("No se pudo actualizar la publicación contractual.");
  }

  await logCurrentUserAuditEvent({
    entityType: "project_contract",
    entityId: id,
    projectId: current.project_id,
    action: clientVisible ? "publish" : "unpublish",
    fromState: current.client_visible ? "visible" : "hidden",
    toState: clientVisible ? "visible" : "hidden",
    metadata: {
      contractNumber: current.contract_number,
    },
  });

  return mapContract(data as ProjectContractRow);
}

export async function updateProjectContractAmendmentStatusDb(
  id: string,
  status: ProjectContractAmendmentStatus
): Promise<ProjectContractAmendment> {
  const { data: currentData, error: currentError } = await supabase
    .from("project_contract_amendments")
    .select("*")
    .eq("id", id)
    .single();

  if (currentError || !currentData) {
    console.error("Error loading project contract amendment:", currentError?.message);
    throw new Error("No se encontró la adenda.");
  }

  const current = currentData as ProjectContractAmendmentRow;

  const { data, error } = await supabase
    .from("project_contract_amendments")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error updating contract amendment status:", error?.message);
    throw new Error("No se pudo actualizar la adenda.");
  }

  await logCurrentUserAuditEvent({
    entityType: "project_contract_amendment",
    entityId: id,
    projectId: current.project_id,
    action: "status_change",
    fromState: current.status,
    toState: status,
    metadata: {
      contractId: current.contract_id,
      amendmentNumber: current.amendment_number,
    },
  });

  return mapAmendment(data as ProjectContractAmendmentRow);
}

export async function updateProjectContractAmendmentClientVisibilityDb(
  id: string,
  clientVisible: boolean
): Promise<ProjectContractAmendment> {
  const { data: currentData, error: currentError } = await supabase
    .from("project_contract_amendments")
    .select("*")
    .eq("id", id)
    .single();

  if (currentError || !currentData) {
    console.error("Error loading project contract amendment:", currentError?.message);
    throw new Error("No se encontró la adenda.");
  }

  const current = currentData as ProjectContractAmendmentRow;

  const { data, error } = await supabase
    .from("project_contract_amendments")
    .update({ client_visible: clientVisible })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error updating contract amendment visibility:", error?.message);
    throw new Error("No se pudo actualizar la publicación de la adenda.");
  }

  await logCurrentUserAuditEvent({
    entityType: "project_contract_amendment",
    entityId: id,
    projectId: current.project_id,
    action: clientVisible ? "publish" : "unpublish",
    fromState: current.client_visible ? "visible" : "hidden",
    toState: clientVisible ? "visible" : "hidden",
    metadata: {
      contractId: current.contract_id,
      amendmentNumber: current.amendment_number,
    },
  });

  return mapAmendment(data as ProjectContractAmendmentRow);
}
