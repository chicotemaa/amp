export type SupplierCategory =
  | "materials"
  | "services"
  | "equipment"
  | "subcontracts"
  | "general";

export type PurchaseOrderCategory =
  | "materials"
  | "services"
  | "equipment"
  | "subcontracts";

export type PurchaseOrderStatus = "draft" | "ordered" | "received" | "paid" | "cancelled";

export const SUPPLIER_CATEGORY_LABELS: Record<SupplierCategory, string> = {
  materials: "Materiales",
  services: "Servicios",
  equipment: "Equipos",
  subcontracts: "Subcontratos",
  general: "General",
};

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  draft: "Borrador",
  ordered: "Ordenado",
  received: "Recibido",
  paid: "Pagado",
  cancelled: "Cancelado",
};

export const PURCHASE_ORDER_CATEGORY_LABELS: Record<PurchaseOrderCategory, string> = {
  materials: "Materiales",
  services: "Servicios",
  equipment: "Equipos",
  subcontracts: "Subcontratos",
};

export interface Supplier {
  id: number;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  category: SupplierCategory;
  isActive: boolean;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  projectId: number;
  materialId: string | null;
  supplierId: number;
  phaseId: string | null;
  workPackageId: string | null;
  category: PurchaseOrderCategory;
  description: string;
  unit: string;
  quantity: number;
  unitCost: number;
  totalAmount: number;
  orderDate: string;
  expectedDate: string | null;
  dueDate: string | null;
  invoiceNumber: string | null;
  receivedDate: string | null;
  paymentDate: string | null;
  status: PurchaseOrderStatus;
  paidAmount: number;
  remainingAmount: number;
  paymentCount: number;
  notes: string | null;
  createdBy: number | null;
  createdAt: string;
}

export interface PurchaseOrderPayment {
  id: string;
  purchaseOrderId: string;
  projectId: number;
  amount: number;
  paymentDate: string;
  reference: string | null;
  notes: string | null;
  createdBy: number | null;
  createdAt: string;
}

export interface ProcurementSummary {
  totalOrders: number;
  orderedAmount: number;
  receivedAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  partiallyPaidOrders: number;
}
