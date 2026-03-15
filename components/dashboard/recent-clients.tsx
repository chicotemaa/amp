"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getClientsDb } from "@/lib/api/clients";
import { getProjectsDb } from "@/lib/api/projects";
import type { Client } from "@/lib/types/client";
import type { Project } from "@/lib/types/project";

export function RecentClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projectsMap, setProjectsMap] = useState<Map<number, Project>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([getClientsDb(), getProjectsDb()])
      .then(([clientsData, projectsData]) => {
        if (!mounted) return;

        const recentClients = [...clientsData]
          .sort(
            (a, b) =>
              new Date(b.lastInteraction).getTime() - new Date(a.lastInteraction).getTime()
          )
          .slice(0, 3);

        setClients(recentClients);
        setProjectsMap(new Map(projectsData.map((project) => [project.id, project])));
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clientes Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando clientes...</p>
        ) : (
          <div className="space-y-4">
          {clients.map((client) => {
            const lastProject = client.projectIds.length > 0
              ? projectsMap.get(client.projectIds[client.projectIds.length - 1]) ?? null
              : null;
            const initials = client.name
              .split(" ")
              .map((n) => n[0])
              .join("");

            return (
              <div key={client.email} className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={client.avatar} alt={client.name} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-0.5 min-w-0">
                  <p className="text-sm font-medium">{client.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {lastProject?.name ?? client.company}
                  </p>
                </div>
                <Badge
                  variant={client.status === "Activo" ? "default" : "secondary"}
                  className="shrink-0 text-xs"
                >
                  {client.status}
                </Badge>
              </div>
            );
          })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
