"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users2 } from "lucide-react";
import Link from "next/link";
import { useFilters } from "@/contexts/filter-context";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { getProjectsDb } from "@/lib/api/projects";
import {
  Project,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  PROJECT_TYPE_LABELS,
} from "@/lib/types/project";

const DATE_FILTER_DAYS: Record<string, number> = {
  "last-7": 7,
  "last-30": 30,
  "last-90": 90,
};

function sortProjects(projects: Project[], sortBy: string): Project[] {
  const sorted = [...projects];
  switch (sortBy) {
    case "oldest":
      return sorted.sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
    case "budget-desc":
      return sorted.sort((a, b) => b.budget - a.budget);
    case "budget-asc":
      return sorted.sort((a, b) => a.budget - b.budget);
    case "progress-desc":
      return sorted.sort((a, b) => b.progress - a.progress);
    case "progress-asc":
      return sorted.sort((a, b) => a.progress - b.progress);
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case "newest":
    default:
      return sorted.sort(
        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
  }
}

export function ProjectGrid() {
  const { filters } = useFilters();
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const filterProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const projects = await getProjectsDb();
      const newestProjectDate = projects.reduce((latest, project) => {
        const current = new Date(project.startDate).getTime();
        return current > latest ? current : latest;
      }, 0);
      const filtered = projects.filter((project) => {
        const matchesSearch = filters.searchTerm
          ? project.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          project.location.toLowerCase().includes(filters.searchTerm.toLowerCase())
          : true;
        const matchesStatus =
          filters.status.length === 0 ||
          filters.status.includes(project.status);
        const matchesType =
          filters.type.length === 0 ||
          filters.type.includes(project.type);
        const matchesDate =
          filters.date.length === 0 ||
          filters.date.some((dateFilter) => {
            const days = DATE_FILTER_DAYS[dateFilter];
            if (!days) return true;
            const threshold = newestProjectDate - days * 24 * 60 * 60 * 1000;
            return new Date(project.startDate).getTime() >= threshold;
          });

        return matchesSearch && matchesStatus && matchesType && matchesDate;
      });

      setFilteredProjects(sortProjects(filtered, filters.sortBy || "newest"));
    } catch (err: any) {
      console.error(err);
      setError(err instanceof Error ? err : new Error("Error al filtrar proyectos"));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    filterProjects();

    // Add event listener to refetch when a new project is created
    const handleProjectCreated = () => {
      filterProjects();
    };
    window.addEventListener('projectCreated', handleProjectCreated);
    return () => window.removeEventListener('projectCreated', handleProjectCreated);
  }, [filterProjects]);

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-destructive">Error: {error.message}</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center p-4">Cargando proyectos...</div>;
  }

  if (filteredProjects.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">
          No se encontraron proyectos que coincidan con los filtros.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {filteredProjects.map((project, index) => (
        <Link href={`/projects/${project.id}`} key={project.id}>
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video relative">
              <Image
                src={project.image}
                alt={project.name}
                fill
                className="object-cover"
                priority={index < 2}
              />
              <Badge className={`absolute top-2 right-2 ${PROJECT_STATUS_COLORS[project.status]}`}>
                {PROJECT_STATUS_LABELS[project.status]}
              </Badge>
              <Badge variant="secondary" className="absolute top-2 left-2">
                {PROJECT_TYPE_LABELS[project.type]}
              </Badge>
            </div>
            <CardHeader>
              <h3 className="font-semibold text-lg">{project.name}</h3>
              <p className="text-sm text-muted-foreground">{project.location}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progreso</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>{project.startDate}</span>
                  </div>
                  <div className="flex items-center">
                    <Users2 className="mr-2 h-4 w-4" />
                    <span>{project.teamSize}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="text-sm font-medium">
                Presupuesto: ${project.budget.toLocaleString()}
              </div>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}
