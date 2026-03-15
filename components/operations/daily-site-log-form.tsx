"use client";

import { useEffect, useMemo, useState } from "react";
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
import { toast } from "sonner";
import { getSupabaseAuthBrowserClient } from "@/lib/supabase/auth-browser";
import { getProjectPhasesDb } from "@/lib/api/progress";
import { createSiteDailyLogDb } from "@/lib/api/site-daily-logs";
import type { ProjectPhase } from "@/lib/types/progress";
import {
  SITE_WEATHER_CONDITION_LABELS,
  SITE_WEATHER_IMPACT_LABELS,
  type SiteWeatherCondition,
  type SiteWeatherImpact,
} from "@/lib/types/site-daily-log";

interface DailySiteLogFormProps {
  projectId: string;
}

export function DailySiteLogForm({ projectId }: DailySiteLogFormProps) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [logDate, setLogDate] = useState(today);
  const [phaseId, setPhaseId] = useState<string>("none");
  const [weatherCondition, setWeatherCondition] = useState<SiteWeatherCondition>("clear");
  const [weatherImpact, setWeatherImpact] = useState<SiteWeatherImpact>("none");
  const [workforceCount, setWorkforceCount] = useState(0);
  const [hoursWorked, setHoursWorked] = useState(0);
  const [hoursLost, setHoursLost] = useState(0);
  const [notes, setNotes] = useState("");
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadDependencies = async () => {
      const supabase = getSupabaseAuthBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("employee_id")
          .eq("id", user.id)
          .single();
        setEmployeeId(profile?.employee_id ?? null);
      }

      const projectPhases = await getProjectPhasesDb(Number(projectId));
      setPhases(projectPhases);
    };

    void loadDependencies();
  }, [projectId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await createSiteDailyLogDb({
        projectId: Number(projectId),
        phaseId: phaseId === "none" ? null : phaseId,
        logDate,
        weatherCondition,
        weatherImpact,
        workforceCount: Number(workforceCount),
        hoursWorked: Number(hoursWorked),
        hoursLost: Number(hoursLost),
        notes: notes.trim() || null,
        createdBy: employeeId,
      });

      toast.success("Parte diario registrado.");
      setWorkforceCount(0);
      setHoursWorked(0);
      setHoursLost(0);
      setNotes("");
      setPhaseId("none");
      setWeatherCondition("clear");
      setWeatherImpact("none");
      window.dispatchEvent(new Event("projectSiteLogUpdated"));
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo registrar el parte diario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parte Diario de Obra</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="siteLogDate">Fecha</Label>
              <Input
                id="siteLogDate"
                type="date"
                value={logDate}
                onChange={(event) => setLogDate(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fase asociada</Label>
              <Select value={phaseId} onValueChange={setPhaseId}>
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
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Condición climática</Label>
              <Select
                value={weatherCondition}
                onValueChange={(value) => setWeatherCondition(value as SiteWeatherCondition)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SITE_WEATHER_CONDITION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Impacto del clima</Label>
              <Select
                value={weatherImpact}
                onValueChange={(value) => setWeatherImpact(value as SiteWeatherImpact)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SITE_WEATHER_IMPACT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="workforceCount">Dotación presente</Label>
              <Input
                id="workforceCount"
                type="number"
                min={0}
                value={workforceCount}
                onChange={(event) => setWorkforceCount(Number(event.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hoursWorked">Horas efectivas</Label>
              <Input
                id="hoursWorked"
                type="number"
                min={0}
                step={0.5}
                value={hoursWorked}
                onChange={(event) => setHoursWorked(Number(event.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hoursLost">Horas perdidas</Label>
              <Input
                id="hoursLost"
                type="number"
                min={0}
                step={0.5}
                value={hoursLost}
                onChange={(event) => setHoursLost(Number(event.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="siteLogNotes">Observaciones</Label>
            <Textarea
              id="siteLogNotes"
              rows={4}
              placeholder="Ej: lluvia intensa 3 hs, reprogramación de hormigonado, dotación reducida, interferencia con proveedor."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Registrar Parte"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
