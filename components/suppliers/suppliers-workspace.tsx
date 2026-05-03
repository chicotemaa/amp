"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { can, type AppRole } from "@/lib/auth/roles";
import {
  createSupplierDb,
  getSupplierDirectoryDb,
  updateSupplierDb,
  type CreateSupplierInput,
} from "@/lib/api/procurement";
import type {
  SupplierCategory,
  SupplierDirectoryItem,
} from "@/lib/types/procurement";
import { SUPPLIER_CATEGORY_LABELS } from "@/lib/types/procurement";

type SupplierFormState = {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  category: SupplierCategory;
  isActive: boolean;
};

const EMPTY_FORM: SupplierFormState = {
  name: "",
  contactName: "",
  email: "",
  phone: "",
  category: "materials",
  isActive: true,
};

const money = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

function formatDate(value: string | null) {
  if (!value) return "Sin compras";
  return new Date(`${value}T00:00:00`).toLocaleDateString("es-AR");
}

function toPayload(form: SupplierFormState): CreateSupplierInput {
  return {
    name: form.name.trim(),
    contactName: form.contactName.trim() || null,
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    category: form.category,
    isActive: form.isActive,
  };
}

function buildForm(row: SupplierDirectoryItem): SupplierFormState {
  return {
    name: row.name,
    contactName: row.contactName ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    category: row.category,
    isActive: row.isActive,
  };
}

function SupplierDialog({
  open,
  onOpenChange,
  form,
  setForm,
  title,
  submitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: SupplierFormState;
  setForm: React.Dispatch<React.SetStateAction<SupplierFormState>>;
  title: string;
  submitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="supplier-name">Proveedor</Label>
              <Input
                id="supplier-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Ej. Hormigones Centro"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Select
                value={form.category}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    category: value as SupplierCategory,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SUPPLIER_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="supplier-contact">Contacto</Label>
              <Input
                id="supplier-contact"
                value={form.contactName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, contactName: event.target.value }))
                }
                placeholder="Nombre de contacto"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select
                value={form.isActive ? "active" : "inactive"}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, isActive: value === "active" }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="supplier-email">Email</Label>
              <Input
                id="supplier-email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="proveedor@empresa.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supplier-phone">Teléfono</Label>
              <Input
                id="supplier-phone"
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
                placeholder="+54 351 000 0000"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={submitting || !form.name.trim()}>
            {submitting ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SuppliersWorkspace({ role }: { role: AppRole | null }) {
  const [rows, setRows] = useState<SupplierDirectoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<SupplierDirectoryItem | null>(null);
  const [form, setForm] = useState<SupplierFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const canManage = can(role, "suppliers.manage");

  const load = useCallback(async () => {
    setIsLoading(true);
    const data = await getSupplierDirectoryDb();
    setRows(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load();

    const handleUpdated = () => {
      void load();
    };

    window.addEventListener("suppliersUpdated", handleUpdated);
    window.addEventListener("projectProcurementUpdated", handleUpdated);
    return () => {
      window.removeEventListener("suppliersUpdated", handleUpdated);
      window.removeEventListener("projectProcurementUpdated", handleUpdated);
    };
  }, [load]);

  const totals = useMemo(
    () => ({
      active: rows.filter((row) => row.isActive).length,
      totalPending: rows.reduce((sum, row) => sum + row.totalPending, 0),
      overdueAmount: rows.reduce((sum, row) => sum + row.overdueAmount, 0),
      openSuppliers: rows.filter((row) => row.totalPending > 0).length,
    }),
    [rows]
  );

  const openCreate = () => {
    setEditingRow(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (row: SupplierDirectoryItem) => {
    setEditingRow(row);
    setForm(buildForm(row));
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (editingRow) {
        await updateSupplierDb(editingRow.id, toPayload(form));
        toast.success("Proveedor actualizado.");
      } else {
        await createSupplierDb(toPayload(form));
        toast.success("Proveedor creado.");
      }

      setDialogOpen(false);
      window.dispatchEvent(new Event("suppliersUpdated"));
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo guardar el proveedor.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Proveedores activos</p>
            <p className="text-2xl font-semibold">{totals.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Con saldo pendiente</p>
            <p className="text-2xl font-semibold">{totals.openSuppliers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pendiente de pago</p>
            <p className="text-2xl font-semibold">{money(totals.totalPending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Vencido</p>
            <p className="text-2xl font-semibold">{money(totals.overdueAmount)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Directorio y cuenta por proveedor</CardTitle>
          {canManage ? <Button onClick={openCreate}>Nuevo proveedor</Button> : null}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando proveedores...</p>
          ) : rows.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              No hay proveedores disponibles para tu rol.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead className="text-right">Ordenado</TableHead>
                    <TableHead className="text-right">Pagado</TableHead>
                    <TableHead className="text-right">Pendiente</TableHead>
                    <TableHead>Última compra</TableHead>
                    <TableHead>Obras activas</TableHead>
                    {canManage ? <TableHead className="text-right">Acción</TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{row.name}</p>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant={row.isActive ? "outline" : "secondary"}>
                              {row.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                            {row.overdueAmount > 0 ? (
                              <Badge variant="destructive">Vencido</Badge>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{SUPPLIER_CATEGORY_LABELS[row.category]}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{row.contactName ?? "Sin contacto"}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.email ?? row.phone ?? "Sin datos"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{money(row.totalOrdered)}</TableCell>
                      <TableCell className="text-right">{money(row.totalPaid)}</TableCell>
                      <TableCell className="text-right">{money(row.totalPending)}</TableCell>
                      <TableCell>{formatDate(row.lastOrderDate)}</TableCell>
                      <TableCell>{row.activeProjectCount}</TableCell>
                      {canManage ? (
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                            Editar
                          </Button>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        setForm={setForm}
        title={editingRow ? "Editar proveedor" : "Nuevo proveedor"}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
