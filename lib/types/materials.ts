export type MaterialMovementType = "ingreso" | "egreso";

export interface MaterialItem {
  id: string;
  projectId: number;
  name: string;
  unit: string;
  plannedQty: number;
  currentStock: number;
  reorderPoint: number;
  location: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialMovement {
  id: string;
  materialId: string;
  projectId: number;
  movementType: MaterialMovementType;
  quantity: number;
  note: string | null;
  createdBy: number | null;
  movementDate: string;
  createdAt: string;
}
