"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Milestone } from "@/lib/types/progress";
import { getMilestonesByProjectDb, updateMilestoneStatusDb } from "@/lib/api/progress";

interface MilestonesBoardProps {
  projectId: string;
}

const STATUS_LABELS: Record<Milestone["status"], string> = {
  pending: "Pendiente",
  "in-progress": "En progreso",
  completed: "Completado",
  delayed: "Demorado",
};

export function MilestonesBoard({ projectId }: MilestonesBoardProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getMilestonesByProjectDb(Number(projectId));
    setMilestones(data);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedMilestones = useMemo(
    () => [...milestones].sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [milestones]
  );

  const updateStatus = async (id: string, status: Milestone["status"]) => {
    setUpdatingId(id);
    try {
      await updateMilestoneStatusDb(id, status);
      toast.success("Estado del hito actualizado.");
      await load();
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
                <Badge variant="outline">{STATUS_LABELS[milestone.status]}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Vence: {new Date(milestone.dueDate).toLocaleDateString("es-AR")}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={milestone.status === "pending" ? "default" : "outline"}
                  disabled={updatingId === milestone.id}
                  onClick={() => updateStatus(milestone.id, "pending")}
                >
                  Pendiente
                </Button>
                <Button
                  size="sm"
                  variant={milestone.status === "in-progress" ? "default" : "outline"}
                  disabled={updatingId === milestone.id}
                  onClick={() => updateStatus(milestone.id, "in-progress")}
                >
                  En progreso
                </Button>
                <Button
                  size="sm"
                  variant={milestone.status === "completed" ? "default" : "outline"}
                  disabled={updatingId === milestone.id}
                  onClick={() => updateStatus(milestone.id, "completed")}
                >
                  Completado
                </Button>
                <Button
                  size="sm"
                  variant={milestone.status === "delayed" ? "default" : "outline"}
                  disabled={updatingId === milestone.id}
                  onClick={() => updateStatus(milestone.id, "delayed")}
                >
                  Demorado
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
