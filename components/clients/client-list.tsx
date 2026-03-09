"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Mail, Phone, MessageSquare, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getClientsDb } from "@/lib/api/clients";
import { getProjectsDb } from "@/lib/api/projects";
import { Client } from "@/lib/types/client";
import { Project } from "@/lib/types/project";
import { useEffect, useState, useCallback } from "react";

interface ClientListProps {
  filters: { searchTerm: string; status: string; sortOrder: string };
}

export function ClientList({ filters }: ClientListProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClientsAndProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedClients, fetchedProjects] = await Promise.all([
        getClientsDb(),
        getProjectsDb(), // Pre-fetch all projects to match titles later
      ]);
      setClients(fetchedClients);
      setProjects(fetchedProjects);
    } catch (err: any) {
      console.error(err);
      setError("Error cargando los datos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientsAndProjects();

    const handleClientCreated = () => {
      fetchClientsAndProjects();
    };
    window.addEventListener("clientCreated", handleClientCreated);
    return () => window.removeEventListener("clientCreated", handleClientCreated);
  }, [fetchClientsAndProjects]);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      client.company.toLowerCase().includes(filters.searchTerm.toLowerCase());
    const matchesStatus =
      filters.status === "all" ||
      client.status.toLowerCase() === filters.status.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <div className="text-center p-4">Cargando clientes...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-destructive">{error}</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Proyectos</TableHead>
            <TableHead>Última Interacción</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Notificaciones</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredClients.map((client) => {
            const initials = client.name
              .split(" ")
              .map((n) => n[0])
              .join("");
            return (
              <TableRow key={client.email}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      {client.avatar && client.avatar.startsWith("http") ? (
                        <AvatarImage src={client.avatar} />
                      ) : null}
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-muted-foreground">{client.company}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{client.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{client.phone}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{client.projectIds.length}</span>
                    <span className="text-xs text-muted-foreground">
                      {client.projectIds
                        .map((id) => projects.find((p) => p.id === id)?.name)
                        .filter(Boolean)
                        .join(", ")
                        .slice(0, 40) || "—"}
                      {client.projectIds.length > 1 ? "…" : ""}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(client.lastInteraction).toLocaleDateString("es-AR")}
                </TableCell>
                <TableCell>
                  <Badge variant={client.status === "Activo" ? "default" : "secondary"}>
                    {client.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {client.notificationPrefs.includes("email") && (
                      <Badge variant="outline" className="text-xs">Email</Badge>
                    )}
                    {client.notificationPrefs.includes("sms") && (
                      <Badge variant="outline" className="text-xs">SMS</Badge>
                    )}
                    {client.notificationPrefs.includes("push") && (
                      <Badge variant="outline" className="text-xs">Push</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>Registrar Interacción</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Ver Historial</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
