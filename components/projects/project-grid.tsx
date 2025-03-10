"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, Users2 } from "lucide-react";
import Link from "next/link";
import { useFilters } from "@/contexts/filter-context";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const projects = [
  {
    id: 1,
    name: "Torre Residencial Marina",
    location: "Zona Costera Este",
    status: "in-progress",
    progress: 75,
    startDate: "2024-01-15",
    endDate: "2024-06-30",
    teamSize: 15,
    budget: 2500000,
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: 2,
    name: "Centro Comercial Plaza Norte",
    location: "Distrito Financiero",
    status: "planning",
    progress: 25,
    startDate: "2024-03-01",
    endDate: "2025-02-28",
    teamSize: 20,
    budget: 4800000,
    image: "https://images.unsplash.com/photo-1519999482648-25049ddd37b1?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: 3,
    name: "Complejo Deportivo Olímpico",
    location: "Parque Central",
    status: "in-progress",
    progress: 45,
    startDate: "2024-02-15",
    endDate: "2024-12-15",
    teamSize: 18,
    budget: 3200000,
    image: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: 4,
    name: "Hospital Metropolitano",
    location: "Distrito Sanitario",
    status: "planning",
    progress: 10,
    startDate: "2024-04-01",
    endDate: "2025-06-30",
    teamSize: 25,
    budget: 6500000,
    image: "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: 5,
    name: "Eco-Resort Costa Verde",
    location: "Bahía del Sol",
    status: "completed",
    progress: 100,
    startDate: "2023-06-15",
    endDate: "2024-02-28",
    teamSize: 12,
    budget: 1800000,
    image: "https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: 6,
    name: "Campus Universitario Tech",
    location: "Zona Educativa",
    status: "in-progress",
    progress: 60,
    startDate: "2023-09-01",
    endDate: "2024-08-31",
    teamSize: 22,
    budget: 5200000,
    image: "https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop&q=60",
  }
];

export function ProjectGrid() {
  const { filters } = useFilters();
  const [filteredProjects, setFilteredProjects] = useState(projects);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500';
      case 'in-progress':
        return 'bg-blue-500/10 text-blue-500';
      case 'planning':
        return 'bg-orange-500/10 text-orange-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'in-progress':
        return 'En Progreso';
      case 'planning':
        return 'Planificación';
      default:
        return status;
    }
  };

  const filterProjects = useCallback(() => {
    try {
      const filtered = projects.filter(project => {
        const matchesSearch = filters.searchTerm 
          ? project.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
            project.location.toLowerCase().includes(filters.searchTerm.toLowerCase())
          : true;
      
        const matchesStatus = filters.status.length === 0 || 
          filters.status.includes("all") || 
          filters.status.includes(project.status);
      
        return matchesSearch && matchesStatus;
      });
      
      setFilteredProjects(filtered);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al filtrar proyectos'));
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    filterProjects();
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
        <p className="text-muted-foreground">No se encontraron proyectos que coincidan con los filtros.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {filteredProjects.map((project) => (
        <Link href={`/projects/${project.id}`} key={project.id}>
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video relative">
              <Image
                src={project.image}
                alt={project.name}
                layout="fill"
                objectFit="cover"
                priority
              />
              <Badge 
                className={`absolute top-2 right-2 ${getStatusColor(project.status)}`}
              >
                {getStatusText(project.status)}
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