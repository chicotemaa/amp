import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/types/supabase";
import { logCurrentUserAuditEvent } from "@/lib/api/audit";
import type {
  ProcurementSummary,
  PurchaseOrder,
  PurchaseOrderPayment,
  PurchaseOrderStatus,
  Supplier,
  SupplierDirectoryItem,
} from "@/lib/types/procurement";

type SupplierRow = Database["public"]["Tables"]["suppliers"]["Row"];
type PurchaseOrderRow = Database["public"]["Tables"]["purchase_orders"]["Row"];
type PurchaseOrderPaymentRow = Database["public"]["Tables"]["purchase_order_payments"]["Row"];
type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];

function mapSupplier(row: SupplierRow): Supplier {
  return {
    id: row.id,
    name: row.name,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    category: row.category as Supplier["category"],
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function mapPurchaseOrder(row: PurchaseOrderRow): PurchaseOrder {
  return {
    id: row.id,
    projectId: row.project_id,
    materialId: row.material_id,
    supplierId: row.supplier_id,
    phaseId: row.phase_id,
    workPackageId: row.work_package_id,
    category: row.category as PurchaseOrder["category"],
    description: row.description,
    unit: row.unit,
    quantity: Number(row.quantity),
    unitCost: Number(row.unit_cost),
    totalAmount: Number(row.total_amount),
    orderDate: row.order_date,
    expectedDate: row.expected_date,
    dueDate: row.due_date,
    invoiceNumber: row.invoice_number,
    receivedDate: row.received_date,
    paymentDate: row.payment_date,
    status: row.status as PurchaseOrderStatus,
    paidAmount: 0,
    remainingAmount: Number(row.total_amount),
    paymentCount: 0,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function mapPurchaseOrderPayment(row: PurchaseOrderPaymentRow): PurchaseOrderPayment {
  return {
    id: row.id,
    purchaseOrderId: row.purchase_order_id,
    projectId: row.project_id,
    amount: Number(row.amount),
    paymentDate: row.payment_date,
    reference: row.reference,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function enrichPurchaseOrders(
  orderRows: PurchaseOrderRow[],
  paymentRows: PurchaseOrderPaymentRow[]
): PurchaseOrder[] {
  const paymentsByOrder = new Map<string, PurchaseOrderPaymentRow[]>();

  for (const row of paymentRows) {
    const current = paymentsByOrder.get(row.purchase_order_id) ?? [];
    current.push(row);
    paymentsByOrder.set(row.purchase_order_id, current);
  }

  return orderRows.map((row) => {
    const payments = paymentsByOrder.get(row.id) ?? [];
    const paidAmount =
      payments.length > 0
        ? payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)
        : row.status === "paid"
          ? Number(row.total_amount ?? 0)
          : 0;
    const base = mapPurchaseOrder(row);

    return {
      ...base,
      paidAmount: Math.round(paidAmount * 100) / 100,
      remainingAmount: Math.round(Math.max(Number(row.total_amount ?? 0) - paidAmount, 0) * 100) / 100,
      paymentCount: payments.length > 0 ? payments.length : row.status === "paid" ? 1 : 0,
      paymentDate:
        row.payment_date ??
        payments
          .map((payment) => payment.payment_date)
          .sort((left, right) => right.localeCompare(left))[0] ??
        null,
    };
  });
}

async function loadPurchaseOrdersWithPayments(projectId: number) {
  const [{ data: orderData, error: orderError }, { data: paymentData, error: paymentError }] =
    await Promise.all([
      supabase
        .from("purchase_orders")
        .select("*")
        .eq("project_id", projectId)
        .order("order_date", { ascending: false }),
      supabase
        .from("purchase_order_payments")
        .select("*")
        .eq("project_id", projectId)
        .order("payment_date", { ascending: false }),
    ]);

  if (orderError || paymentError) {
    console.error(
      "Supabase procurement error:",
      orderError?.message ?? paymentError?.message
    );
    return {
      orders: [] as PurchaseOrder[],
      payments: [] as PurchaseOrderPayment[],
    };
  }

  const orderRows = (orderData ?? []) as PurchaseOrderRow[];
  const paymentRows = (paymentData ?? []) as PurchaseOrderPaymentRow[];

  return {
    orders: enrichPurchaseOrders(orderRows, paymentRows),
    payments: paymentRows.map(mapPurchaseOrderPayment),
  };
}

export async function getProcurementOverviewByProjectDb(projectId: number): Promise<{
  orders: PurchaseOrder[];
  payments: PurchaseOrderPayment[];
  summary: ProcurementSummary;
}> {
  const { orders, payments } = await loadPurchaseOrdersWithPayments(projectId);
  const today = new Date().toISOString().slice(0, 10);

  return {
    orders,
    payments,
    summary: {
      totalOrders: orders.length,
      orderedAmount: Math.round(
        orders
          .filter((order) => ["ordered", "received", "paid"].includes(order.status))
          .reduce((sum, order) => sum + order.totalAmount, 0) * 100
      ) / 100,
      receivedAmount: Math.round(
        orders
          .filter((order) => ["received", "paid"].includes(order.status))
          .reduce((sum, order) => sum + order.totalAmount, 0) * 100
      ) / 100,
      paidAmount: Math.round(
        orders.reduce((sum, order) => sum + order.paidAmount, 0) * 100
      ) / 100,
      pendingAmount: Math.round(
        orders
          .filter((order) => !["cancelled", "draft"].includes(order.status))
          .reduce((sum, order) => sum + order.remainingAmount, 0) * 100
      ) / 100,
      overdueAmount: Math.round(
        orders
          .filter(
            (order) =>
              !["cancelled", "draft"].includes(order.status) &&
              order.remainingAmount > 0 &&
              order.dueDate !== null &&
              order.dueDate < today
          )
          .reduce((sum, order) => sum + order.remainingAmount, 0) * 100
      ) / 100,
      partiallyPaidOrders: orders.filter(
        (order) => order.paidAmount > 0 && order.remainingAmount > 0
      ).length,
    },
  };
}

export async function getSuppliersDb(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Supabase suppliers error:", error.message);
    return [];
  }

  return ((data ?? []) as SupplierRow[]).map(mapSupplier);
}

export async function getSupplierDirectoryDb(): Promise<SupplierDirectoryItem[]> {
  const [
    { data: supplierData, error: supplierError },
    { data: orderData, error: orderError },
    { data: paymentData, error: paymentError },
  ] = await Promise.all([
    supabase.from("suppliers").select("*").order("name", { ascending: true }),
    supabase.from("purchase_orders").select("*").order("order_date", { ascending: false }),
    supabase.from("purchase_order_payments").select("*"),
  ]);

  if (supplierError || orderError || paymentError) {
    console.error(
      "Supabase supplier directory error:",
      supplierError?.message ?? orderError?.message ?? paymentError?.message
    );
    return [];
  }

  const suppliers = ((supplierData ?? []) as SupplierRow[]).map(mapSupplier);
  const orders = enrichPurchaseOrders(
    (orderData ?? []) as PurchaseOrderRow[],
    (paymentData ?? []) as PurchaseOrderPaymentRow[]
  );
  const today = new Date().toISOString().slice(0, 10);

  return suppliers.map((supplier) => {
    const supplierOrders = orders.filter((order) => order.supplierId === supplier.id);
    const activeProjectIds = new Set(
      supplierOrders
        .filter((order) => !["cancelled", "paid"].includes(order.status))
        .map((order) => order.projectId)
    );

    return {
      ...supplier,
      orderCount: supplierOrders.length,
      totalOrdered: Math.round(
        supplierOrders
          .filter((order) => order.status !== "cancelled")
          .reduce((sum, order) => sum + order.totalAmount, 0) * 100
      ) / 100,
      totalPaid: Math.round(
        supplierOrders.reduce((sum, order) => sum + order.paidAmount, 0) * 100
      ) / 100,
      totalPending: Math.round(
        supplierOrders
          .filter((order) => !["cancelled", "draft"].includes(order.status))
          .reduce((sum, order) => sum + order.remainingAmount, 0) * 100
      ) / 100,
      overdueAmount: Math.round(
        supplierOrders
          .filter(
            (order) =>
              !["cancelled", "draft"].includes(order.status) &&
              order.remainingAmount > 0 &&
              order.dueDate !== null &&
              order.dueDate < today
          )
          .reduce((sum, order) => sum + order.remainingAmount, 0) * 100
      ) / 100,
      activeProjectCount: activeProjectIds.size,
      lastOrderDate:
        supplierOrders
          .map((order) => order.orderDate)
          .sort((left, right) => right.localeCompare(left))[0] ?? null,
    };
  });
}

export type CreateSupplierInput = Omit<Supplier, "id" | "createdAt">;

export async function createSupplierDb(input: CreateSupplierInput): Promise<Supplier> {
  const newId = Date.now();
  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      id: newId,
      name: input.name,
      contact_name: input.contactName,
      email: input.email,
      phone: input.phone,
      category: input.category,
      is_active: input.isActive,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("Error creating supplier:", error?.message);
    throw new Error("No se pudo crear el proveedor.");
  }

  await logCurrentUserAuditEvent({
    entityType: "supplier",
    entityId: String((data as SupplierRow).id),
    action: "create",
    fromState: null,
    toState: (data as SupplierRow).category,
    metadata: {
      name: (data as SupplierRow).name,
      isActive: (data as SupplierRow).is_active,
    },
  });

  return mapSupplier(data as SupplierRow);
}

export async function updateSupplierDb(
  id: number,
  input: Partial<CreateSupplierInput>
): Promise<Supplier> {
  const updates: Database["public"]["Tables"]["suppliers"]["Update"] = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.contactName !== undefined) updates.contact_name = input.contactName;
  if (input.email !== undefined) updates.email = input.email;
  if (input.phone !== undefined) updates.phone = input.phone;
  if (input.category !== undefined) updates.category = input.category;
  if (input.isActive !== undefined) updates.is_active = input.isActive;

  const { data: currentData } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("suppliers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    console.error("Error updating supplier:", error?.message);
    throw new Error("No se pudo actualizar el proveedor.");
  }

  await logCurrentUserAuditEvent({
    entityType: "supplier",
    entityId: String(id),
    action: "update",
    fromState: (currentData as SupplierRow | null)?.category ?? null,
    toState: (data as SupplierRow).category,
    metadata: {
      changedFields: Object.keys(updates),
    },
  });

  return mapSupplier(data as SupplierRow);
}

export async function getPurchaseOrdersByProjectDb(projectId: number): Promise<PurchaseOrder[]> {
  const { orders } = await loadPurchaseOrdersWithPayments(projectId);
  return orders;
}

export async function getPurchaseOrderPaymentsByProjectDb(
  projectId: number
): Promise<PurchaseOrderPayment[]> {
  const { payments } = await loadPurchaseOrdersWithPayments(projectId);
  return payments;
}

export async function getProcurementSummaryByProjectDb(
  projectId: number
): Promise<ProcurementSummary> {
  const { summary } = await getProcurementOverviewByProjectDb(projectId);
  return summary;
}

export type CreatePurchaseOrderInput = Omit<
  PurchaseOrder,
  | "id"
  | "createdAt"
  | "receivedDate"
  | "paymentDate"
  | "totalAmount"
  | "paidAmount"
  | "remainingAmount"
  | "paymentCount"
> & {
  totalAmount?: number;
};

export async function createPurchaseOrderDb(
  input: CreatePurchaseOrderInput
): Promise<PurchaseOrder> {
  const totalAmount =
    typeof input.totalAmount === "number" && input.totalAmount >= 0
      ? input.totalAmount
      : Number(input.quantity) * Number(input.unitCost);

  const { data, error } = await supabase
    .from("purchase_orders")
    .insert({
      project_id: input.projectId,
      material_id: input.materialId,
      supplier_id: input.supplierId,
      phase_id: input.phaseId,
      work_package_id: input.workPackageId,
      category: input.category,
      description: input.description,
      unit: input.unit,
      quantity: input.quantity,
      unit_cost: input.unitCost,
      total_amount: totalAmount,
      order_date: input.orderDate,
      expected_date: input.expectedDate,
      due_date: input.dueDate,
      invoice_number: input.invoiceNumber,
      status: input.status,
      notes: input.notes,
      created_by: input.createdBy,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error creating purchase order:", error?.message);
    throw new Error("No se pudo registrar la compra.");
  }

  const row = data as PurchaseOrderRow;

  await logCurrentUserAuditEvent({
    entityType: "purchase_order",
    entityId: row.id,
    projectId: row.project_id,
    action: "create",
    fromState: null,
    toState: row.status,
    metadata: {
      materialId: row.material_id,
      supplierId: row.supplier_id,
      workPackageId: row.work_package_id,
      category: row.category,
      totalAmount: row.total_amount,
    },
  });

  return mapPurchaseOrder(row);
}

export type CreatePurchaseOrderPaymentInput = {
  purchaseOrderId: string;
  amount: number;
  paymentDate: string;
  reference?: string | null;
  notes?: string | null;
  createdBy?: number | null;
};

export async function createPurchaseOrderPaymentDb(
  input: CreatePurchaseOrderPaymentInput
): Promise<PurchaseOrderPayment> {
  const { data: orderData, error: orderError } = await supabase
    .from("purchase_orders")
    .select("*")
    .eq("id", input.purchaseOrderId)
    .single();

  if (orderError || !orderData) {
    console.error("Error loading purchase order for payment:", orderError?.message);
    throw new Error("No se encontró la compra.");
  }

  const order = orderData as PurchaseOrderRow;

  const { data, error } = await supabase
    .from("purchase_order_payments")
    .insert({
      purchase_order_id: input.purchaseOrderId,
      project_id: order.project_id,
      amount: input.amount,
      payment_date: input.paymentDate,
      reference: input.reference ?? null,
      notes: input.notes ?? null,
      created_by: input.createdBy ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error creating purchase order payment:", error?.message);
    throw new Error("No se pudo registrar el pago.");
  }

  const payment = data as PurchaseOrderPaymentRow;

  await logCurrentUserAuditEvent({
    entityType: "purchase_order_payment",
    entityId: payment.id,
    projectId: order.project_id,
    action: "create",
    fromState: null,
    toState: "paid_partial",
    metadata: {
      purchaseOrderId: order.id,
      supplierId: order.supplier_id,
      amount: payment.amount,
      paymentDate: payment.payment_date,
      reference: payment.reference,
    },
  });

  return mapPurchaseOrderPayment(payment);
}

export async function updatePurchaseOrderStatusDb(
  id: string,
  status: PurchaseOrderStatus
): Promise<PurchaseOrder> {
  const { data: currentData, error: currentError } = await supabase
    .from("purchase_orders")
    .select("*")
    .eq("id", id)
    .single();

  if (currentError || !currentData) {
    console.error("Error loading purchase order:", currentError?.message);
    throw new Error("No se encontró la compra.");
  }

  const current = currentData as PurchaseOrderRow;
  if (status === "paid") {
    throw new Error("Registrá pagos para cancelar la compra de forma total.");
  }

  if (current.status === status) {
    const orders = await getPurchaseOrdersByProjectDb(current.project_id);
    return orders.find((order) => order.id === current.id) ?? mapPurchaseOrder(current);
  }

  const { data: paymentRows } = await supabase
    .from("purchase_order_payments")
    .select("amount")
    .eq("purchase_order_id", id);

  const totalPaid = ((paymentRows ?? []) as Array<{ amount: number | null }>).reduce(
    (sum, row) => sum + Number(row.amount ?? 0),
    0
  );

  if (status === "cancelled" && totalPaid > 0) {
    throw new Error("No se puede cancelar una compra con pagos registrados.");
  }

  const updates: Database["public"]["Tables"]["purchase_orders"]["Update"] = {
    status,
  };

  if (status === "received") {
    updates.received_date = new Date().toISOString().slice(0, 10);
  }

  const { data, error } = await supabase
    .from("purchase_orders")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error updating purchase order:", error?.message);
    throw new Error("No se pudo actualizar la compra.");
  }

  const updated = data as PurchaseOrderRow;

  const materialId = current.material_id;
  const shouldReceiveStock =
    materialId &&
    ["received", "paid"].includes(status) &&
    !["received", "paid"].includes(current.status);

  if (shouldReceiveStock) {
    const { data: materialData } = await supabase
      .from("materials")
      .select("*")
      .eq("id", materialId)
      .single();

    if (materialData) {
      const material = materialData as MaterialRow;
      await supabase
        .from("materials")
        .update({
          current_stock: Number(material.current_stock) + Number(current.quantity),
        })
        .eq("id", materialId);

      await supabase.from("material_movements").insert({
        material_id: materialId,
        project_id: current.project_id,
        movement_type: "ingreso",
        quantity: current.quantity,
        note: `Recepción OC ${current.id} - ${current.description}`,
        created_by: updated.created_by,
        movement_date:
          updated.received_date ??
          updated.payment_date ??
          new Date().toISOString().slice(0, 10),
      });
    }
  }

  await logCurrentUserAuditEvent({
    entityType: "purchase_order",
    entityId: id,
    projectId: current.project_id,
    action: "status_change",
    fromState: current.status,
    toState: status,
    metadata: {
      materialId: current.material_id,
      supplierId: current.supplier_id,
      workPackageId: current.work_package_id,
      totalAmount: current.total_amount,
    },
  });

  const orders = await getPurchaseOrdersByProjectDb(updated.project_id);
  return orders.find((order) => order.id === updated.id) ?? mapPurchaseOrder(updated);
}
