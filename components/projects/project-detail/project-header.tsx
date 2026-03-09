"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, MapPin, Users2, HardHat } from "lucide-react";
import Link from "next/link";
import { getProjectByIdDb } from "@/lib/api/projects";
import { getClientByIdDb } from "@/lib/api/clients";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS, Project } from "@/lib/types/project";
import { Client } from "@/lib/types/client";

interface ProjectHeaderProps {
  projectId: string;
}

export function ProjectHeader({ projectId }: ProjectHeaderProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const proj = await getProjectByIdDb(Number(projectId));
      setProject(proj);
      if (proj && proj.clientId) {
        const cli = await getClientByIdDb(proj.clientId);
        setClient(cli);
      }
      setLoading(false);
    }
    load();
  }, [projectId]);

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-sm">Cargando cabecera de proyecto...</p>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">Proyecto #{projectId} no encontrado.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Building2 className="h-4 w-4" />
            <span>Proyecto #{projectId}</span>
            {client && (
              <>
                <span className="text-muted-foreground/50">·</span>
                <span className="text-sm truncate">{client.company}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <div className="flex items-center gap-2 mt-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="text-sm">{project.location}</span>
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground mt-2 max-w-lg">{project.description}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <Badge className={PROJECT_STATUS_COLORS[project.status]}>
            {PROJECT_STATUS_LABELS[project.status]}
          </Badge>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            {project.startDate} — {project.endDate}
          </Button>
          <Button variant="outline" size="sm">
            <Users2 className="h-4 w-4 mr-2" />
            {project.teamSize} miembros
          </Button>
          <Link href={`/projects/${projectId}/schedule`}>
            <Button variant="default" size="sm">
              <HardHat className="h-4 w-4 mr-2" />
              Gestión de Obra
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}