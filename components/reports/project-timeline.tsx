"use client";

import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { getProjectsDb } from "@/lib/api/projects";
import type { Project } from "@/lib/types/project";

const STATUS_STYLES: Record<Project["status"], string> = {
  planning: "text-orange-500",
  "in-progress": "text-blue-500",
  completed: "text-green-500",
  "on-hold": "text-gray-500",
};

const STATUS_LABELS: Record<Project["status"], string> = {
  planning: "Planificacion",
  "in-progress": "En obra",
  completed: "Completado",
  "on-hold": "En pausa",
};

export function ProjectTimeline() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getProjectsDb()
      .then((projectsData) => {
        if (!mounted) return;

        const timelineProjects = [...projectsData]
          .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
          .slice(0, 6);

        setProjects(timelineProjects);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ScrollArea className="h-[300px] pr-4">
      {isLoading ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Cargando cronograma...
        </div>
      ) : (
        <div className="space-y-6">
        {projects.map((project) => (
          <div key={project.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{project.name}</h4>
              <span className={`text-sm ${STATUS_STYLES[project.status]}`}>
                {STATUS_LABELS[project.status]}
              </span>
            </div>
            <div className="space-y-1">
              <Progress value={project.progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{project.startDate}</span>
                <span>{project.endDate}</span>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}
    </ScrollArea>
  );
}
