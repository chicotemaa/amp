"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getSupabaseAuthBrowserClient } from "@/lib/supabase/auth-browser";
import type { Milestone } from "@/lib/types/progress";
import { getMilestonesByProjectDb, updateMilestoneStatusDb } from "@/lib/api/progress";
import { can, type AppRole } from "@/lib/auth/roles";

interface MilestonesBoardProps {
  projectId: string;
  role: AppRole | null;
}

const STATUS_LABELS: Record<Milestone["status"], string> = {
  pending: "Pendiente",
  field_completed: "Completado en campo",
  validated: "Validado",
  published: "Publicado",
  closed: "Cerrado",
  rejected: "Rechazado",
};

export function MilestonesBoard({ projectId, role }: MilestonesBoardProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<number | null>(null);

  const canCompleteField = can(role, "operations.execute");
  const canValidate = can(role, "progress.validate");
  const canPublish = can(role, "client_publication.manage");

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getMilestonesByProjectDb(Number(projectId));
    setMilestones(data);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const loadEmployee = async () => {
      const supabase = getSupabaseAuthBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("employee_id")
        .eq("id", user.id)
        .single();

      setEmployeeId(profile?.employee_id ?? null);
    };

    void loadEmployee();
  }, []);

  const sortedMilestones = useMemo(
    () => [...milestones].sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [milestones]
  );

  const updateStatus = async (id: string, status: Milestone["status"]) => {
    setUpdatingId(id);
    try {
      await updateMilestoneStatusDb(id, status, employeeId);
      toast.success("Estado del hito actualizado.");
      await load();
      window.dispatchEvent(new Event("projectProgressUpdated"));
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo actualizar el hito.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hitos de Obra</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando hitos...</p>
        ) : sortedMilestones.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay hitos registrados.</p>
        ) : (
          sortedMilestones.map((milestone) => (
            <div key={milestone.id} className="rounded-md border p-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{milestone.name}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{STATUS_LABELS[milestone.status]}</Badge>
                  {milestone.isClientVisible ? <Badge>Cliente visible</Badge> : null}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Vence: {new Date(milestone.dueDate).toLocaleDateString("es-AR")}
              </p>
              {milestone.fieldCompletedAt ? (
                <p className="text-xs text-muted-foreground">
                  Campo: {new Date(milestone.fieldCompletedAt).toLocaleDateString("es-AR")}
                </p>
              ) : null}
              {milestone.validatedAt ? (
                <p className="text-xs text-muted-foreground">
                  Validado: {new Date(milestone.validatedAt).toLocaleDateString("es-AR")}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {canCompleteField && milestone.status === "pending" ? (
                  <Button
                    size="sm"
                    disabled={updatingId === milestone.id}
                    onClick={() => updateStatus(milestone.id, "field_completed")}
                  >
                    Completar en campo
                  </Button>
                ) : null}
                {canValidate && milestone.status === "field_completed" ? (
                  <Button
                    size="sm"
                    disabled={updatingId === milestone.id}
                    onClick={() => updateStatus(milestone.id, "validated")}
                  >
                    Validar
                  </Button>
                ) : null}
                {canPublish && milestone.status === "validated" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updatingId === milestone.id}
                    onClick={() => updateStatus(milestone.id, "published")}
                  >
                    Publicar al cliente
                  </Button>
                ) : null}
                {canValidate && milestone.status === "field_completed" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updatingId === milestone.id}
                    onClick={() => updateStatus(milestone.id, "rejected")}
                  >
                    Rechazar
                  </Button>
                ) : null}
                {canValidate && (milestone.status === "validated" || milestone.status === "published") ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updatingId === milestone.id}
                    onClick={() => updateStatus(milestone.id, "closed")}
                  >
                    Cerrar
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
