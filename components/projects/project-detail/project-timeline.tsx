"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectTimelineProps {
  projectId: string;
}

export function ProjectTimeline({ projectId }: ProjectTimelineProps) {
  const timelineEvents = [
    {
      date: "15 Mar 2024",
      title: "Inicio del Proyecto",
      description: "Kickoff y planificación inicial",
    },
    {
      date: "20 Mar 2024",
      title: "Diseño Arquitectónico",
      description: "Desarrollo de planos preliminares",
    },
    {
      date: "1 Abr 2024",
      title: "Aprobación Municipal",
      description: "Presentación de documentación",
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