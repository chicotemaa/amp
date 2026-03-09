"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getEmployeesByProjectDb } from "@/lib/api/employees";
import { getProjectByIdDb } from "@/lib/api/projects";
import { Project } from "@/lib/types/project";
import { Employee } from "@/lib/types/employee";

interface ProjectTeamProps {
  projectId: string;
}

export function ProjectTeam({ projectId }: ProjectTeamProps) {
  const id = Number(projectId);
  const [project, setProject] = useState<Project | null>(null);
  const [teamMembers, setTeamMembers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [proj, emps] = await Promise.all([
        getProjectByIdDb(id),
        getEmployeesByProjectDb(id)
      ]);
      setProject(proj);
      setTeamMembers(emps);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Cargando equipo...</div>;
  }

  if (!project) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Equipo del Proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Proyecto no encontrado.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipo del Proyecto</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={member.avatar} />
                <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium leading-none">{member.name}</p>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </div>
            </div>
          ))}
          {teamMembers.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay miembros internos asignados para el proyecto #{projectId}.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
