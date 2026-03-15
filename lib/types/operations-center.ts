export type OperationsOwnerRole = "operator" | "pm" | "inspector";

export type OperationsActionSeverity = "critical" | "high" | "medium";

export interface OperationsCommandCenterSummary {
  recordedProgressCount: number;
  validatedPublicationCount: number;
  fieldCompletedMilestonesCount: number;
  overduePendingMilestonesCount: number;
  openIncidentsCount: number;
  blockedIncidentsCount: number;
  criticalIncidentsCount: number;
  lowStockCount: number;
  overduePurchaseOrdersCount: number;
  pendingReceiptCount: number;
  pendingLaborApprovalCount: number;
  pendingLaborPaymentCount: number;
  unassignedLaborEntriesCount: number;
  unassignedPurchaseOrdersCount: number;
  recentWeatherAlertsCount: number;
  equivalentDelayDays: number;
  missingLaborTraceabilityDaysCount: number;
  staleSiteLogDays: number;
  latestSiteLogDate: string | null;
}

export interface OperationsCommandAction {
  id: string;
  ownerRole: OperationsOwnerRole;
  severity: OperationsActionSeverity;
  title: string;
  description: string;
  metric: string;
}

export interface OperationsCommandCenterData {
  summary: OperationsCommandCenterSummary;
  actions: OperationsCommandAction[];
}

export const OPERATIONS_OWNER_ROLE_LABELS: Record<OperationsOwnerRole, string> = {
  operator: "Director",
  pm: "PM",
  inspector: "Inspector",
};

export const OPERATIONS_ACTION_SEVERITY_LABELS: Record<
  OperationsActionSeverity,
  string
> = {
  critical: "Crítica",
  high: "Alta",
  medium: "Media",
};
