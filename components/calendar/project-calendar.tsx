"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import type { DateSelectArg, EventClickArg, EventInput } from "@fullcalendar/core";
import {
  BellRing,
  ClipboardList,
  Clock3,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AGENDA_EVENT_PRIORITY_LABELS,
  AGENDA_EVENT_STATUS_LABELS,
  AGENDA_EVENT_TYPE_LABELS,
  AGENDA_MANUAL_CATEGORY_LABELS,
  type AgendaEventPriority,
  type AgendaEventStatus,
  type OperationsAgendaDataset,
  type OperationsAgendaEvent,
  type ProjectAgendaEvent,
} from "@/lib/types/operations-agenda";
import {
  createProjectAgendaEventDb,
  deleteProjectAgendaEventDb,
  getOperationsAgendaDatasetDb,
  updateProjectAgendaEventDb,
  updateProjectAgendaEventStatusDb,
} from "@/lib/api/operations-agenda";

type CalendarEntry = EventInput & {
  extendedProps: OperationsAgendaEvent;
};

type ManualEventForm = {
  projectId: string;
  phaseId: string;
  title: string;
  description: string;
  category: ProjectAgendaEvent["category"];
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  status: ProjectAgendaEvent["status"];
  priority: ProjectAgendaEvent["priority"];
  assigneeId: string;
  reminderAt: string;
};

const EVENT_TYPE_COLORS: Record<OperationsAgendaEvent["type"], string> = {
  manual: "#0f766e",
  project_start: "#16a34a",
  project_end: "#dc2626",
  milestone: "#2563eb",
  weather_delay: "#b45309",
  incident: "#dc2626",
  purchase_expected: "#7c3aed",
  purchase_due: "#ea580c",
  certificate_issue: "#0891b2",
  certificate_due: "#be123c",
  report: "#475569",
  contract_start: "#15803d",
  contract_end: "#be123c",
  contract_amendment: "#9333ea",
  labor_batch: "#0f766e",
};

const MANUAL_STATUS_OPTIONS: ProjectAgendaEvent["status"][] = [
  "scheduled",
  "in_progress",
  "completed",
  "delayed",
  "cancelled",
];

function dateInputToIsoDay(value: string | Date | null) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}

function toLocalDateTimeInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function toStoredDate(value: string, allDay: boolean) {
  if (allDay) {
    return `${value}T12:00:00.000Z`;
  }

  return new Date(value).toISOString();
}

function toStoredReminder(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function parseFormDate(value: string, allDay: boolean) {
  if (!value) return null;

  if (allDay) {
    return new Date(`${value}T12:00:00.000Z`);
  }

  return new Date(value);
}

function getReminderLimit(form: ManualEventForm) {
  if (form.isAllDay) {
    const endDay = form.endsAt || form.startsAt;
    if (!endDay) return null;
    return new Date(`${endDay}T23:59:59.999`);
  }

  return parseFormDate(form.endsAt || form.startsAt, false);
}

function formatDateTime(value: string, allDay: boolean) {
  if (allDay) {
    return new Date(`${dateInputToIsoDay(value)}T12:00:00Z`).toLocaleDateString("es-AR");
  }

  return new Date(value).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getStatusBadgeVariant(status: AgendaEventStatus) {
  if (status === "delayed" || status === "blocked") return "destructive";
  if (status === "completed") return "secondary";
  return "outline";
}

function getPriorityBadgeVariant(priority: AgendaEventPriority) {
  if (priority === "critical") return "destructive";
  if (priority === "high") return "secondary";
  return "outline";
}

function eventOccursOnDay(event: OperationsAgendaEvent, day: string) {
  const startDay = dateInputToIsoDay(event.start);
  const endDay = dateInputToIsoDay(event.end ?? event.start);
  return day >= startDay && day <= endDay;
}

function isPendingStatus(status: AgendaEventStatus) {
  return !["completed", "cancelled"].includes(status);
}

function getDateWindow(days: number) {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + days);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function buildDefaultForm(today: string, projectId = ""): ManualEventForm {
  return {
    projectId,
    phaseId: "none",
    title: "",
    description: "",
    category: "operation",
    startsAt: today,
    endsAt: "",
    isAllDay: true,
    status: "scheduled",
    priority: "medium",
    assigneeId: "none",
    reminderAt: "",
  };
}

function buildEditForm(event: ProjectAgendaEvent): ManualEventForm {
  return {
    projectId: String(event.projectId),
    phaseId: event.phaseId ?? "none",
    title: event.title,
    description: event.description ?? "",
    category: event.category,
    startsAt: event.isAllDay
      ? event.startsAt.slice(0, 10)
      : toLocalDateTimeInput(event.startsAt),
    endsAt: event.endsAt
      ? event.isAllDay
        ? event.endsAt.slice(0, 10)
        : toLocalDateTimeInput(event.endsAt)
      : "",
    isAllDay: event.isAllDay,
    status: event.status,
    priority: event.priority,
    assigneeId: event.assigneeId ? String(event.assigneeId) : "none",
    reminderAt: toLocalDateTimeInput(event.reminderAt),
  };
}

export function ProjectCalendar() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const nowIso = useMemo(() => new Date().toISOString(), []);
  const [dataset, setDataset] = useState<OperationsAgendaDataset>({
    projects: [],
    phases: [],
    assignees: [],
    manualEvents: [],
    events: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(today);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingEventId, setUpdatingEventId] = useState<string | null>(null);
  const [form, setForm] = useState<ManualEventForm>(() => buildDefaultForm(today));

  const selectedManualEvent = useMemo(
    () => dataset.manualEvents.find((event) => event.id === editingEventId) ?? null,
    [dataset.manualEvents, editingEventId]
  );

  const selectedProjectPhases = useMemo(() => {
    if (!form.projectId) return [];
    return dataset.phases.filter((phase) => String(phase.projectId) === form.projectId);
  }, [dataset.phases, form.projectId]);

  const selectedProjectAssignees = useMemo(() => {
    if (!form.projectId) return [];
    const projectId = Number(form.projectId);
    return dataset.assignees.filter((assignee) => assignee.projectIds.includes(projectId));
  }, [dataset.assignees, form.projectId]);

  const loadAgenda = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getOperationsAgendaDatasetDb();
      setDataset(data);
      setForm((current) =>
        !current.projectId && data.projects.length > 0
          ? buildDefaultForm(today, String(data.projects[0].id))
          : current
      );
    } finally {
      setIsLoading(false);
    }
  }, [today]);

  useEffect(() => {
    void loadAgenda();
  }, [loadAgenda]);

  useEffect(() => {
    const handleUpdated = () => {
      void loadAgenda();
    };

    const eventNames = [
      "projectPlanningUpdated",
      "projectProgressUpdated",
      "projectSiteLogUpdated",
      "projectIncidentsUpdated",
      "projectProcurementUpdated",
      "projectRevenueUpdated",
      "projectContractsUpdated",
      "projectLaborUpdated",
      "projectAgendaUpdated",
      "projectCreated",
    ];

    eventNames.forEach((eventName) => window.addEventListener(eventName, handleUpdated));
    return () => {
      eventNames.forEach((eventName) =>
        window.removeEventListener(eventName, handleUpdated)
      );
    };
  }, [loadAgenda]);

  const typeOptions = useMemo(
    () => Array.from(new Set(dataset.events.map((event) => event.type))).sort(),
    [dataset.events]
  );

  const filteredEvents = useMemo(() => {
    return dataset.events.filter((event) => {
      const matchesProject =
        projectFilter === "all" || String(event.projectId) === projectFilter;
      const matchesType = typeFilter === "all" || event.type === typeFilter;
      const matchesStatus = statusFilter === "all" || event.status === statusFilter;
      return matchesProject && matchesType && matchesStatus;
    });
  }, [dataset.events, projectFilter, typeFilter, statusFilter]);

  const calendarEvents = useMemo<CalendarEntry[]>(() => {
    return filteredEvents.map((event) => ({
      id: event.id,
      title: `${event.projectName} · ${event.title}`,
      start: event.start,
      end: event.end ?? undefined,
      allDay: event.allDay,
      backgroundColor: EVENT_TYPE_COLORS[event.type],
      borderColor: EVENT_TYPE_COLORS[event.type],
      extendedProps: event,
    }));
  }, [filteredEvents]);

  const selectedDayEvents = useMemo(() => {
    return filteredEvents
      .filter((event) => eventOccursOnDay(event, selectedDate))
      .sort((left, right) => new Date(left.start).getTime() - new Date(right.start).getTime());
  }, [filteredEvents, selectedDate]);

  const reminderEvents = useMemo(() => {
    const next48h = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    return filteredEvents
      .filter(
        (event) =>
          event.reminderAt &&
          isPendingStatus(event.status) &&
          event.reminderAt <= next48h
      )
      .sort((left, right) => new Date(left.reminderAt ?? left.start).getTime() - new Date(right.reminderAt ?? right.start).getTime())
      .slice(0, 5);
  }, [filteredEvents]);

  const stats = useMemo(() => {
    const { start, end } = getDateWindow(7);
    return {
      upcomingWeek: filteredEvents.filter(
        (event) =>
          isPendingStatus(event.status) &&
          dateInputToIsoDay(event.start) >= start &&
          dateInputToIsoDay(event.start) <= end
      ).length,
      overdue: filteredEvents.filter(
        (event) => isPendingStatus(event.status) && dateInputToIsoDay(event.start) < today
      ).length,
      critical: filteredEvents.filter(
        (event) => isPendingStatus(event.status) && event.priority === "critical"
      ).length,
      reminders: filteredEvents.filter(
        (event) =>
          event.reminderAt &&
          isPendingStatus(event.status) &&
          event.reminderAt <= nowIso
      ).length,
    };
  }, [filteredEvents, nowIso, today]);

  const selectedDateTitle = useMemo(
    () =>
      `Agenda del ${new Date(`${selectedDate}T12:00:00Z`).toLocaleDateString("es-AR")}`,
    [selectedDate]
  );

  const resetCreateForm = useCallback(() => {
    const defaultProjectId =
      projectFilter !== "all"
        ? projectFilter
        : dataset.projects[0]
          ? String(dataset.projects[0].id)
          : "";
    setEditingEventId(null);
    setForm(buildDefaultForm(today, defaultProjectId));
  }, [dataset.projects, projectFilter, today]);

  const openCreateDialog = () => {
    resetCreateForm();
    setDialogOpen(true);
  };

  const openEditDialog = (eventId: string) => {
    const event = dataset.manualEvents.find((item) => item.id === eventId);
    if (!event) return;
    setEditingEventId(eventId);
    setForm(buildEditForm(event));
    setDialogOpen(true);
  };

  const handleDateSelect = (arg: DateSelectArg) => {
    setSelectedDate(arg.startStr.slice(0, 10));
  };

  const handleEventClick = (arg: EventClickArg) => {
    if (arg.event.start) {
      setSelectedDate(arg.event.start.toISOString().slice(0, 10));
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingEventId(null);
    }
  };

  const handleFormProjectChange = (value: string) => {
    setForm((current) => ({
      ...current,
      projectId: value,
      phaseId: "none",
      assigneeId: "none",
    }));
  };

  const handleCreateOrUpdate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.projectId) {
      toast.error("Seleccioná una obra.");
      return;
    }

    if (!form.title.trim()) {
      toast.error("Completá el título del evento.");
      return;
    }

    const startDate = parseFormDate(form.startsAt, form.isAllDay);
    const endDate = parseFormDate(form.endsAt, form.isAllDay);
    const reminderDate = form.reminderAt ? new Date(form.reminderAt) : null;

    if (!startDate || Number.isNaN(startDate.getTime())) {
      toast.error("Completá una fecha de inicio válida.");
      return;
    }

    if (endDate && Number.isNaN(endDate.getTime())) {
      toast.error("Completá una fecha de fin válida.");
      return;
    }

    if (endDate && endDate < startDate) {
      toast.error("La fecha de fin no puede ser anterior al inicio.");
      return;
    }

    const reminderLimit = getReminderLimit(form);
    if (
      reminderDate &&
      reminderLimit &&
      reminderDate.getTime() > reminderLimit.getTime()
    ) {
      toast.error(
        form.isAllDay
          ? "En eventos de día completo, el recordatorio no puede quedar después del cierre del día."
          : "El recordatorio no puede ser posterior al inicio del evento."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        projectId: Number(form.projectId),
        phaseId: form.phaseId === "none" ? null : form.phaseId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category,
        startsAt: toStoredDate(form.startsAt, form.isAllDay),
        endsAt: form.endsAt ? toStoredDate(form.endsAt, form.isAllDay) : null,
        isAllDay: form.isAllDay,
        status: form.status,
        priority: form.priority,
        assigneeId: form.assigneeId === "none" ? null : Number(form.assigneeId),
        reminderAt: toStoredReminder(form.reminderAt),
      } satisfies Omit<ProjectAgendaEvent, "id" | "createdBy" | "createdAt" | "updatedAt" | "assigneeName">;

      if (editingEventId) {
        await updateProjectAgendaEventDb(editingEventId, payload);
        toast.success("Evento operativo actualizado.");
      } else {
        await createProjectAgendaEventDb(payload);
        toast.success("Evento operativo registrado.");
      }

      setDialogOpen(false);
      setEditingEventId(null);
      window.dispatchEvent(new Event("projectAgendaUpdated"));
      void loadAgenda();
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo guardar el evento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualStatusChange = async (
    eventId: string,
    nextStatus: ProjectAgendaEvent["status"]
  ) => {
    setUpdatingEventId(eventId);
    try {
      await updateProjectAgendaEventStatusDb(eventId, nextStatus);
      toast.success("Estado de agenda actualizado.");
      window.dispatchEvent(new Event("projectAgendaUpdated"));
      void loadAgenda();
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo actualizar el evento.");
    } finally {
      setUpdatingEventId(null);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!window.confirm("¿Eliminar este evento operativo?")) {
      return;
    }

    setUpdatingEventId(eventId);
    try {
      await deleteProjectAgendaEventDb(eventId);
      toast.success("Evento eliminado.");
      setDialogOpen(false);
      setEditingEventId(null);
      window.dispatchEvent(new Event("projectAgendaUpdated"));
      void loadAgenda();
    } catch (error: any) {
      toast.error(error?.message ?? "No se pudo eliminar el evento.");
    } finally {
      setUpdatingEventId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="font-montserrat text-3xl font-bold tracking-tight">
            Agenda Operativa
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Centraliza plazos, hitos, clima, incidencias, compras, cobros,
            contratos, liquidaciones y seguimientos manuales por obra.
          </p>
        </div>

        <Button className="gap-2" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          Nuevo evento
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>
              {editingEventId ? "Editar evento operativo" : "Registrar evento operativo"}
            </DialogTitle>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={handleCreateOrUpdate}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Obra</Label>
                <Select value={form.projectId} onValueChange={handleFormProjectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar obra" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataset.projects.map((project) => (
                      <SelectItem key={project.id} value={String(project.id)}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Fase</Label>
                <Select
                  value={form.phaseId}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, phaseId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="General / sin fase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General / sin fase</SelectItem>
                    {selectedProjectPhases.map((phase) => (
                      <SelectItem key={phase.id} value={phase.id}>
                        {phase.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="agendaTitle">Título</Label>
              <Input
                id="agendaTitle"
                required
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Ej. reunión con proveedor, inspección municipal, control de hormigonado"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="grid gap-2">
                <Label>Categoría</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      category: value as ProjectAgendaEvent["category"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AGENDA_MANUAL_CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Estado</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      status: value as ProjectAgendaEvent["status"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MANUAL_STATUS_OPTIONS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {AGENDA_EVENT_STATUS_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Prioridad</Label>
                <Select
                  value={form.priority}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      priority: value as ProjectAgendaEvent["priority"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AGENDA_EVENT_PRIORITY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Responsable</Label>
                <Select
                  value={form.assigneeId}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, assigneeId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {selectedProjectAssignees.map((assignee) => (
                      <SelectItem key={assignee.id} value={String(assignee.id)}>
                        {assignee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="agendaAllDay">Evento de día completo</Label>
                <p className="text-xs text-muted-foreground">
                  Usalo para vencimientos, hitos o seguimientos diarios.
                </p>
              </div>
              <Switch
                id="agendaAllDay"
                checked={form.isAllDay}
                onCheckedChange={(checked) =>
                  setForm((current) => ({
                    ...current,
                    isAllDay: checked,
                    startsAt: checked
                      ? dateInputToIsoDay(current.startsAt)
                      : current.startsAt
                        ? `${dateInputToIsoDay(current.startsAt)}T09:00`
                        : "",
                    endsAt: current.endsAt
                      ? checked
                        ? dateInputToIsoDay(current.endsAt)
                        : `${dateInputToIsoDay(current.endsAt)}T10:00`
                      : "",
                  }))
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="agendaStart">Inicio</Label>
                <Input
                  id="agendaStart"
                  type={form.isAllDay ? "date" : "datetime-local"}
                  required
                  value={form.startsAt}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, startsAt: event.target.value }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="agendaEnd">Fin</Label>
                <Input
                  id="agendaEnd"
                  type={form.isAllDay ? "date" : "datetime-local"}
                  value={form.endsAt}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, endsAt: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="agendaReminder">Recordatorio</Label>
              <Input
                id="agendaReminder"
                type="datetime-local"
                value={form.reminderAt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, reminderAt: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="agendaDescription">Detalle</Label>
              <Textarea
                id="agendaDescription"
                rows={4}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Qué hay que controlar, qué plazo vence o qué seguimiento operativo hay que mantener."
              />
            </div>

            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <div>
                {editingEventId ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => void handleDelete(editingEventId)}
                    disabled={isSubmitting || updatingEventId === editingEventId}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Guardando..."
                    : editingEventId
                      ? "Guardar cambios"
                      : "Registrar evento"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Próximos 7 días</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.upcomingWeek}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vencidos / atrasados</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <TriangleAlert className="h-5 w-5 text-destructive" />
            {stats.overdue}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Críticos activos</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <Clock3 className="h-5 w-5 text-orange-500" />
            {stats.critical}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recordatorios vencidos</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <BellRing className="h-5 w-5 text-blue-600" />
            {stats.reminders}
          </CardContent>
        </Card>
      </div>

      {reminderEvents.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recordatorios activos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reminderEvents.map((event) => (
              <div
                key={`reminder-${event.id}`}
                className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.projectName}
                    {event.assigneeName ? ` · Responsable: ${event.assigneeName}` : ""}
                  </p>
                </div>
                <Badge variant={getPriorityBadgeVariant(event.priority)}>
                  {event.reminderAt
                    ? `Recordar ${formatDateTime(event.reminderAt, false)}`
                    : "Recordatorio"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Obra" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las obras</SelectItem>
            {dataset.projects.map((project) => (
              <SelectItem key={project.id} value={String(project.id)}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {typeOptions.map((type) => (
              <SelectItem key={type} value={type}>
                {AGENDA_EVENT_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(AGENDA_EVENT_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 md:p-5">
          {isLoading ? (
            <div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground">
              Cargando agenda operativa...
            </div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              locale={esLocale}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              buttonText={{
                today: "Hoy",
                month: "Mes",
                week: "Semana",
                day: "Día",
              }}
              events={calendarEvents}
              selectable
              select={handleDateSelect}
              eventClick={handleEventClick}
              dayMaxEvents
              height="auto"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{selectedDateTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay eventos operativos para la fecha seleccionada.
            </p>
          ) : (
            <div className="space-y-3">
              {selectedDayEvents.map((event) => (
                <div key={event.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.projectName}
                        {event.phaseName ? ` · ${event.phaseName}` : ""}
                        {event.assigneeName ? ` · Responsable: ${event.assigneeName}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {AGENDA_EVENT_TYPE_LABELS[event.type]}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(event.status)}>
                        {AGENDA_EVENT_STATUS_LABELS[event.status]}
                      </Badge>
                      <Badge variant={getPriorityBadgeVariant(event.priority)}>
                        {AGENDA_EVENT_PRIORITY_LABELS[event.priority]}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      {formatDateTime(event.start, event.allDay)}
                      {event.end ? ` → ${formatDateTime(event.end, event.allDay)}` : ""}
                    </p>
                    {event.reminderAt ? (
                      <p>Recordatorio: {formatDateTime(event.reminderAt, false)}</p>
                    ) : null}
                    {event.description ? <p>{event.description}</p> : null}
                  </div>

                  {event.editable ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div className="grid gap-2 sm:max-w-[260px]">
                        <Label className="text-xs text-muted-foreground">
                          Estado del seguimiento
                        </Label>
                        <Select
                          value={event.status}
                          onValueChange={(value) =>
                            void handleManualStatusChange(
                              event.sourceId,
                              value as ProjectAgendaEvent["status"]
                            )
                          }
                          disabled={updatingEventId === event.sourceId}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MANUAL_STATUS_OPTIONS.map((value) => (
                              <SelectItem key={value} value={value}>
                                {AGENDA_EVENT_STATUS_LABELS[value]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={() => openEditDialog(event.sourceId)}
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
