"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createIncidentDb } from "@/lib/api/incidents";
import { toast } from "sonner";
import type { IncidentSeverity, IncidentStatus, IncidentType } from "@/lib/types/incident";
import { getSupabaseAuthBrowserClient } from "@/lib/supabase/auth-browser";

interface IncidentReporterProps {
  projectId: string;
}

export function IncidentReporter({ projectId }: IncidentReporterProps) {
  const [title, setTitle] = useState("");
  const [incidentType, setIncidentType] = useState<IncidentType>("schedule");
  const [severity, setSeverity] = useState<IncidentSeverity>("medium");
  const [status, setStatus] = useState<IncidentStatus>("open");
  const [impactDays, setImpactDays] = useState(0);
  const [impactCost, setImpactCost] = useState(0);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeId, setEmployeeId] = useState<number | null>(null);

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await createIncidentDb({
        projectId: Number(projectId),
        phaseId: null,
        title,
        incidentType,
        severity,
        impactDays,
        impactCost,
        ownerId: employeeId,
        status,
        openedAt: new Date().toISOString().slice(0, 10),
        resolvedAt: null,
        description: description.trim() || null,
      });
      toast.success("Incidente registrado correctamente.");
      setTitle("");
      setDescription("");
      setImpactDays(0);
      setImpactCost(0);
      setStatus("open");
      setSeverity("medium");
      setIncidentType("schedule");
      window.dispatchEvent(new Event("projectIncidentsUpdated"));
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo crear el incidente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reporte de Incidente</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="incidentTitle">Título</Label>
            <Input
              id="incidentTitle"
              placeholder="Ej: Retraso en provisión de acero"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={incidentType} onValueChange={(value) => setIncidentType(value as IncidentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="schedule">Plazo</SelectItem>
                  <SelectItem value="cost">Costo</SelectItem>
                  <SelectItem value="quality">Calidad</SelectItem>
                  <SelectItem value="safety">Seguridad</SelectItem>
                  <SelectItem value="scope">Alcance</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Severidad</Label>
              <Select value={severity} onValueChange={(value) => setSeverity(value as IncidentSeverity)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as IncidentStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Abierto</SelectItem>
                  <SelectItem value="in-progress">En Progreso</SelectItem>
                  <SelectItem value="blocked">Bloqueado</SelectItem>
                  <SelectItem value="resolved">Resuelto</SelectItem>
                  <SelectItem value="closed">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="impactDays">Impacto en días</Label>
              <Input
                id="impactDays"
                type="number"
                min={0}
                value={impactDays}
                onChange={(event) => setImpactDays(Number(event.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="impactCost">Impacto en costo (USD)</Label>
              <Input
                id="impactCost"
                type="number"
                min={0}
                step={0.01}
                value={impactCost}
                onChange={(event) => setImpactCost(Number(event.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="incidentDescription">Descripción</Label>
            <Textarea
              id="incidentDescription"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Detalle técnico del incidente y acción recomendada."
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Registrar Incidente"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
