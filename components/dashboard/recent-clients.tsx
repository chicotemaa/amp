"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getRecentClients } from "@/lib/api/clients";
import { getProjectById } from "@/lib/api/projects";

export function RecentClients() {
  const clients = getRecentClients(3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clientes Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {clients.map((client) => {
            const lastProject = client.projectIds.length > 0
              ? getProjectById(client.projectIds[client.projectIds.length - 1])
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
      </CardContent>
    </Card>
  );
}