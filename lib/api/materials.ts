import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/types/supabase";
import type { MaterialItem, MaterialMovement } from "@/lib/types/materials";

type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];
type MaterialMovementRow = Database["public"]["Tables"]["material_movements"]["Row"];

function mapMaterial(row: MaterialRow): MaterialItem {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    unit: row.unit,
    plannedQty: Number(row.planned_qty),
    currentStock: Number(row.current_stock),
    reorderPoint: Number(row.reorder_point),
    location: row.location,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMovement(row: MaterialMovementRow): MaterialMovement {
  return {
    id: row.id,
    materialId: row.material_id,
    projectId: row.project_id,
    movementType: row.movement_type as MaterialMovement["movementType"],
    quantity: Number(row.quantity),
    note: row.note,
    createdBy: row.created_by,
    movementDate: row.movement_date,
    createdAt: row.created_at,
  };
}

export async function getMaterialsByProjectDb(projectId: number): Promise<MaterialItem[]> {
  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .eq("project_id", projectId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Supabase materials error:", error.message);
    return [];
  }

  return ((data ?? []) as MaterialRow[]).map(mapMaterial);
}

export async function getMaterialMovementsByProjectDb(
  projectId: number,
  limit = 20
): Promise<MaterialMovement[]> {
  const { data, error } = await supabase
    .from("material_movements")
    .select("*")
    .eq("project_id", projectId)
    .order("movement_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Supabase material_movements error:", error.message);
    return [];
  }

  return ((data ?? []) as MaterialMovementRow[]).map(mapMovement);
}

export type CreateMaterialMovementInput = {
  materialId: string;
  projectId: number;
  movementType: "ingreso" | "egreso";
  quantity: number;
  note?: string | null;
  createdBy?: number | null;
  movementDate?: string;
};

export async function createMaterialMovementDb(
  input: CreateMaterialMovementInput
): Promise<MaterialMovement> {
  const { data: materialData, error: materialError } = await supabase
    .from("materials")
    .select("*")
    .eq("id", input.materialId)
    .single();

  if (materialError || !materialData) {
    console.error("Error loading material:", materialError?.message);
    throw new Error("No se encontró el material.");
  }

  const material = materialData as MaterialRow;
  const currentStock = Number(material.current_stock);
  const quantity = Number(input.quantity);
  const nextStock =
    input.movementType === "ingreso"
      ? currentStock + quantity
      : Math.max(0, currentStock - quantity);

  const { error: stockError } = await supabase
    .from("materials")
    .update({ current_stock: nextStock })
    .eq("id", input.materialId);

  if (stockError) {
    console.error("Error updating material stock:", stockError.message);
    throw new Error("No se pudo actualizar el stock del material.");
  }

  const { data: movementData, error: movementError } = await supabase
    .from("material_movements")
    .insert({
      material_id: input.materialId,
      project_id: input.projectId,
      movement_type: input.movementType,
      quantity,
      note: input.note ?? null,
      created_by: input.createdBy ?? null,
      movement_date: input.movementDate ?? new Date().toISOString().slice(0, 10),
    })
    .select("*")
    .single();

  if (movementError || !movementData) {
    console.error("Error creating movement:", movementError?.message);
    throw new Error("No se pudo registrar el movimiento de material.");
  }

  return mapMovement(movementData as MaterialMovementRow);
}

export type CreateMaterialInput = {
  projectId: number;
  name: string;
  unit: string;
  plannedQty?: number;
  currentStock?: number;
  reorderPoint?: number;
  location?: string | null;
};

export async function createMaterialDb(input: CreateMaterialInput): Promise<MaterialItem> {
  const { data, error } = await supabase
    .from("materials")
    .insert({
      project_id: input.projectId,
      name: input.name,
      unit: input.unit,
      planned_qty: input.plannedQty ?? 0,
      current_stock: input.currentStock ?? 0,
      reorder_point: input.reorderPoint ?? 0,
      location: input.location ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error creating material:", error?.message);
    throw new Error("No se pudo crear el material.");
  }

  return mapMaterial(data as MaterialRow);
}
