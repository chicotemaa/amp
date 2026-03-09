"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { ChangeOrder } from "@/lib/types/change-order";
import { CHANGE_ORDER_STATUS_LABELS } from "@/lib/types/change-order";
import { decideChangeOrderByClientDb } from "@/lib/api/change-orders";

interface ChangeOrdersClientPanelProps {
  initialOrders: ChangeOrder[];
}

export function ChangeOrdersClientPanel({ initialOrders }: ChangeOrdersClientPanelProps) {
  const [orders, setOrders] = useState<ChangeOrder[]>(initialOrders);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [commentById, setCommentById] = useState<Record<string, string>>({});

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === "pending_client"),
    [orders]
  );

  const decide = async (id: string, decision: "approved" | "rejected") => {
    setLoadingId(id);
    try {
      const updated = await decideChangeOrderByClientDb(id, decision, commentById[id] ?? null);
      setOrders((prev) => prev.map((order) => (order.id === id ? updated : order)));
      toast.success(
        decision === "approved"
          ? "Orden aprobada. Se actualizó presupuesto/plazo."
          : "Orden rechazada."
      );
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo registrar la decisión.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Órdenes de Cambio Pendientes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tienes órdenes de cambio pendientes de aprobación.
          </p>
        ) : (
          pendingOrders.map((order) => (
            <div key={order.id} className="rounded-md border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{CHANGE_ORDER_STATUS_LABELS[order.status]}</Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("es-AR")}
                </span>
              </div>
              <p className="text-sm">{order.reason}</p>
              <div className="text-xs text-muted-foreground flex gap-3">
                <span>Impacto: +USD {order.amountDelta.toLocaleString()}</span>
                <span>Plazo: +{order.daysDelta} días</span>
              </div>
              <Textarea
                placeholder="Comentario para el equipo (opcional)"
                value={commentById[order.id] ?? ""}
                onChange={(event) =>
                  setCommentById((prev) => ({ ...prev, [order.id]: event.target.value }))
                }
                rows={2}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  disabled={loadingId === order.id}
                  onClick={() => decide(order.id, "rejected")}
                >
                  Rechazar
                </Button>
                <Button
                  disabled={loadingId === order.id}
                  onClick={() => decide(order.id, "approved")}
                >
                  Aprobar
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

