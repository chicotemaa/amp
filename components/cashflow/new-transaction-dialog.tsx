"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { CreateTransactionInput, createTransaction } from "@/lib/api/cashflow";
import { getProjectsDb } from "@/lib/api/projects";
import { Project } from "@/lib/types/project";
import { TRANSACTION_CATEGORY_LABELS, Transaction } from "@/lib/types/cashflow";
import { toast } from "sonner";

export function NewTransactionDialog({ onTransactionCreated }: { onTransactionCreated?: () => void }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);

    const [form, setForm] = useState<CreateTransactionInput>({
        type: "egreso",
        description: "",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        category: "materials",
        projectId: null,
        projectName: "General",
    });

    useEffect(() => {
        if (open) {
            getProjectsDb().then(setProjects).catch(console.error);
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const selectedProject = projects.find(p => p.id === form.projectId);
            const submission = {
                ...form,
                projectName: selectedProject ? selectedProject.name : "General"
            };
            await createTransaction(submission);
            setOpen(false);
            if (onTransactionCreated) onTransactionCreated();
            window.dispatchEvent(new Event("transactionCreated"));
            toast.success("Transacción registrada exitosamente");
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Error al registrar transacción");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Nueva Transacción
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Nueva Transacción</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo *</Label>
                            <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ingreso">Ingreso</SelectItem>
                                    <SelectItem value="egreso">Egreso</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Fecha *</Label>
                            <Input
                                id="date"
                                type="date"
                                required
                                value={form.date}
                                onChange={e => setForm({ ...form, date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción *</Label>
                        <Input
                            id="description"
                            required
                            placeholder="Ej. Compra de materiales"
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Monto ($) *</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={form.amount}
                                onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Categoría *</Label>
                            <Select value={form.category} onValueChange={(v: any) => setForm({ ...form, category: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(TRANSACTION_CATEGORY_LABELS).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Proyecto Asignado</Label>
                        <Select
                            value={form.projectId?.toString() ?? "none"}
                            onValueChange={(v) => setForm({
                                ...form,
                                projectId: v === "none" ? null : Number(v)
                            })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar Proyecto" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Ninguno (General)</SelectItem>
                                {projects.map((p) => (
                                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Guardando..." : "Guardar Transacción"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
