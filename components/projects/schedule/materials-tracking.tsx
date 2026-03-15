"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin, Package } from "lucide-react";
import { toast } from "sonner";
import { getSupabaseAuthBrowserClient } from "@/lib/supabase/auth-browser";
import {
  createMaterialDb,
  createMaterialMovementDb,
  getMaterialMovementsByProjectDb,
  getMaterialsByProjectDb,
} from "@/lib/api/materials";
import { getProjectPhasesDb, getWorkPackagesByProjectDb } from "@/lib/api/progress";
import {
  createPurchaseOrderDb,
  createPurchaseOrderPaymentDb,
  getProcurementOverviewByProjectDb,
  getSuppliersDb,
  updatePurchaseOrderStatusDb,
} from "@/lib/api/procurement";
import type { MaterialItem, MaterialMovement, MaterialMovementType } from "@/lib/types/materials";
import type { ProjectPhase, WorkPackage } from "@/lib/types/progress";
import type {
  ProcurementSummary,
  PurchaseOrder,
  PurchaseOrderPayment,
  PurchaseOrderCategory,
  PurchaseOrderStatus,
  Supplier,
} from "@/lib/types/procurement";
import {
  PURCHASE_ORDER_CATEGORY_LABELS,
  PURCHASE_ORDER_STATUS_LABELS,
} from "@/lib/types/procurement";
import type { AppRole } from "@/lib/auth/roles";
import { can } from "@/lib/auth/roles";

interface MaterialsTrackingProps {
  projectId: string;
}

const money = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

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

function getPurchaseOrderBadgeVariant(status: PurchaseOrderStatus) {
  if (status === "cancelled") return "destructive";
  if (status === "paid") return "default";
  if (status === "received") return "secondary";
  return "outline";
}

function getMovementBadgeVariant(type: MaterialMovementType) {
  return type === "ingreso" ? "secondary" : "outline";
}

function getNextPurchaseOrderStatus(
  status: PurchaseOrderStatus
): PurchaseOrderStatus | null {
  if (status === "draft") return "ordered";
  if (status === "ordered") return "received";
  return null;
}

function getNextPurchaseOrderActionLabel(status: PurchaseOrderStatus) {
  if (status === "draft") return "Emitir";
  if (status === "ordered") return "Recibir";
  return null;
}

export function MaterialsTracking({ projectId }: MaterialsTrackingProps) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [movements, setMovements] = useState<MaterialMovement[]>([]);
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [purchasePayments, setPurchasePayments] = useState<PurchaseOrderPayment[]>([]);
  const [procurementSummary, setProcurementSummary] = useState<ProcurementSummary>({
    totalOrders: 0,
    orderedAmount: 0,
    receivedAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    partiallyPaidOrders: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [movementType, setMovementType] = useState<MaterialMovementType>("egreso");
  const [quantity, setQuantity] = useState<number>(0);
  const [note, setNote] = useState("");
  const [isSubmittingMovement, setIsSubmittingMovement] = useState(false);
  const [isCreatingMaterial, setIsCreatingMaterial] = useState(false);
  const [isCreatingPurchaseOrder, setIsCreatingPurchaseOrder] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const [newMaterialName, setNewMaterialName] = useState("");
  const [newMaterialUnit, setNewMaterialUnit] = useState("unidades");
  const [newMaterialPlanned, setNewMaterialPlanned] = useState(0);
  const [newMaterialStock, setNewMaterialStock] = useState(0);
  const [newMaterialReorderPoint, setNewMaterialReorderPoint] = useState(0);
  const [newMaterialLocation, setNewMaterialLocation] = useState("");

  const [supplierId, setSupplierId] = useState<string>("");
  const [purchaseMaterialId, setPurchaseMaterialId] = useState<string>("none");
  const [purchasePhaseId, setPurchasePhaseId] = useState<string>("none");
  const [purchaseWorkPackageId, setPurchaseWorkPackageId] = useState<string>("none");
  const [purchaseCategory, setPurchaseCategory] =
    useState<PurchaseOrderCategory>("materials");
  const [purchaseDescription, setPurchaseDescription] = useState("");
  const [purchaseUnit, setPurchaseUnit] = useState("u");
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [purchaseUnitCost, setPurchaseUnitCost] = useState(0);
  const [purchaseOrderDate, setPurchaseOrderDate] = useState(today);
  const [purchaseExpectedDate, setPurchaseExpectedDate] = useState("");
  const [purchaseDueDate, setPurchaseDueDate] = useState("");
  const [purchaseInvoiceNumber, setPurchaseInvoiceNumber] = useState("");
  const [purchaseStatus, setPurchaseStatus] = useState<PurchaseOrderStatus>("ordered");
  const [purchaseNotes, setPurchaseNotes] = useState("");
  const [paymentOrderId, setPaymentOrderId] = useState<string>("none");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(today);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const selectedMaterial = useMemo(
    () => materials.find((material) => material.id === selectedMaterialId) ?? null,
    [materials, selectedMaterialId]
  );

  const selectedPurchaseMaterial = useMemo(
    () =>
      purchaseMaterialId !== "none"
        ? materials.find((material) => material.id === purchaseMaterialId) ?? null
        : null,
    [materials, purchaseMaterialId]
  );
  const selectedPurchasePhaseWorkPackages = useMemo(() => {
    if (purchasePhaseId === "none") return [];
    return workPackages.filter((workPackage) => workPackage.phaseId === purchasePhaseId);
  }, [purchasePhaseId, workPackages]);

  const lowStockCount = useMemo(
    () => materials.filter((material) => material.currentStock <= material.reorderPoint).length,
    [materials]
  );
  const canManageProcurement = can(role, "operations.plan");
  const canMarkReceipt = can(role, "operations.execute");
  const overdueOrderCount = useMemo(
    () =>
      purchaseOrders.filter(
        (order) => order.dueDate !== null && order.remainingAmount > 0 && order.dueDate < today
      ).length,
    [purchaseOrders, today]
  );
  const payableOrders = useMemo(
    () =>
      purchaseOrders.filter(
        (order) =>
          canManageProcurement &&
          ["received", "paid"].includes(order.status) &&
          order.remainingAmount > 0
      ),
    [canManageProcurement, purchaseOrders]
  );
  const selectedPaymentOrder = useMemo(
    () =>
      paymentOrderId !== "none"
        ? purchaseOrders.find((order) => order.id === paymentOrderId) ?? null
        : null,
    [paymentOrderId, purchaseOrders]
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    const [
      materialsData,
      movementsData,
      phasesData,
      workPackagesData,
      suppliersData,
      procurementData,
    ] = await Promise.all([
      getMaterialsByProjectDb(Number(projectId)),
      getMaterialMovementsByProjectDb(Number(projectId), 8),
      getProjectPhasesDb(Number(projectId)),
      getWorkPackagesByProjectDb(Number(projectId)),
      getSuppliersDb(),
      getProcurementOverviewByProjectDb(Number(projectId)),
    ]);

    setMaterials(materialsData);
    setMovements(movementsData);
    setPhases(phasesData);
    setWorkPackages(workPackagesData);
    setSuppliers(suppliersData);
    setPurchaseOrders(procurementData.orders);
    setPurchasePayments(procurementData.payments);
    setProcurementSummary(procurementData.summary);

    if (materialsData.length > 0 && !selectedMaterialId) {
      setSelectedMaterialId(materialsData[0].id);
    }

    setIsLoading(false);
  }, [projectId, selectedMaterialId]);

  useEffect(() => {
    void load();

    const handleUpdated = () => {
      void load();
    };

    window.addEventListener("projectProcurementUpdated", handleUpdated);
    window.addEventListener("projectMaterialsUpdated", handleUpdated);
    window.addEventListener("projectPlanningUpdated", handleUpdated);

    return () => {
      window.removeEventListener("projectProcurementUpdated", handleUpdated);
      window.removeEventListener("projectMaterialsUpdated", handleUpdated);
      window.removeEventListener("projectPlanningUpdated", handleUpdated);
    };
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
        .select("employee_id, role")
        .eq("id", user.id)
        .single();

      setEmployeeId(profile?.employee_id ?? null);
      setRole((profile?.role as AppRole | null) ?? null);
    };

    void loadEmployee();
  }, []);

  useEffect(() => {
    if (!selectedPurchaseMaterial) return;

    setPurchaseCategory("materials");
    setPurchaseDescription(selectedPurchaseMaterial.name);
    setPurchaseUnit(selectedPurchaseMaterial.unit);
  }, [selectedPurchaseMaterial]);

  useEffect(() => {
    if (purchasePhaseId === "none" || selectedPurchasePhaseWorkPackages.length === 0) {
      setPurchaseWorkPackageId("none");
      return;
    }

    if (
      purchaseWorkPackageId === "none" ||
      !selectedPurchasePhaseWorkPackages.some(
        (workPackage) => workPackage.id === purchaseWorkPackageId
      )
    ) {
      setPurchaseWorkPackageId(selectedPurchasePhaseWorkPackages[0].id);
    }
  }, [purchasePhaseId, purchaseWorkPackageId, selectedPurchasePhaseWorkPackages]);

  useEffect(() => {
    if (payableOrders.length === 0) {
      setPaymentOrderId("none");
      setPaymentAmount(0);
      return;
    }

    if (paymentOrderId === "none" || !payableOrders.some((order) => order.id === paymentOrderId)) {
      setPaymentOrderId(payableOrders[0].id);
      setPaymentAmount(payableOrders[0].remainingAmount);
    }
  }, [payableOrders, paymentOrderId]);

  useEffect(() => {
    if (!selectedPaymentOrder) return;
    setPaymentAmount(selectedPaymentOrder.remainingAmount);
  }, [selectedPaymentOrder]);

  const handleMovementSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedMaterialId || quantity <= 0) return;

    setIsSubmittingMovement(true);
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
      await load();
      window.dispatchEvent(new Event("projectMaterialsUpdated"));
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo registrar el movimiento.");
    } finally {
      setIsSubmittingMovement(false);
    }
  };

  const handleCreateMaterial = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newMaterialName.trim()) return;

    setIsCreatingMaterial(true);
    try {
      const created = await createMaterialDb({
        projectId: Number(projectId),
        name: newMaterialName.trim(),
        unit: newMaterialUnit.trim() || "unidades",
        plannedQty: Number(newMaterialPlanned),
        currentStock: Number(newMaterialStock),
        reorderPoint: Number(newMaterialReorderPoint),
        location: newMaterialLocation.trim() || null,
      });

      toast.success("Material creado.");
      setNewMaterialName("");
      setNewMaterialUnit("unidades");
      setNewMaterialPlanned(0);
      setNewMaterialStock(0);
      setNewMaterialReorderPoint(0);
      setNewMaterialLocation("");
      setSelectedMaterialId(created.id);
      setPurchaseMaterialId(created.id);
      await load();
      window.dispatchEvent(new Event("projectMaterialsUpdated"));
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo crear el material.");
    } finally {
      setIsCreatingMaterial(false);
    }
  };

  const handleCreatePurchaseOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageProcurement || !supplierId || !purchaseDescription.trim() || purchaseQuantity <= 0) {
      return;
    }

    setIsCreatingPurchaseOrder(true);
    try {
      await createPurchaseOrderDb({
        projectId: Number(projectId),
        materialId: purchaseMaterialId === "none" ? null : purchaseMaterialId,
        supplierId: Number(supplierId),
        phaseId: purchasePhaseId === "none" ? null : purchasePhaseId,
        workPackageId:
          purchasePhaseId !== "none" && purchaseWorkPackageId !== "none"
            ? purchaseWorkPackageId
            : null,
        category: purchaseCategory,
        description: purchaseDescription.trim(),
        unit: purchaseUnit.trim() || "u",
        quantity: purchaseQuantity,
        unitCost: purchaseUnitCost,
        orderDate: purchaseOrderDate,
        expectedDate: purchaseExpectedDate || null,
        dueDate: purchaseDueDate || null,
        invoiceNumber: purchaseInvoiceNumber.trim() || null,
        status: purchaseStatus,
        notes: purchaseNotes.trim() || null,
        createdBy: employeeId,
      });

      toast.success("Orden de compra registrada.");
      setSupplierId("");
      setPurchaseMaterialId("none");
      setPurchasePhaseId("none");
      setPurchaseWorkPackageId("none");
      setPurchaseCategory("materials");
      setPurchaseDescription("");
      setPurchaseUnit("u");
      setPurchaseQuantity(1);
      setPurchaseUnitCost(0);
      setPurchaseOrderDate(today);
      setPurchaseExpectedDate("");
      setPurchaseDueDate("");
      setPurchaseInvoiceNumber("");
      setPurchaseStatus("ordered");
      setPurchaseNotes("");
      await load();
      window.dispatchEvent(new Event("projectProcurementUpdated"));
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo registrar la compra.");
    } finally {
      setIsCreatingPurchaseOrder(false);
    }
  };

  const handleAdvancePurchaseOrder = async (order: PurchaseOrder) => {
    const nextStatus = getNextPurchaseOrderStatus(order.status);
    const canAdvance =
      (order.status === "draft" && canManageProcurement) ||
      (order.status === "ordered" && canMarkReceipt) ||
      false;
    if (!nextStatus || !canAdvance) return;

    setUpdatingOrderId(order.id);
    try {
      await updatePurchaseOrderStatusDb(order.id, nextStatus);
      toast.success(
        nextStatus === "received"
          ? "Compra marcada como recibida."
          : nextStatus === "paid"
            ? "Compra marcada como pagada."
            : "Compra actualizada."
      );
      await load();
      window.dispatchEvent(new Event("projectProcurementUpdated"));
      if (["received", "paid"].includes(nextStatus)) {
        window.dispatchEvent(new Event("projectMaterialsUpdated"));
      }
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo actualizar la compra.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCreatePayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPaymentOrder || paymentAmount <= 0 || paymentAmount > selectedPaymentOrder.remainingAmount) {
      return;
    }

    setIsSubmittingPayment(true);
    try {
      await createPurchaseOrderPaymentDb({
        purchaseOrderId: selectedPaymentOrder.id,
        amount: paymentAmount,
        paymentDate,
        reference: paymentReference.trim() || null,
        notes: paymentNotes.trim() || null,
        createdBy: employeeId,
      });

      toast.success("Pago registrado.");
      setPaymentReference("");
      setPaymentNotes("");
      await load();
      window.dispatchEvent(new Event("projectProcurementUpdated"));
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo registrar el pago.");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Materiales y Compras</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando control de materiales...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Materiales y Compras</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-5">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Materiales activos</p>
            <p className="text-xl font-semibold">{materials.length}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Stock crítico</p>
            <p className="text-xl font-semibold">{lowStockCount}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Compras ordenadas</p>
            <p className="text-xl font-semibold">{money(procurementSummary.orderedAmount)}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Pendiente de pagar</p>
            <p className="text-xl font-semibold">{money(procurementSummary.pendingAmount)}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Compras vencidas</p>
            <p className="text-xl font-semibold">{overdueOrderCount}</p>
            <p className="text-xs text-muted-foreground">
              {money(procurementSummary.overdueAmount)}
            </p>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h4 className="mb-3 font-medium">Nuevo Material</h4>
          <form className="grid gap-3" onSubmit={handleCreateMaterial}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="newMaterialName">Nombre</Label>
                <Input
                  id="newMaterialName"
                  value={newMaterialName}
                  onChange={(event) => setNewMaterialName(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newMaterialUnit">Unidad</Label>
                <Input
                  id="newMaterialUnit"
                  value={newMaterialUnit}
                  onChange={(event) => setNewMaterialUnit(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="newMaterialPlanned">Plan</Label>
                <Input
                  id="newMaterialPlanned"
                  type="number"
                  min={0}
                  step={0.01}
                  value={newMaterialPlanned}
                  onChange={(event) => setNewMaterialPlanned(Number(event.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newMaterialStock">Stock inicial</Label>
                <Input
                  id="newMaterialStock"
                  type="number"
                  min={0}
                  step={0.01}
                  value={newMaterialStock}
                  onChange={(event) => setNewMaterialStock(Number(event.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newMaterialReorderPoint">Punto de reposición</Label>
                <Input
                  id="newMaterialReorderPoint"
                  type="number"
                  min={0}
                  step={0.01}
                  value={newMaterialReorderPoint}
                  onChange={(event) =>
                    setNewMaterialReorderPoint(Number(event.target.value))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newMaterialLocation">Ubicación</Label>
              <Input
                id="newMaterialLocation"
                value={newMaterialLocation}
                onChange={(event) => setNewMaterialLocation(event.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isCreatingMaterial}>
                {isCreatingMaterial ? "Creando..." : "Crear Material"}
              </Button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Stock actual</h4>
            <p className="text-xs text-muted-foreground">
              Seguimiento por material y punto de reposición
            </p>
          </div>

          {materials.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No hay materiales cargados todavía para esta obra.
            </div>
          ) : (
            materials.map((material) => (
              <div
                key={material.id}
                className="flex items-center justify-between rounded-lg border p-4"
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
            ))
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h4 className="mb-3 font-medium">Registrar Movimiento</h4>
            <form className="grid gap-3" onSubmit={handleMovementSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Material</Label>
                  <Select
                    disabled={materials.length === 0}
                    value={selectedMaterialId}
                    onValueChange={setSelectedMaterialId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select
                    value={movementType}
                    onValueChange={(value) => setMovementType(value as MaterialMovementType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ingreso">Ingreso</SelectItem>
                      <SelectItem value="egreso">Egreso</SelectItem>
                    </SelectContent>
                  </Select>
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
                    placeholder="Ej: consumo frente norte"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmittingMovement || materials.length === 0}
                >
                  {isSubmittingMovement ? "Guardando..." : "Registrar Movimiento"}
                </Button>
              </div>
            </form>
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-medium">Últimos movimientos</h4>
              <p className="text-xs text-muted-foreground">{movements.length} registros</p>
            </div>

            {movements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no hay movimientos de stock registrados.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Nota</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => {
                    const movementMaterial = materials.find(
                      (material) => material.id === movement.materialId
                    );

                    return (
                      <TableRow key={movement.id}>
                        <TableCell>{movement.movementDate}</TableCell>
                        <TableCell>
                          <Badge variant={getMovementBadgeVariant(movement.movementType)}>
                            {movement.movementType === "ingreso" ? "Ingreso" : "Egreso"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {movement.quantity} {movementMaterial?.unit ?? "u"}
                        </TableCell>
                        <TableCell className="max-w-[240px] truncate">
                          {movement.note ?? movementMaterial?.name ?? "Sin detalle"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h4 className="font-medium">Órdenes de compra</h4>
              <p className="text-sm text-muted-foreground">
                Alta, recepción y pago de materiales, servicios y subcontratos.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-right text-xs text-muted-foreground sm:grid-cols-5">
              <div>
                <p>Ordenado</p>
                <p className="font-medium text-foreground">
                  {money(procurementSummary.orderedAmount)}
                </p>
              </div>
              <div>
                <p>Recibido</p>
                <p className="font-medium text-foreground">
                  {money(procurementSummary.receivedAmount)}
                </p>
              </div>
              <div>
                <p>Pagado</p>
                <p className="font-medium text-foreground">
                  {money(procurementSummary.paidAmount)}
                </p>
              </div>
              <div>
                <p>Pendiente</p>
                <p className="font-medium text-foreground">
                  {money(procurementSummary.pendingAmount)}
                </p>
              </div>
              <div>
                <p>Vencido</p>
                <p className="font-medium text-foreground">
                  {money(procurementSummary.overdueAmount)}
                </p>
              </div>
            </div>
          </div>

          {suppliers.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No hay proveedores disponibles. Corré `016_suppliers_and_purchase_orders.sql`
              o cargá proveedores en Supabase.
            </div>
          ) : !canManageProcurement ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Podés consultar compras y recepcionar órdenes emitidas, pero el alta y pago de
              órdenes quedan reservados a dirección o PM.
            </div>
          ) : (
            <form className="grid gap-4 border-b pb-4" onSubmit={handleCreatePurchaseOrder}>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <Label>Proveedor</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={String(supplier.id)}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Material</Label>
                  <Select value={purchaseMaterialId} onValueChange={setPurchaseMaterialId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin material asociado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin material asociado</SelectItem>
                      {materials.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Fase</Label>
                  <Select value={purchasePhaseId} onValueChange={setPurchasePhaseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="General / Sin fase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">General / Sin fase</SelectItem>
                      {phases.map((phase) => (
                        <SelectItem key={phase.id} value={phase.id}>
                          {phase.phaseOrder}. {phase.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Partida</Label>
                  <Select
                    value={purchaseWorkPackageId}
                    onValueChange={setPurchaseWorkPackageId}
                    disabled={
                      purchasePhaseId === "none" || selectedPurchasePhaseWorkPackages.length === 0
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          purchasePhaseId === "none"
                            ? "Seleccionar fase"
                            : selectedPurchasePhaseWorkPackages.length === 0
                              ? "Sin partidas"
                              : "Seleccionar partida"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin partida específica</SelectItem>
                      {selectedPurchasePhaseWorkPackages.map((workPackage) => (
                        <SelectItem key={workPackage.id} value={workPackage.id}>
                          {workPackage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Categoría</Label>
                  <Select
                    value={purchaseCategory}
                    onValueChange={(value) =>
                      setPurchaseCategory(value as PurchaseOrderCategory)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PURCHASE_ORDER_CATEGORY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5 lg:col-span-2">
                  <Label htmlFor="purchaseDescription">Descripción</Label>
                  <Input
                    id="purchaseDescription"
                    value={purchaseDescription}
                    onChange={(event) => setPurchaseDescription(event.target.value)}
                    placeholder="Ej: 220 m3 Hormigón H30 / alquiler grúa"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="purchaseUnit">Unidad</Label>
                  <Input
                    id="purchaseUnit"
                    value={purchaseUnit}
                    onChange={(event) => setPurchaseUnit(event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Estado inicial</Label>
                  <Select
                    value={purchaseStatus}
                    onValueChange={(value) => setPurchaseStatus(value as PurchaseOrderStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Borrador</SelectItem>
                      <SelectItem value="ordered">Ordenado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-1.5">
                  <Label htmlFor="purchaseQty">Cantidad</Label>
                  <Input
                    id="purchaseQty"
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={purchaseQuantity}
                    onChange={(event) => setPurchaseQuantity(Number(event.target.value))}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="purchaseUnitCost">Costo unitario</Label>
                  <Input
                    id="purchaseUnitCost"
                    type="number"
                    min={0}
                    step={0.01}
                    value={purchaseUnitCost}
                    onChange={(event) => setPurchaseUnitCost(Number(event.target.value))}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="purchaseOrderDate">Fecha orden</Label>
                  <Input
                    id="purchaseOrderDate"
                    type="date"
                    value={purchaseOrderDate}
                    onChange={(event) => setPurchaseOrderDate(event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="purchaseExpectedDate">Fecha esperada</Label>
                  <Input
                    id="purchaseExpectedDate"
                    type="date"
                    value={purchaseExpectedDate}
                    onChange={(event) => setPurchaseExpectedDate(event.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="purchaseDueDate">Vencimiento</Label>
                  <Input
                    id="purchaseDueDate"
                    type="date"
                    value={purchaseDueDate}
                    onChange={(event) => setPurchaseDueDate(event.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Total</Label>
                  <div className="flex h-10 items-center rounded-md border px-3 text-sm">
                    {money(purchaseQuantity * purchaseUnitCost)}
                  </div>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="purchaseInvoiceNumber">Comprobante / factura</Label>
                  <Input
                    id="purchaseInvoiceNumber"
                    value={purchaseInvoiceNumber}
                    onChange={(event) => setPurchaseInvoiceNumber(event.target.value)}
                    placeholder="Ej: FC A-0001-00001234"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="purchaseNotes">Observaciones</Label>
                <Textarea
                  id="purchaseNotes"
                  rows={2}
                  value={purchaseNotes}
                  onChange={(event) => setPurchaseNotes(event.target.value)}
                  placeholder="Condiciones, entrega parcial, frente de uso, etc."
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isCreatingPurchaseOrder}>
                  {isCreatingPurchaseOrder ? "Guardando..." : "Registrar Compra"}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-4">
            {purchaseOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todavía no hay órdenes de compra registradas para esta obra.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Comprobante</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Pagado / saldo</TableHead>
                    <TableHead>Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map((order) => {
                    const supplier = suppliers.find(
                      (currentSupplier) => currentSupplier.id === order.supplierId
                    );
                    const actionLabel = getNextPurchaseOrderActionLabel(order.status);
                    const canAdvance =
                      (order.status === "draft" && canManageProcurement) ||
                      (order.status === "ordered" && canMarkReceipt) ||
                      (order.status === "received" && canManageProcurement);

                    return (
                      <TableRow key={order.id}>
                        <TableCell>{order.orderDate}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {PURCHASE_ORDER_CATEGORY_LABELS[order.category]}
                              {order.workPackageId
                                ? ` · ${workPackages.find((item) => item.id === order.workPackageId)?.name ?? "Partida"}`
                                : ""}
                              {order.expectedDate ? ` · ETA ${order.expectedDate}` : ""}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{supplier?.name ?? `Proveedor ${order.supplierId}`}</TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            <p>{order.invoiceNumber ?? "Sin comprobante"}</p>
                            <p>
                              {order.dueDate
                                ? order.dueDate < today && order.remainingAmount > 0
                                  ? `Vencida ${order.dueDate}`
                                  : `Vence ${order.dueDate}`
                                : "Sin vencimiento"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPurchaseOrderBadgeVariant(order.status)}>
                            {PURCHASE_ORDER_STATUS_LABELS[order.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>{money(order.totalAmount)}</TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            <p>{money(order.paidAmount)} pagado</p>
                            <p>{money(order.remainingAmount)} saldo</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {actionLabel && canAdvance ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingOrderId === order.id}
                              onClick={() => void handleAdvancePurchaseOrder(order)}
                            >
                              {updatingOrderId === order.id ? "Actualizando..." : actionLabel}
                            </Button>
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              <p>{order.status === "paid" ? "Cerrada" : "Sin acción"}</p>
                              {canManageProcurement &&
                              ["received", "paid"].includes(order.status) &&
                              order.remainingAmount > 0 ? (
                                <button
                                  type="button"
                                  className="mt-1 text-primary underline underline-offset-4"
                                  onClick={() => {
                                    setPaymentOrderId(order.id);
                                    setPaymentAmount(order.remainingAmount);
                                  }}
                                >
                                  Registrar pago
                                </button>
                              ) : null}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <div className="rounded-md border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h5 className="font-medium">Registrar pago</h5>
                  <p className="text-sm text-muted-foreground">
                    Pagos parciales o totales contra órdenes recibidas.
                  </p>
                </div>
                <Badge variant="outline">
                  {procurementSummary.partiallyPaidOrders} parciales
                </Badge>
              </div>

              {!canManageProcurement ? (
                <p className="text-sm text-muted-foreground">
                  Solo dirección o PM pueden registrar pagos de proveedores.
                </p>
              ) : payableOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay órdenes recibidas con saldo pendiente.
                </p>
              ) : (
                <form className="grid gap-3" onSubmit={handleCreatePayment}>
                  <div className="space-y-1.5">
                    <Label>Orden</Label>
                    <Select value={paymentOrderId} onValueChange={setPaymentOrderId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar orden" />
                      </SelectTrigger>
                      <SelectContent>
                        {payableOrders.map((order) => (
                          <SelectItem key={order.id} value={order.id}>
                            {order.description} · saldo {money(order.remainingAmount)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="paymentAmount">Monto</Label>
                      <Input
                        id="paymentAmount"
                        type="number"
                        min={0.01}
                        step={0.01}
                        value={paymentAmount}
                        onChange={(event) => setPaymentAmount(Number(event.target.value))}
                        max={selectedPaymentOrder?.remainingAmount ?? undefined}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="paymentDate">Fecha de pago</Label>
                      <Input
                        id="paymentDate"
                        type="date"
                        value={paymentDate}
                        onChange={(event) => setPaymentDate(event.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="paymentReference">Referencia</Label>
                      <Input
                        id="paymentReference"
                        value={paymentReference}
                        onChange={(event) => setPaymentReference(event.target.value)}
                        placeholder="Transferencia / cheque / recibo"
                      />
                    </div>

                    <div className="rounded-md border px-3 py-2 text-sm">
                      <p className="text-xs text-muted-foreground">Saldo restante estimado</p>
                      <p className="font-medium">
                        {money(
                          Math.max(
                            (selectedPaymentOrder?.remainingAmount ?? 0) - Number(paymentAmount || 0),
                            0
                          )
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="paymentNotes">Notas</Label>
                    <Textarea
                      id="paymentNotes"
                      rows={2}
                      value={paymentNotes}
                      onChange={(event) => setPaymentNotes(event.target.value)}
                      placeholder="Observaciones del pago"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmittingPayment}>
                      {isSubmittingPayment ? "Guardando..." : "Registrar Pago"}
                    </Button>
                  </div>
                </form>
              )}
            </div>

            <div className="rounded-md border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h5 className="font-medium">Últimos pagos</h5>
                <p className="text-xs text-muted-foreground">{purchasePayments.length} registros</p>
              </div>

              {purchasePayments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aún no hay pagos de proveedores registrados.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Orden</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Referencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchasePayments.slice(0, 8).map((payment) => {
                      const order = purchaseOrders.find(
                        (currentOrder) => currentOrder.id === payment.purchaseOrderId
                      );

                      return (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.paymentDate}</TableCell>
                          <TableCell className="max-w-[240px] truncate">
                            {order?.description ?? payment.purchaseOrderId}
                          </TableCell>
                          <TableCell>{money(payment.amount)}</TableCell>
                          <TableCell>{payment.reference ?? "Sin referencia"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
