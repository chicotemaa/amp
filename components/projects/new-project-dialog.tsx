"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useState } from "react";
import { createProject, CreateProjectInput } from "@/lib/api/projects";
import { PROJECT_TYPE_LABELS, PROJECT_STATUS_LABELS, ProjectType, ProjectStatus } from "@/lib/types/project";
import { toast } from "sonner"; // Assuming sonner is used, or alert if not available

export function NewProjectDialog({ onProjectCreated }: { onProjectCreated?: () => void }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState<CreateProjectInput>({
        name: "",
        location: "",
        type: "residential",
        status: "planning",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        teamSize: 0,
        budget: 0,
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=60", // Default image
        clientId: 0,
        description: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createProject(form);
            setOpen(false);
            if (onProjectCreated) onProjectCreated();
            window.dispatchEvent(new Event("projectCreated"));
            toast.success("Proyecto creado exitosamente");
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Error al crear el proyecto");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nuevo Proyecto
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nuevo Proyecto</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre del Proyecto *</Label>
                        <Input
                            id="name"
                            required
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder="Ej. Edificio Los Pinos"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="location">Ubicación</Label>
                            <Input
                                id="location"
                                value={form.location}
                                onChange={e => setForm({ ...form, location: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Tipo</Label>
                            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ProjectType })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(PROJECT_TYPE_LABELS).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="startDate">Fecha de Inicio *</Label>
                            <Input
                                id="startDate"
                                type="date"
                                required
                                value={form.startDate}
                                onChange={e => setForm({ ...form, startDate: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="endDate">Fecha de Finalización *</Label>
                            <Input
                                id="endDate"
                                type="date"
                                required
                                value={form.endDate}
                                onChange={e => setForm({ ...form, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="budget">Presupuesto Estimado ($)</Label>
                            <Input
                                id="budget"
                                type="number"
                                min="0"
                                value={form.budget}
                                onChange={e => setForm({ ...form, budget: Number(e.target.value) })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="teamSize">Tamaño del Equipo</Label>
                            <Input
                                id="teamSize"
                                type="number"
                                min="0"
                                value={form.teamSize}
                                onChange={e => setForm({ ...form, teamSize: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            rows={3}
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                        />
                    </div>

                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Guardando..." : "Crear Proyecto"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
