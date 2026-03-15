import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/types/supabase";
import type { ChangeOrder, ChangeOrderStatus } from "@/lib/types/change-order";
import { logCurrentUserAuditEvent } from "@/lib/api/audit";

type ChangeOrderRow = Database["public"]["Tables"]["change_orders"]["Row"];
type ChangeOrderUpdate = Database["public"]["Tables"]["change_orders"]["Update"];
type ProjectBudgetControlRow = Database["public"]["Tables"]["project_budget_control"]["Row"];
type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

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

export async function getChangeOrdersByProjectDb(projectId: number): Promise<ChangeOrder[]> {
  const { data, error } = await supabase
    .from("change_orders")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase change_orders error:", error.message);
    return [];
  }

  return ((data ?? []) as ChangeOrderRow[]).map(mapChangeOrder);
}

export type CreateChangeOrderInput = {
  projectId: number;
  reason: string;
  amountDelta: number;
  daysDelta: number;
  requestedBy?: number | null;
};

export async function createChangeOrderDb(input: CreateChangeOrderInput): Promise<ChangeOrder> {
  const { data, error } = await supabase
    .from("change_orders")
    .insert({
      project_id: input.projectId,
      reason: input.reason,
      amount_delta: input.amountDelta,
      days_delta: input.daysDelta,
      status: "draft",
      requested_by: input.requestedBy ?? null,
    })
    .select("*")
    .single();

  const row = data as ChangeOrderRow | null;

  if (error) {
    console.error("Error creating change order:", error.message);
    throw new Error("No se pudo crear la orden de cambio.");
  }

  if (!row) {
    throw new Error("No se pudo crear la orden de cambio.");
  }

  await logCurrentUserAuditEvent({
    entityType: "change_order",
    entityId: row.id,
    projectId: input.projectId,
    action: "create",
    fromState: null,
    toState: "draft",
    metadata: {
      amountDelta: input.amountDelta,
      daysDelta: input.daysDelta,
      requestedBy: input.requestedBy ?? null,
    },
  });

  return mapChangeOrder(row);
}

export async function submitChangeOrderToOperatorDb(id: string): Promise<ChangeOrder> {
  const { data: currentData } = await supabase
    .from("change_orders")
    .select("*")
    .eq("id", id)
    .single();

  const updates: ChangeOrderUpdate = { status: "pending_operator" };
  const { data, error } = await supabase
    .from("change_orders")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("Error submitting change order to operator:", error.message);
    throw new Error("No se pudo enviar la orden al operador.");
  }

  const current = currentData as ChangeOrderRow | null;
  await logCurrentUserAuditEvent({
    entityType: "change_order",
    entityId: id,
    projectId: current?.project_id ?? null,
    action: "submit_to_operator",
    fromState: current?.status ?? null,
    toState: "pending_operator",
    metadata: {},
  });

  return mapChangeOrder(data as ChangeOrderRow);
}

export async function reviewChangeOrderByOperatorDb(
  id: string,
  approvedBy: number | null
): Promise<ChangeOrder> {
  const { data: currentData } = await supabase
    .from("change_orders")
    .select("*")
    .eq("id", id)
    .single();

  const updates: ChangeOrderUpdate = {
    status: "pending_client",
    approved_by: approvedBy,
    operator_reviewed_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("change_orders")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("Error operator-reviewing change order:", error.message);
    throw new Error("No se pudo visado por operador.");
  }

  const current = currentData as ChangeOrderRow | null;
  await logCurrentUserAuditEvent({
    entityType: "change_order",
    entityId: id,
    projectId: current?.project_id ?? null,
    action: "review_by_operator",
    fromState: current?.status ?? null,
    toState: "pending_client",
    metadata: {
      approvedBy,
    },
  });

  return mapChangeOrder(data as ChangeOrderRow);
}

export async function decideChangeOrderByClientDb(
  id: string,
  decision: "approved" | "rejected",
  clientComment?: string | null
): Promise<ChangeOrder> {
  const { data: orderData, error: orderError } = await supabase
    .from("change_orders")
    .select("*")
    .eq("id", id)
    .single();

  if (orderError || !orderData) {
    console.error("Error loading change order:", orderError?.message);
    throw new Error("No se encontró la orden de cambio.");
  }

  const order = orderData as ChangeOrderRow;

  const updates: ChangeOrderUpdate = {
    status: decision,
    approved_at: decision === "approved" ? new Date().toISOString() : null,
    client_reviewed_at: new Date().toISOString(),
    client_comment: clientComment ?? null,
  };

  const { data: updatedOrderData, error: updateError } = await supabase
    .from("change_orders")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError || !updatedOrderData) {
    console.error("Error updating change order by client:", updateError?.message);
    throw new Error("No se pudo registrar la decisión del cliente.");
  }

  if (decision === "approved") {
    // Update project budget control
    const { data: budgetData, error: budgetError } = await supabase
      .from("project_budget_control")
      .select("*")
      .eq("project_id", order.project_id)
      .single();

    if (!budgetError && budgetData) {
      const budget = budgetData as ProjectBudgetControlRow;
      await supabase
        .from("project_budget_control")
        .update({
          current_amount: Number(budget.current_amount) + Number(order.amount_delta),
          updated_at: new Date().toISOString(),
        })
        .eq("project_id", order.project_id);
    }

    // Shift project end date if required
    if (order.days_delta > 0) {
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("end_date")
        .eq("id", order.project_id)
        .single();

      if (!projectError && projectData?.end_date) {
        const currentEndDate = new Date(projectData.end_date);
        currentEndDate.setDate(currentEndDate.getDate() + order.days_delta);
        const projectUpdate: ProjectUpdate = {
          end_date: currentEndDate.toISOString().slice(0, 10),
        };
        await supabase.from("projects").update(projectUpdate).eq("id", order.project_id);
      }
    }
  }

  await logCurrentUserAuditEvent({
    entityType: "change_order",
    entityId: id,
    projectId: order.project_id,
    action: "client_decision",
    fromState: order.status,
    toState: decision,
    metadata: {
      clientComment: clientComment ?? null,
      amountDelta: order.amount_delta,
      daysDelta: order.days_delta,
    },
  });

  return mapChangeOrder(updatedOrderData as ChangeOrderRow);
}
