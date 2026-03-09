"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getSupabaseAuthBrowserClient } from "@/lib/supabase/auth-browser";
import {
  createMaterialMovementDb,
  getMaterialMovementsByProjectDb,
  getMaterialsByProjectDb,
} from "@/lib/api/materials";
import type { MaterialItem, MaterialMovementType } from "@/lib/types/materials";

interface MaterialsTrackingProps {
  projectId: string;
}

function getStockBadgeVariant(material: MaterialItem) {
  if (material.currentStock <= material.reorderPoint) return "destructive";
  if (material.currentStock <= material.plannedQty * 0.4) return "secondary";
  return "default";
}

function getStockLabel(material: MaterialItem) {
  if (material.currentStock <= material.reorderPoint) return "Stock Bajo";
  if (material.currentStock <= material.plannedQty * 0.4) return "En Uso";
  return "En Stock";
}

export function MaterialsTracking({ projectId }: MaterialsTrackingProps) {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<number | null>(null);

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [movementType, setMovementType] = useState<MaterialMovementType>("egreso");
  const [quantity, setQuantity] = useState<number>(0);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedMaterial = useMemo(
    () => materials.find((m) => m.id === selectedMaterialId) ?? null,
    [materials, selectedMaterialId]
  );

  const loadMaterials = useCallback(async () => {
    setIsLoading(true);
    const data = await getMaterialsByProjectDb(Number(projectId));
    setMaterials(data);
    if (data.length > 0 && !selectedMaterialId) {
      setSelectedMaterialId(data[0].id);
    }
    setIsLoading(false);
  }, [projectId, selectedMaterialId]);

  useEffect(() => {
    void loadMaterials();
  }, [loadMaterials]);

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

  const handleMovementSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedMaterialId || quantity <= 0) return;
    setIsSubmitting(true);
    try {
      await createMaterialMovementDb({
        materialId: selectedMaterialId,
        projectId: Number(projectId),
        movementType,
        quantity,
        note: note.trim() || null,
        createdBy: employeeId,
      });
      toast.success("Movimiento de material registrado.");
      setQuantity(0);
      setNote("");
      await loadMaterials();
      await getMaterialMovementsByProjectDb(Number(projectId), 1);
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo registrar el movimiento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Control de Materiales</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando materiales...</p>
        </CardContent>
      </Card>
    );
  }

  if (materials.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Control de Materiales</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No hay materiales configurados para este proyecto. Ejecuta la migración
            `007_materials_management.sql` o carga materiales base.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Control de Materiales</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {materials.map((material) => (
            <div
              key={material.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <Package className="h-8 w-8 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">{material.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {material.location ?? "Sin ubicación"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium">
                    {material.currentStock.toLocaleString()} {material.unit}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Plan: {material.plannedQty.toLocaleString()} {material.unit}
                  </p>
                </div>
                <Badge variant={getStockBadgeVariant(material)}>
                  {getStockLabel(material)}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border p-4">
          <h4 className="font-medium mb-3">Registrar Movimiento</h4>
          <form className="grid gap-3" onSubmit={handleMovementSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="materialId">Material</Label>
                <select
                  id="materialId"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={selectedMaterialId}
                  onChange={(event) => setSelectedMaterialId(event.target.value)}
                  required
                >
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="movementType">Tipo</Label>
                <select
                  id="movementType"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={movementType}
                  onChange={(event) =>
                    setMovementType(event.target.value as MaterialMovementType)
                  }
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="movementQty">
                  Cantidad ({selectedMaterial?.unit ?? "unidad"})
                </Label>
                <Input
                  id="movementQty"
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="movementNote">Nota</Label>
                <Textarea
                  id="movementNote"
                  rows={1}
                  placeholder="Ej: Recepción proveedor / consumo frente norte"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Registrar Movimiento"}
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
