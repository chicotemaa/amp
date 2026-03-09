"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectByIdDb } from "@/lib/api/projects";
import { Project } from "@/lib/types/project";

interface ProjectTimelineProps {
  projectId: string;
}

export function ProjectTimeline({ projectId }: ProjectTimelineProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjectByIdDb(Number(projectId)).then(p => {
      setProject(p);
      setLoading(false);
    });
  }, [projectId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cronograma del Proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando cronograma...</p>
        </CardContent>
      </Card>
    );
  }
  if (!project) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cronograma del Proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Proyecto no encontrado.</p>
        </CardContent>
      </Card>
    );
  }

  const start = new Date(project.startDate);
  const end = new Date(project.endDate);
  const durationDays = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
  );
  const milestoneDate = (ratio: number) =>
    new Date(start.getTime() + Math.floor(durationDays * ratio) * 24 * 60 * 60 * 1000);
  const formatDate = (date: Date) => date.toLocaleDateString("es-AR");

  const timelineEvents = [
    {
      date: formatDate(start),
      title: "Inicio del proyecto",
      description: `Inicio oficial de ${project.name}.`,
    },
    {
      date: formatDate(milestoneDate(0.3)),
      title: "Hito de diseño y aprobaciones",
      description: "Cierre de etapa de diseño y validaciones técnicas.",
    },
    {
      date: formatDate(milestoneDate(0.6)),
      title: "Ejecución principal de obra",
      description: "Seguimiento de estructura, costos y avance acumulado.",
    },
    {
      date: formatDate(end),
      title: "Fecha objetivo de cierre",
      description: "Finalización planificada del proyecto.",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cronograma del Proyecto</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {timelineEvents.map((event, index) => (
            <div key={index} className="flex gap-4">
              <div className="relative flex flex-col items-center">
                <div className="absolute h-full w-px bg-border" />
                <div className="relative h-2 w-2 rounded-full bg-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm text-muted-foreground">{event.date}</p>
                <h4 className="font-medium leading-none">{event.title}</h4>
                <p className="text-sm text-muted-foreground">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
