import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/types/supabase";
import type { ProjectControlSummary } from "@/lib/types/project-control";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type ProjectBudgetControlRow = Database["public"]["Tables"]["project_budget_control"]["Row"];
type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
type IncidentRow = Database["public"]["Tables"]["incidents"]["Row"];
type ChangeOrderRow = Database["public"]["Tables"]["change_orders"]["Row"];
type SiteDailyLogRow = Database["public"]["Tables"]["site_daily_logs"]["Row"];
type LaborEntryRow = Database["public"]["Tables"]["labor_entries"]["Row"];
type WorkPackageRow = Database["public"]["Tables"]["work_packages"]["Row"];
type PurchaseOrderRow = Database["public"]["Tables"]["purchase_orders"]["Row"];
type PurchaseOrderPaymentRow =
  Database["public"]["Tables"]["purchase_order_payments"]["Row"];
type ProjectCertificateRow =
  Database["public"]["Tables"]["project_certificates"]["Row"];
type ProjectCertificateCollectionRow =
  Database["public"]["Tables"]["project_certificate_collections"]["Row"];
type ProjectContractRow = Database["public"]["Tables"]["project_contracts"]["Row"];
type ProjectContractAmendmentRow =
  Database["public"]["Tables"]["project_contract_amendments"]["Row"];

type EnrichedPurchaseOrder = PurchaseOrderRow & {
  paid_amount: number;
  remaining_amount: number;
};

type EnrichedProjectCertificate = ProjectCertificateRow & {
  collected_amount: number;
  remaining_amount: number;
};

type DerivedContractSummary = {
  contractConfigured: boolean;
  contractStatus: string | null;
  contractOriginalAmount: number;
  contractCurrentAmount: number;
  approvedContractAmendmentAmount: number;
  approvedContractAmendmentDays: number;
  pendingContractAmendmentCount: number;
  pendingContractAmendmentAmount: number;
  pendingContractAmendmentDays: number;
  projectedContractMargin: number | null;
  certifiedCoveragePct: number | null;
  collectedCoveragePct: number | null;
};

function sumNumbers(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0);
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function sumTransactionCategory(
  transactions: TransactionRow[],
  categories: string[]
) {
  return sumNumbers(
    transactions
      .filter(
        (transaction) =>
          transaction.type === "egreso" && categories.includes(transaction.category)
      )
      .map((transaction) => Number(transaction.amount ?? 0))
  );
}

function getProcurementMatchKey(category: string, amount: number, date: string | null) {
  return [category, amount.toFixed(2), date ?? "no-date"].join("|");
}

function buildMatchCounter(rows: Array<{ category: string; amount: number; date: string | null }>) {
  const counter = new Map<string, number>();

  for (const row of rows) {
    const key = getProcurementMatchKey(row.category, row.amount, row.date);
    counter.set(key, (counter.get(key) ?? 0) + 1);
  }

  return counter;
}

function buildEnrichedPurchaseOrders(
  purchaseOrders: PurchaseOrderRow[],
  payments: PurchaseOrderPaymentRow[]
): EnrichedPurchaseOrder[] {
  const paymentsByOrder = new Map<string, PurchaseOrderPaymentRow[]>();

  for (const payment of payments) {
    const current = paymentsByOrder.get(payment.purchase_order_id) ?? [];
    current.push(payment);
    paymentsByOrder.set(payment.purchase_order_id, current);
  }

  return purchaseOrders.map((order) => {
    const paymentRows = paymentsByOrder.get(order.id) ?? [];
    const paidAmount =
      paymentRows.length > 0
        ? sumNumbers(paymentRows.map((payment) => Number(payment.amount ?? 0)))
        : order.status === "paid"
          ? Number(order.total_amount ?? 0)
          : 0;

    return {
      ...order,
      paid_amount: round2(paidAmount),
      remaining_amount: round2(Math.max(Number(order.total_amount ?? 0) - paidAmount, 0)),
    };
  });
}

function buildEnrichedProjectCertificates(
  certificates: ProjectCertificateRow[],
  collections: ProjectCertificateCollectionRow[]
): EnrichedProjectCertificate[] {
  const collectionsByCertificate = new Map<string, ProjectCertificateCollectionRow[]>();

  for (const collection of collections) {
    const current = collectionsByCertificate.get(collection.certificate_id) ?? [];
    current.push(collection);
    collectionsByCertificate.set(collection.certificate_id, current);
  }

  return certificates.map((certificate) => {
    const certificateCollections = collectionsByCertificate.get(certificate.id) ?? [];
    const collectedAmount = sumNumbers(
      certificateCollections.map((collection) => Number(collection.amount ?? 0))
    );

    return {
      ...certificate,
      collected_amount: round2(collectedAmount),
      remaining_amount: round2(
        Math.max(Number(certificate.amount ?? 0) - collectedAmount, 0)
      ),
    };
  });
}

function buildContractSummary(
  contract: ProjectContractRow | null,
  amendments: ProjectContractAmendmentRow[],
  certifiedAmount: number,
  collectedAmount: number,
  forecastFinalCost: number
): DerivedContractSummary {
  if (!contract) {
    return {
      contractConfigured: false,
      contractStatus: null,
      contractOriginalAmount: 0,
      contractCurrentAmount: 0,
      approvedContractAmendmentAmount: 0,
      approvedContractAmendmentDays: 0,
      pendingContractAmendmentCount: 0,
      pendingContractAmendmentAmount: 0,
      pendingContractAmendmentDays: 0,
      projectedContractMargin: null,
      certifiedCoveragePct: null,
      collectedCoveragePct: null,
    };
  }

  const approvedAmendments = amendments.filter((item) => item.status === "approved");
  const pendingAmendments = amendments.filter((item) =>
    ["draft", "submitted"].includes(item.status)
  );
  const approvedContractAmendmentAmount = round2(
    sumNumbers(approvedAmendments.map((item) => Number(item.amount_delta ?? 0)))
  );
  const approvedContractAmendmentDays = sumNumbers(
    approvedAmendments.map((item) => Number(item.days_delta ?? 0))
  );
  const pendingContractAmendmentAmount = round2(
    sumNumbers(pendingAmendments.map((item) => Number(item.amount_delta ?? 0)))
  );
  const pendingContractAmendmentDays = sumNumbers(
    pendingAmendments.map((item) => Number(item.days_delta ?? 0))
  );
  const contractCurrentAmount = round2(
    Number(contract.original_amount ?? 0) + approvedContractAmendmentAmount
  );

  return {
    contractConfigured: true,
    contractStatus: contract.status,
    contractOriginalAmount: round2(Number(contract.original_amount ?? 0)),
    contractCurrentAmount,
    approvedContractAmendmentAmount,
    approvedContractAmendmentDays,
    pendingContractAmendmentCount: pendingAmendments.length,
    pendingContractAmendmentAmount,
    pendingContractAmendmentDays,
    projectedContractMargin: round2(contractCurrentAmount - forecastFinalCost),
    certifiedCoveragePct:
      contractCurrentAmount > 0
        ? round2((certifiedAmount / contractCurrentAmount) * 100)
        : null,
    collectedCoveragePct:
      contractCurrentAmount > 0
        ? round2((collectedAmount / contractCurrentAmount) * 100)
        : null,
  };
}

function buildMeasuredExecutionSummary(
  workPackages: WorkPackageRow[],
  laborEntries: LaborEntryRow[],
  purchaseOrders: PurchaseOrderRow[]
) {
  const measuredPhaseIds = new Set(workPackages.map((workPackage) => workPackage.phase_id));
  const measuredLaborEntries = laborEntries.filter(
    (entry) => entry.phase_id !== null && measuredPhaseIds.has(entry.phase_id)
  );
  const measuredPurchaseOrders = purchaseOrders.filter(
    (order) =>
      order.phase_id !== null &&
      measuredPhaseIds.has(order.phase_id) &&
      ["received", "paid"].includes(order.status)
  );

  const measuredWorkPackageCount = workPackages.length;
  const measuredPlannedValue = round2(
    sumNumbers(
      workPackages.map(
        (workPackage) =>
          Number(workPackage.planned_qty ?? 0) * Number(workPackage.planned_unit_cost ?? 0)
      )
    )
  );
  const measuredEarnedValue = round2(
    sumNumbers(
      workPackages.map(
        (workPackage) =>
          Number(workPackage.executed_qty ?? 0) * Number(workPackage.planned_unit_cost ?? 0)
      )
    )
  );
  const measuredPlannedHours = round2(
    sumNumbers(
      workPackages.map(
        (workPackage) =>
          Number(workPackage.planned_qty ?? 0) *
          Number(workPackage.planned_hours_per_unit ?? 0)
      )
    )
  );
  const measuredEarnedHours = round2(
    sumNumbers(
      workPackages.map(
        (workPackage) =>
          Number(workPackage.executed_qty ?? 0) *
          Number(workPackage.planned_hours_per_unit ?? 0)
      )
    )
  );
  const measuredActualHours = round2(
    sumNumbers(measuredLaborEntries.map((entry) => Number(entry.hours_worked ?? 0)))
  );
  const measuredActualCost = round2(
    sumNumbers(measuredLaborEntries.map((entry) => Number(entry.amount_paid ?? 0))) +
      sumNumbers(measuredPurchaseOrders.map((order) => Number(order.total_amount ?? 0)))
  );
  const measuredCostVariance = round2(measuredActualCost - measuredEarnedValue);
  const productivityIndex =
    measuredActualHours > 0 ? round2(measuredEarnedHours / measuredActualHours) : null;
  const costPerformanceIndex =
    measuredActualCost > 0 ? round2(measuredEarnedValue / measuredActualCost) : null;

  return {
    measuredWorkPackageCount,
    measuredPlannedValue,
    measuredEarnedValue,
    measuredActualCost,
    measuredCostVariance,
    measuredPlannedHours,
    measuredEarnedHours,
    measuredActualHours,
    productivityIndex,
    costPerformanceIndex,
  };
}

function buildProjectControlSummary(
  project: ProjectRow,
  budgetControl: ProjectBudgetControlRow | null,
  transactions: TransactionRow[],
  incidents: IncidentRow[],
  changeOrders: ChangeOrderRow[],
  siteLogs: SiteDailyLogRow[],
  laborEntries: LaborEntryRow[],
  workPackages: WorkPackageRow[],
  purchaseOrders: PurchaseOrderRow[],
  purchaseOrderPayments: PurchaseOrderPaymentRow[],
  projectCertificates: ProjectCertificateRow[],
  projectCertificateCollections: ProjectCertificateCollectionRow[],
  projectContract: ProjectContractRow | null,
  projectContractAmendments: ProjectContractAmendmentRow[]
): ProjectControlSummary {
  const baselineBudget = Number(budgetControl?.baseline_amount ?? project.budget ?? 0);
  const currentBudget = Number(budgetControl?.current_amount ?? project.budget ?? baselineBudget);
  const committedAmount = Number(budgetControl?.committed_amount ?? 0);
  const spentAmount = Number(budgetControl?.spent_amount ?? 0);

  const approvedChangeOrders = changeOrders.filter((order) => order.status === "approved");
  const pendingChangeOrders = changeOrders.filter((order) =>
    ["draft", "pending_operator", "pending_client"].includes(order.status)
  ).length;
  const approvedChangeCost = sumNumbers(
    approvedChangeOrders.map((order) => Number(order.amount_delta ?? 0))
  );
  const approvedChangeDays = sumNumbers(
    approvedChangeOrders.map((order) => Number(order.days_delta ?? 0))
  );

  const openIncidents = incidents.filter(
    (incident) => !["resolved", "closed"].includes(incident.status)
  );
  const blockedIncidentCount = openIncidents.filter(
    (incident) => incident.status === "blocked"
  ).length;
  const criticalIncidentCount = openIncidents.filter(
    (incident) => incident.severity === "critical"
  ).length;
  const incidentDelayDays = sumNumbers(
    openIncidents.map((incident) => Number(incident.impact_days ?? 0))
  );
  const incidentRiskCost = sumNumbers(
    openIncidents.map((incident) => Number(incident.impact_cost ?? 0))
  );

  const weatherAffectedDays = siteLogs.filter(
    (log) => log.weather_impact !== "none" || Number(log.hours_lost ?? 0) > 0
  ).length;
  const weatherDelayDays = round2(
    sumNumbers(siteLogs.map((log) => Number(log.hours_lost ?? 0))) / 8
  );
  const measuredExecution = buildMeasuredExecutionSummary(
    workPackages,
    laborEntries,
    purchaseOrders
  );

  const enrichedCertificates = buildEnrichedProjectCertificates(
    projectCertificates,
    projectCertificateCollections
  );
  const certifiedAmount = sumNumbers(
    enrichedCertificates
      .filter((certificate) => !["draft", "cancelled"].includes(certificate.status))
      .map((certificate) => Number(certificate.amount ?? 0))
  );
  const collectedAmount = sumNumbers(
    projectCertificateCollections.map((collection) => Number(collection.amount ?? 0))
  );
  const pendingCollectionAmount = sumNumbers(
    enrichedCertificates
      .filter((certificate) => !["draft", "cancelled"].includes(certificate.status))
      .map((certificate) => Number(certificate.remaining_amount ?? 0))
  );
  const today = new Date().toISOString().slice(0, 10);
  const overdueCollectionAmount = sumNumbers(
    enrichedCertificates
      .filter(
        (certificate) =>
          !["draft", "cancelled", "collected"].includes(certificate.status) &&
          certificate.remaining_amount > 0 &&
          certificate.due_date !== null &&
          certificate.due_date < today
      )
      .map((certificate) => Number(certificate.remaining_amount ?? 0))
  );
  const collectionCounter = buildMatchCounter(
    projectCertificateCollections.map((collection) => ({
        category: "contracts",
        amount: Number(collection.amount ?? 0),
        date: collection.collection_date,
      }))
  );
  const unmatchedIncomeTransactions = transactions.filter((transaction) => {
    if (transaction.type !== "ingreso" || transaction.category !== "contracts") {
      return false;
    }

    const key = getProcurementMatchKey(
      transaction.category,
      Number(transaction.amount ?? 0),
      transaction.txn_date
    );
    const currentCount = collectionCounter.get(key) ?? 0;
    if (currentCount <= 0) {
      return true;
    }

    collectionCounter.set(key, currentCount - 1);
    return false;
  });
  const incomes = round2(
    collectedAmount +
      sumNumbers(unmatchedIncomeTransactions.map((transaction) => Number(transaction.amount ?? 0)))
  );
  const enrichedPurchaseOrders = buildEnrichedPurchaseOrders(
    purchaseOrders,
    purchaseOrderPayments
  );
  const paidPurchaseOrders = enrichedPurchaseOrders.filter((order) => order.paid_amount > 0);
  const receivedPurchaseOrders = enrichedPurchaseOrders.filter((order) =>
    ["received", "paid"].includes(order.status)
  );
  const orderedPurchaseOrders = enrichedPurchaseOrders.filter((order) =>
    ["ordered", "received", "paid"].includes(order.status)
  );
  const pendingPurchaseOrders = enrichedPurchaseOrders.filter(
    (order) => !["cancelled", "draft"].includes(order.status) && order.remaining_amount > 0
  );

  const procurementOrderedAmount = sumNumbers(
    orderedPurchaseOrders.map((order) => Number(order.total_amount ?? 0))
  );
  const procurementReceivedAmount = sumNumbers(
    receivedPurchaseOrders.map((order) => Number(order.total_amount ?? 0))
  );
  const pendingProcurementAmount = sumNumbers(
    pendingPurchaseOrders.map((order) => Number(order.remaining_amount ?? 0))
  );
  const overdueProcurementAmount = sumNumbers(
    pendingPurchaseOrders
      .filter((order) => order.due_date !== null && order.due_date < today)
      .map((order) => Number(order.remaining_amount ?? 0))
  );
  const orderById = new Map(enrichedPurchaseOrders.map((order) => [order.id, order]));
  const ordersWithSyntheticPayments = paidPurchaseOrders.filter(
    (order) =>
      !purchaseOrderPayments.some((payment) => payment.purchase_order_id === order.id)
  );
  const procurementPaymentRows = [
    ...purchaseOrderPayments,
    ...ordersWithSyntheticPayments.map(
      (order) =>
        ({
          id: order.id,
          purchase_order_id: order.id,
          project_id: order.project_id,
          amount: order.paid_amount,
          payment_date: order.payment_date ?? order.order_date,
          reference: order.invoice_number,
          notes: order.notes,
          created_by: order.created_by,
          created_at: order.created_at,
        }) satisfies PurchaseOrderPaymentRow
    ),
  ];
  const procurementPaidAmount = sumNumbers(
    procurementPaymentRows.map((payment) => Number(payment.amount ?? 0))
  );
  const paidProcurementCounter = buildMatchCounter(
    procurementPaymentRows
      .flatMap((payment) => {
        const order = orderById.get(payment.purchase_order_id);
        if (!order) return [];

        return [{
          category: order.category,
          amount: Number(payment.amount ?? 0),
          date: payment.payment_date,
        }];
      })
  );
  const unmatchedProcurementTransactions = transactions.filter((transaction) => {
    if (
      transaction.type !== "egreso" ||
      !["materials", "services", "equipment", "subcontracts"].includes(transaction.category)
    ) {
      return false;
    }

    const key = getProcurementMatchKey(
        transaction.category,
        Number(transaction.amount ?? 0),
        transaction.txn_date
      );
    const currentCount = paidProcurementCounter.get(key) ?? 0;
    if (currentCount <= 0) {
      return true;
    }

    paidProcurementCounter.set(key, currentCount - 1);
    return false;
  });

  const laborExpenses = sumNumbers(
    laborEntries.length > 0
      ? laborEntries.map((entry) => Number(entry.amount_paid ?? 0))
      : transactions
          .filter((transaction) => transaction.type === "egreso" && transaction.category === "labor")
          .map((transaction) => Number(transaction.amount ?? 0))
  );
  const laborHours = sumNumbers(laborEntries.map((entry) => Number(entry.hours_worked ?? 0)));
  const pendingLaborAmount = sumNumbers(
    laborEntries
      .filter((entry) => entry.payment_status === "pending")
      .map((entry) => Number(entry.amount_paid ?? 0))
  );
  const approvedLaborAmount = sumNumbers(
    laborEntries
      .filter((entry) => entry.payment_status === "approved")
      .map((entry) => Number(entry.amount_paid ?? 0))
  );
  const paidLaborAmount = sumNumbers(
    laborEntries
      .filter((entry) => entry.payment_status === "paid")
      .map((entry) => Number(entry.amount_paid ?? 0))
  );
  const materialsExpenses =
    sumNumbers(
      procurementPaymentRows
        .filter((payment) => orderById.get(payment.purchase_order_id)?.category === "materials")
        .map((payment) => Number(payment.amount ?? 0))
    ) +
    sumTransactionCategory(unmatchedProcurementTransactions, ["materials"]);
  const servicesExpenses =
    sumNumbers(
      procurementPaymentRows
        .filter((payment) =>
          ["services", "equipment", "subcontracts"].includes(
            orderById.get(payment.purchase_order_id)?.category ?? ""
          )
        )
        .map((payment) => Number(payment.amount ?? 0))
    ) +
    sumTransactionCategory(unmatchedProcurementTransactions, [
      "services",
      "equipment",
      "subcontracts",
    ]);

  const otherExpenses = sumNumbers(
    transactions
      .filter(
        (transaction) =>
          transaction.type === "egreso" &&
          !["labor", "materials", "services", "equipment", "subcontracts"].includes(
            transaction.category
          )
      )
      .map((transaction) => Number(transaction.amount ?? 0))
  );
  const totalExpenses = round2(laborExpenses + materialsExpenses + servicesExpenses + otherExpenses);
  const forecastBaseCost = Math.max(
    currentBudget,
    spentAmount,
    totalExpenses + pendingLaborAmount + approvedLaborAmount + pendingProcurementAmount
  );
  const forecastFinalCost = round2(forecastBaseCost + incidentRiskCost);
  const forecastCostDelta = round2(forecastFinalCost - baselineBudget);
  const contractualBudgetDelta = round2(currentBudget - baselineBudget);
  const forecastDelayDays = round2(approvedChangeDays + incidentDelayDays + weatherDelayDays);
  const contractSummary = buildContractSummary(
    projectContract,
    projectContractAmendments,
    certifiedAmount,
    collectedAmount,
    forecastFinalCost
  );

  return {
    projectId: project.id,
    projectName: project.name,
    projectStatus: project.status,
    progress: Number(project.progress ?? 0),
    contractConfigured: contractSummary.contractConfigured,
    contractStatus: contractSummary.contractStatus,
    contractOriginalAmount: contractSummary.contractOriginalAmount,
    contractCurrentAmount: contractSummary.contractCurrentAmount,
    approvedContractAmendmentAmount: contractSummary.approvedContractAmendmentAmount,
    approvedContractAmendmentDays: contractSummary.approvedContractAmendmentDays,
    pendingContractAmendmentCount: contractSummary.pendingContractAmendmentCount,
    pendingContractAmendmentAmount: contractSummary.pendingContractAmendmentAmount,
    pendingContractAmendmentDays: contractSummary.pendingContractAmendmentDays,
    projectedContractMargin: contractSummary.projectedContractMargin,
    certifiedCoveragePct: contractSummary.certifiedCoveragePct,
    collectedCoveragePct: contractSummary.collectedCoveragePct,
    baselineBudget,
    currentBudget,
    committedAmount,
    spentAmount,
    measuredWorkPackageCount: measuredExecution.measuredWorkPackageCount,
    measuredPlannedValue: measuredExecution.measuredPlannedValue,
    measuredEarnedValue: measuredExecution.measuredEarnedValue,
    measuredActualCost: measuredExecution.measuredActualCost,
    measuredCostVariance: measuredExecution.measuredCostVariance,
    measuredPlannedHours: measuredExecution.measuredPlannedHours,
    measuredEarnedHours: measuredExecution.measuredEarnedHours,
    measuredActualHours: measuredExecution.measuredActualHours,
    productivityIndex: measuredExecution.productivityIndex,
    costPerformanceIndex: measuredExecution.costPerformanceIndex,
    forecastFinalCost,
    forecastCostDelta,
    contractualBudgetDelta,
    incomes: round2(incomes),
    certifiedAmount: round2(certifiedAmount),
    collectedAmount: round2(collectedAmount),
    pendingCollectionAmount: round2(pendingCollectionAmount),
    overdueCollectionAmount: round2(overdueCollectionAmount),
    expenses: totalExpenses,
    netCash: round2(incomes - totalExpenses),
    laborExpenses: round2(laborExpenses),
    laborHours: round2(laborHours),
    pendingLaborAmount: round2(pendingLaborAmount),
    approvedLaborAmount: round2(approvedLaborAmount),
    paidLaborAmount: round2(paidLaborAmount),
    procurementOrderedAmount: round2(procurementOrderedAmount),
    procurementReceivedAmount: round2(procurementReceivedAmount),
    procurementPaidAmount: round2(procurementPaidAmount),
    pendingProcurementAmount: round2(pendingProcurementAmount),
    overdueProcurementAmount: round2(overdueProcurementAmount),
    materialsExpenses: round2(materialsExpenses),
    servicesExpenses: round2(servicesExpenses),
    approvedChangeDays,
    approvedChangeCost: round2(approvedChangeCost),
    pendingChangeOrders,
    openIncidentCount: openIncidents.length,
    blockedIncidentCount,
    criticalIncidentCount,
    incidentDelayDays,
    incidentRiskCost: round2(incidentRiskCost),
    weatherAffectedDays,
    weatherDelayDays,
    forecastDelayDays,
  };
}

export async function getProjectControlSummaryDb(
  projectId: number
): Promise<ProjectControlSummary | null> {
  const [
    { data: projectData, error: projectError },
    { data: budgetData },
    { data: transactionData },
    { data: incidentData },
    { data: changeOrderData },
    { data: siteLogData },
    { data: laborEntryData },
    { data: workPackageData },
    { data: purchaseOrderData },
    { data: purchaseOrderPaymentData },
    { data: projectCertificateData },
    { data: projectCertificateCollectionData },
    { data: projectContractData },
    { data: projectContractAmendmentData },
  ] = await Promise.all([
    supabase.from("projects").select("*").eq("id", projectId).single(),
    supabase.from("project_budget_control").select("*").eq("project_id", projectId).maybeSingle(),
    supabase.from("transactions").select("*").eq("project_id", projectId),
    supabase.from("incidents").select("*").eq("project_id", projectId),
    supabase.from("change_orders").select("*").eq("project_id", projectId),
    supabase.from("site_daily_logs").select("*").eq("project_id", projectId),
    supabase.from("labor_entries").select("*").eq("project_id", projectId),
    supabase.from("work_packages").select("*").eq("project_id", projectId),
    supabase.from("purchase_orders").select("*").eq("project_id", projectId),
    supabase.from("purchase_order_payments").select("*").eq("project_id", projectId),
    supabase.from("project_certificates").select("*").eq("project_id", projectId),
    supabase.from("project_certificate_collections").select("*").eq("project_id", projectId),
    supabase.from("project_contracts").select("*").eq("project_id", projectId).maybeSingle(),
    supabase.from("project_contract_amendments").select("*").eq("project_id", projectId),
  ]);

  if (projectError || !projectData) {
    console.error("Error loading project control summary:", projectError?.message);
    return null;
  }

  return buildProjectControlSummary(
    projectData as ProjectRow,
    (budgetData as ProjectBudgetControlRow | null) ?? null,
    (transactionData ?? []) as TransactionRow[],
    (incidentData ?? []) as IncidentRow[],
    (changeOrderData ?? []) as ChangeOrderRow[],
    (siteLogData ?? []) as SiteDailyLogRow[],
    (laborEntryData ?? []) as LaborEntryRow[],
    (workPackageData ?? []) as WorkPackageRow[],
    (purchaseOrderData ?? []) as PurchaseOrderRow[],
    (purchaseOrderPaymentData ?? []) as PurchaseOrderPaymentRow[],
    (projectCertificateData ?? []) as ProjectCertificateRow[],
    (projectCertificateCollectionData ?? []) as ProjectCertificateCollectionRow[],
    (projectContractData as ProjectContractRow | null) ?? null,
    (projectContractAmendmentData ?? []) as ProjectContractAmendmentRow[]
  );
}

export async function getPortfolioControlSummariesDb(): Promise<ProjectControlSummary[]> {
  const [
    { data: projectsData, error: projectsError },
    { data: budgetsData },
    { data: transactionData },
    { data: incidentData },
    { data: changeOrderData },
    { data: siteLogData },
    { data: laborEntryData },
    { data: workPackageData },
    { data: purchaseOrderData },
    { data: purchaseOrderPaymentData },
    { data: projectCertificateData },
    { data: projectCertificateCollectionData },
    { data: projectContractData },
    { data: projectContractAmendmentData },
  ] = await Promise.all([
    supabase.from("projects").select("*").order("id", { ascending: true }),
    supabase.from("project_budget_control").select("*"),
    supabase.from("transactions").select("*"),
    supabase.from("incidents").select("*"),
    supabase.from("change_orders").select("*"),
    supabase.from("site_daily_logs").select("*"),
    supabase.from("labor_entries").select("*"),
    supabase.from("work_packages").select("*"),
    supabase.from("purchase_orders").select("*"),
    supabase.from("purchase_order_payments").select("*"),
    supabase.from("project_certificates").select("*"),
    supabase.from("project_certificate_collections").select("*"),
    supabase.from("project_contracts").select("*"),
    supabase.from("project_contract_amendments").select("*"),
  ]);

  if (projectsError) {
    console.error("Error loading portfolio control summaries:", projectsError.message);
    return [];
  }

  const budgetMap = new Map<number, ProjectBudgetControlRow>(
    ((budgetsData ?? []) as ProjectBudgetControlRow[]).map((row) => [row.project_id, row])
  );

  const transactionsByProject = new Map<number, TransactionRow[]>();
  for (const row of (transactionData ?? []) as TransactionRow[]) {
    if (typeof row.project_id !== "number") continue;
    const current = transactionsByProject.get(row.project_id) ?? [];
    current.push(row);
    transactionsByProject.set(row.project_id, current);
  }

  const incidentsByProject = new Map<number, IncidentRow[]>();
  for (const row of (incidentData ?? []) as IncidentRow[]) {
    const current = incidentsByProject.get(row.project_id) ?? [];
    current.push(row);
    incidentsByProject.set(row.project_id, current);
  }

  const changesByProject = new Map<number, ChangeOrderRow[]>();
  for (const row of (changeOrderData ?? []) as ChangeOrderRow[]) {
    const current = changesByProject.get(row.project_id) ?? [];
    current.push(row);
    changesByProject.set(row.project_id, current);
  }

  const siteLogsByProject = new Map<number, SiteDailyLogRow[]>();
  for (const row of (siteLogData ?? []) as SiteDailyLogRow[]) {
    const current = siteLogsByProject.get(row.project_id) ?? [];
    current.push(row);
    siteLogsByProject.set(row.project_id, current);
  }

  const laborEntriesByProject = new Map<number, LaborEntryRow[]>();
  for (const row of (laborEntryData ?? []) as LaborEntryRow[]) {
    const current = laborEntriesByProject.get(row.project_id) ?? [];
    current.push(row);
    laborEntriesByProject.set(row.project_id, current);
  }

  const purchaseOrdersByProject = new Map<number, PurchaseOrderRow[]>();
  for (const row of (purchaseOrderData ?? []) as PurchaseOrderRow[]) {
    const current = purchaseOrdersByProject.get(row.project_id) ?? [];
    current.push(row);
    purchaseOrdersByProject.set(row.project_id, current);
  }

  const workPackagesByProject = new Map<number, WorkPackageRow[]>();
  for (const row of (workPackageData ?? []) as WorkPackageRow[]) {
    const current = workPackagesByProject.get(row.project_id) ?? [];
    current.push(row);
    workPackagesByProject.set(row.project_id, current);
  }

  const purchaseOrderPaymentsByProject = new Map<number, PurchaseOrderPaymentRow[]>();
  for (const row of (purchaseOrderPaymentData ?? []) as PurchaseOrderPaymentRow[]) {
    const current = purchaseOrderPaymentsByProject.get(row.project_id) ?? [];
    current.push(row);
    purchaseOrderPaymentsByProject.set(row.project_id, current);
  }

  const projectCertificatesByProject = new Map<number, ProjectCertificateRow[]>();
  for (const row of (projectCertificateData ?? []) as ProjectCertificateRow[]) {
    const current = projectCertificatesByProject.get(row.project_id) ?? [];
    current.push(row);
    projectCertificatesByProject.set(row.project_id, current);
  }

  const projectCertificateCollectionsByProject = new Map<
    number,
    ProjectCertificateCollectionRow[]
  >();
  for (const row of (projectCertificateCollectionData ?? []) as ProjectCertificateCollectionRow[]) {
    const current = projectCertificateCollectionsByProject.get(row.project_id) ?? [];
    current.push(row);
    projectCertificateCollectionsByProject.set(row.project_id, current);
  }

  const projectContractsByProject = new Map<number, ProjectContractRow>();
  for (const row of (projectContractData ?? []) as ProjectContractRow[]) {
    projectContractsByProject.set(row.project_id, row);
  }

  const projectContractAmendmentsByProject = new Map<number, ProjectContractAmendmentRow[]>();
  for (const row of (projectContractAmendmentData ?? []) as ProjectContractAmendmentRow[]) {
    const current = projectContractAmendmentsByProject.get(row.project_id) ?? [];
    current.push(row);
    projectContractAmendmentsByProject.set(row.project_id, current);
  }

  return ((projectsData ?? []) as ProjectRow[]).map((project) =>
    buildProjectControlSummary(
      project,
      budgetMap.get(project.id) ?? null,
      transactionsByProject.get(project.id) ?? [],
      incidentsByProject.get(project.id) ?? [],
      changesByProject.get(project.id) ?? [],
      siteLogsByProject.get(project.id) ?? [],
      laborEntriesByProject.get(project.id) ?? [],
      workPackagesByProject.get(project.id) ?? [],
      purchaseOrdersByProject.get(project.id) ?? [],
      purchaseOrderPaymentsByProject.get(project.id) ?? [],
      projectCertificatesByProject.get(project.id) ?? [],
      projectCertificateCollectionsByProject.get(project.id) ?? [],
      projectContractsByProject.get(project.id) ?? null,
      projectContractAmendmentsByProject.get(project.id) ?? []
    )
  );
}
