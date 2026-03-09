"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { AppRole } from "@/lib/auth/roles";
import {
  CHANGE_ORDER_STATUS_LABELS,
  type ChangeOrder,
} from "@/lib/types/change-order";
import {
  createChangeOrderDb,
  getChangeOrdersByProjectDb,
  reviewChangeOrderByOperatorDb,
  submitChangeOrderToOperatorDb,
} from "@/lib/api/change-orders";

interface ChangeOrdersBoardProps {
  projectId: string;
  role: AppRole | null;
}

export function ChangeOrdersBoard({ projectId, role }: ChangeOrdersBoardProps) {
  const [orders, setOrders] = useState<ChangeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [reason, setReason] = useState("");
  const [amountDelta, setAmountDelta] = useState(0);
  const [daysDelta, setDaysDelta] = useState(0);

  const canCreate = role === "pm" || role === "operator";
  const canReview = role === "operator";

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const data = await getChangeOrdersByProjectDb(Number(projectId));
    setOrders(data);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders]
  );

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canCreate) return;
    setSubmitting(true);
    try {
      await createChangeOrderDb({
        projectId: Number(projectId),
        reason,
        amountDelta,
        daysDelta,
      });
      toast.success("Orden de cambio creada en borrador.");
      setReason("");
      setAmountDelta(0);
      setDaysDelta(0);
      await loadOrders();
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo crear la orden.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitToOperator = async (id: string) => {
    try {
      await submitChangeOrderToOperatorDb(id);
      toast.success("Orden enviada para revisión de operador.");
      await loadOrders();
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo enviar la orden.");
    }
  };

  const handleOperatorReview = async (id: string) => {
    try {
      await reviewChangeOrderByOperatorDb(id, null);
      toast.success("Orden visada y enviada al cliente.");
      await loadOrders();
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo visar la orden.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {canCreate ? (
        <Card>
          <CardHeader>
            <CardTitle>Nueva Orden de Cambio</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3" onSubmit={handleCreate}>
              <div className="space-y-1.5">
                <Label htmlFor="coReason">Motivo</Label>
                <Textarea
                  id="coReason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Describe alcance, causa e impacto."
                  required
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="coAmount">Impacto costo (USD)</Label>
                  <Input
                    id="coAmount"
                    type="number"
                    min={0}
                    step={0.01}
                    value={amountDelta}
                    onChange={(event) => setAmountDelta(Number(event.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="coDays">Impacto plazo (días)</Label>
                  <Input
                    id="coDays"
                    type="number"
                    min={0}
                    value={daysDelta}
                    onChange={(event) => setDaysDelta(Number(event.target.value))}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Guardando..." : "Crear Orden"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card className={canCreate ? "" : "lg:col-span-2"}>
        <CardHeader>
          <CardTitle>Historial de Órdenes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando órdenes...</p>
          ) : sortedOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay órdenes registradas.</p>
          ) : (
            sortedOrders.map((order) => (
              <div key={order.id} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline">
                    {CHANGE_ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("es-AR")}
                  </span>
                </div>
                <p className="text-sm">{order.reason}</p>
                <div className="text-xs text-muted-foreground flex gap-3">
                  <span>Δ Costo: USD {order.amountDelta.toLocaleString()}</span>
                  <span>Δ Plazo: {order.daysDelta} días</span>
                </div>

                <div className="flex gap-2">
                  {role === "pm" && order.status === "draft" ? (
                    <Button size="sm" onClick={() => handleSubmitToOperator(order.id)}>
                      Enviar a Operador
                    </Button>
                  ) : null}
                  {canReview && order.status === "pending_operator" ? (
                    <Button size="sm" onClick={() => handleOperatorReview(order.id)}>
                      Visar y Enviar al Cliente
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
