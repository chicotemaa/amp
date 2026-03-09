"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { getProjectsDb } from "@/lib/api/projects";
import { assignEmployeeToProjectDb } from "@/lib/api/employees";
import type { Employee } from "@/lib/types/employee";
import type { Project } from "@/lib/types/project";
import { toast } from "sonner";

interface AssignProjectDialogProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned?: () => void;
}

export function AssignProjectDialog({
  employee,
  open,
  onOpenChange,
  onAssigned,
}: AssignProjectDialogProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [hoursThisWeek, setHoursThisWeek] = useState<number>(40);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    getProjectsDb()
      .then((data) => setProjects(data))
      .catch(() => setProjects([]));
  }, [open]);

  useEffect(() => {
    if (employee) {
      setHoursThisWeek(employee.hoursThisWeek);
    }
  }, [employee]);

  const handleAssign = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!employee || !projectId) return;
    setIsSubmitting(true);
    try {
      await assignEmployeeToProjectDb({
        employeeId: employee.id,
        projectId: Number(projectId),
        hoursThisWeek,
      });
      toast.success("Empleado asignado al proyecto.");
      onOpenChange(false);
      onAssigned?.();
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo asignar el empleado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {employee ? `Asignar Proyecto a ${employee.name}` : "Asignar Proyecto"}
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleAssign}>
          <div className="space-y-2">
            <Label>Proyecto</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar proyecto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={String(project.id)}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Horas Semanales Asignadas</Label>
            <Input
              type="number"
              min={0}
              value={hoursThisWeek}
              onChange={(event) => setHoursThisWeek(Number(event.target.value))}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!projectId || isSubmitting || !employee}>
              {isSubmitting ? "Asignando..." : "Asignar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
