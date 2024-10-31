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
import { 
  MoreVertical, 
  Mail, 
  Phone, 
  MessageSquare,
  FileText
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const clients = [
  {
    name: "Sara Martínez",
    company: "Espacios Modernos S.L.",
    email: "sara@espaciosmodernos.com",
    phone: "+34 612 345 678",
    projects: 3,
    lastInteraction: "2024-03-15",
    status: "Activo",
    notificationPrefs: ["email", "sms"],
    avatar: "/avatars/sara.jpg",
  },
  {
    name: "Miguel Chen",
    company: "Desarrollo Urbano Co.",
    email: "mchen@desarrollourbano.com",
    phone: "+34 623 456 789",
    projects: 2,
    lastInteraction: "2024-03-14",
    status: "Activo",
    notificationPrefs: ["email"],
    avatar: "/avatars/miguel.jpg",
  },
  {
    name: "Elena Wilson",
    company: "Constructores Sostenibles",
    email: "elena@sostenible.com",
    phone: "+34 634 567 890",
    projects: 1,
    lastInteraction: "2024-03-10",
    status: "Nuevo",
    notificationPrefs: ["email", "push"],
    avatar: "/avatars/elena.jpg",
  },
];

export function ClientList() {
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
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.email}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={client.avatar} />
                    <AvatarFallback>{client.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
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
              <TableCell>{client.projects}</TableCell>
              <TableCell>{new Date(client.lastInteraction).toLocaleDateString()}</TableCell>
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}