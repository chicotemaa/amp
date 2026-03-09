"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createProgressUpdateDb } from "@/lib/api/progress";
import { toast } from "sonner";
import { getSupabaseAuthBrowserClient } from "@/lib/supabase/auth-browser";

interface DailyProgressFormProps {
  projectId: string;
}

export function DailyProgressForm({ projectId }: DailyProgressFormProps) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [reportDate, setReportDate] = useState(today);
  const [progressDelta, setProgressDelta] = useState(0);
  const [note, setNote] = useState("");
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
      await createProgressUpdateDb({
        projectId: Number(projectId),
        phaseId: null,
        reportDate,
        progressDelta: Number(progressDelta),
        note: note.trim() || null,
        reportedBy: employeeId,
      });
      toast.success("Avance registrado correctamente.");
      setProgressDelta(0);
      setNote("");
      window.dispatchEvent(new Event("projectProgressUpdated"));
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo registrar el avance.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Carga de Avance Diario</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reportDate">Fecha</Label>
              <Input
                id="reportDate"
                type="date"
                value={reportDate}
                onChange={(event) => setReportDate(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="progressDelta">Avance del día (%)</Label>
              <Input
                id="progressDelta"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={progressDelta}
                onChange={(event) => setProgressDelta(Number(event.target.value))}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Descripción técnica</Label>
            <Textarea
              id="note"
              rows={3}
              placeholder="Describe actividades ejecutadas, frentes abiertos y observaciones."
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Registrar Avance"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
