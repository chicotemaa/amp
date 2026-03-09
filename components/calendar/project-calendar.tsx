"use client";

import { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import type { DateSelectArg, EventClickArg, EventInput } from "@fullcalendar/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getProjectsDb } from "@/lib/api/projects";
import { Project } from "@/lib/types/project";

type CalendarEventType = "start" | "review" | "milestone" | "meeting" | "end";
type CalendarEventStatus = "pending" | "in-progress" | "completed" | "delayed";

type CalendarEvent = EventInput & {
  extendedProps: {
    projectId: number;
    type: CalendarEventType;
    status: CalendarEventStatus;
  };
};

const TYPE_LABELS: Record<CalendarEventType, string> = {
  start: "Inicio de Obra",
  review: "Revisión",
  milestone: "Hito",
  meeting: "Reunión",
  end: "Finalización",
};

const STATUS_LABELS: Record<CalendarEventStatus, string> = {
  pending: "Pendiente",
  "in-progress": "En progreso",
  completed: "Completado",
  delayed: "Retrasado",
};

const TYPE_COLORS: Record<CalendarEventType, string> = {
  start: "#16a34a",
  review: "#d97706",
  milestone: "#2563eb",
  meeting: "#0f766e",
  end: "#dc2626",
};

function addDays(dateIso: string, days: number) {
  const date = new Date(dateIso);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function dateInputToIsoDay(value: EventInput["start"]) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" || typeof value === "number") {
    return new Date(value).toISOString().slice(0, 10);
  }
  return "";
}

function buildEvents(projects: Project[]): CalendarEvent[] {
  return projects.flatMap((project) => {
    const delayed = project.status === "in-progress" && !project.onTrack;
    const baseStatus: CalendarEventStatus = delayed ? "delayed" : project.status === "completed" ? "completed" : "in-progress";

    return [
      {
        id: `${project.id}-start`,
        title: `Inicio - ${project.name}`,
        start: `${project.startDate}T09:00:00`,
        end: `${project.startDate}T10:00:00`,
        backgroundColor: TYPE_COLORS.start,
        borderColor: TYPE_COLORS.start,
        extendedProps: { projectId: project.id, type: "start", status: baseStatus },
      },
      {
        id: `${project.id}-review`,
        title: `Revisión - ${project.name}`,
        start: addDays(project.startDate, 14),
        allDay: true,
        backgroundColor: TYPE_COLORS.review,
        borderColor: TYPE_COLORS.review,
        extendedProps: { projectId: project.id, type: "review", status: baseStatus },
      },
      {
        id: `${project.id}-milestone`,
        title: `Hito 50% - ${project.name}`,
        start: addDays(project.startDate, 45),
        allDay: true,
        backgroundColor: TYPE_COLORS.milestone,
        borderColor: TYPE_COLORS.milestone,
        extendedProps: { projectId: project.id, type: "milestone", status: baseStatus },
      },
      {
        id: `${project.id}-meeting`,
        title: `Reunión técnica - ${project.name}`,
        start: addDays(project.startDate, 21),
        end: addDays(project.startDate, 21),
        backgroundColor: TYPE_COLORS.meeting,
        borderColor: TYPE_COLORS.meeting,
        extendedProps: { projectId: project.id, type: "meeting", status: "pending" },
      },
      {
        id: `${project.id}-end`,
        title: `Entrega - ${project.name}`,
        start: `${project.endDate}T17:00:00`,
        end: `${project.endDate}T18:00:00`,
        backgroundColor: TYPE_COLORS.end,
        borderColor: TYPE_COLORS.end,
        extendedProps: {
          projectId: project.id,
          type: "end",
          status: project.status === "completed" ? "completed" : "pending",
        },
      },
    ];
  });
}

export function ProjectCalendar() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const allEvents = useMemo(() => buildEvents(projects), [projects]);
  const [projectFilter, setProjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTitle, setSelectedTitle] = useState<string>("Eventos del día");

  useEffect(() => {
    let mounted = true;
    getProjectsDb()
      .then((rows) => {
        if (mounted) setProjects(rows);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      const eventProject = String(event.extendedProps.projectId);
      const eventType = event.extendedProps.type;
      const eventStatus = event.extendedProps.status;
      const matchesProject = projectFilter === "all" || eventProject === projectFilter;
      const matchesType = typeFilter === "all" || eventType === typeFilter;
      const matchesStatus = statusFilter === "all" || eventStatus === statusFilter;
      return matchesProject && matchesType && matchesStatus;
    });
  }, [allEvents, projectFilter, statusFilter, typeFilter]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return filteredEvents.filter((event) => {
      return dateInputToIsoDay(event.start) === selectedDate;
    });
  }, [filteredEvents, selectedDate]);

  const handleDateSelect = (arg: DateSelectArg) => {
    const day = arg.startStr.slice(0, 10);
    setSelectedDate(day);
    setSelectedTitle(`Eventos para ${new Date(arg.start).toLocaleDateString("es-AR")}`);
  };

  const handleEventClick = (arg: EventClickArg) => {
    const day = arg.event.start ? arg.event.start.toISOString().slice(0, 10) : "";
    if (!day) return;
    setSelectedDate(day);
    setSelectedTitle(`Eventos para ${new Date(day).toLocaleDateString("es-AR")}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Proyecto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los proyectos</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={String(project.id)}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los eventos</SelectItem>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
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
            <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
              Cargando calendario...
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
            events={filteredEvents}
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
          <CardTitle>{selectedTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Selecciona una fecha en el calendario para ver sus eventos.
            </p>
          ) : (
            <div className="space-y-3">
              {selectedDayEvents.map((event) => (
                <div key={event.id} className="rounded-lg border p-3">
                  <p className="font-medium">{event.title}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="secondary">{TYPE_LABELS[event.extendedProps.type]}</Badge>
                    <Badge variant="outline">{STATUS_LABELS[event.extendedProps.status]}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
