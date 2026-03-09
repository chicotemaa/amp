"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { CreateEmployeeInput, createEmployee } from "@/lib/api/employees";
import { toast } from "sonner"; // Assuming sonner is available

const DEPARTMENT_OPTIONS = ["Diseño", "Ingeniería", "Construcción", "Gestión"] as const;
const STATUS_OPTIONS = ["Activo", "En Proyecto", "Disponible", "Inactivo"] as const;

export function NewEmployeeDialog({ onEmployeeCreated }: { onEmployeeCreated?: () => void }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState<CreateEmployeeInput>({
        name: "",
        role: "",
        department: "Diseño",
        email: "",
        phone: "",
        status: "Activo",
        avatar: "",
        hoursThisWeek: 40,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createEmployee(form);
            setOpen(false);
            if (onEmployeeCreated) onEmployeeCreated();
            window.dispatchEvent(new Event("employeeCreated"));
            toast.success("Empleado creado exitosamente");
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Error al crear el empleado");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Nuevo Empleado
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Nuevo Empleado</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre Completo *</Label>
                            <Input
                                id="name"
                                required
                                placeholder="Ej. Ana García"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Rol / Cargo *</Label>
                            <Input
                                id="role"
                                required
                                placeholder="Ej. Arquitecta"
                                value={form.role}
                                onChange={e => setForm({ ...form, role: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Departamento *</Label>
                            <Select value={form.department} onValueChange={(v: any) => setForm({ ...form, department: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DEPARTMENT_OPTIONS.map((dept) => (
                                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Estado *</Label>
                            <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((status) => (
                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                placeholder="ana@archipro.com"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input
                                id="phone"
                                placeholder="+54 11 1234 5678"
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="hoursThisWeek">Horas base (Semana)</Label>
                        <Input
                            id="hoursThisWeek"
                            type="number"
                            min="0"
                            value={form.hoursThisWeek}
                            onChange={e => setForm({ ...form, hoursThisWeek: Number(e.target.value) })}
                        />
                    </div>

                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Guardando..." : "Crear Empleado"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
