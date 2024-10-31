"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const recentClients = [
  {
    name: "Carlos Rodríguez",
    email: "carlos@ejemplo.com",
    project: "Edificio Residencial Norte",
    avatar: "/avatars/01.png",
    initials: "CR",
  },
  {
    name: "María González",
    email: "maria@ejemplo.com",
    project: "Centro Comercial Este",
    avatar: "/avatars/02.png",
    initials: "MG",
  },
  {
    name: "Juan Pérez",
    email: "juan@ejemplo.com",
    project: "Complejo Deportivo Sur",
    avatar: "/avatars/03.png",
    initials: "JP",
  },
];

export function RecentClients() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Clientes Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentClients.map((client) => (
            <div
              key={client.email}
              className="flex items-center space-x-4"
            >
              <Avatar>
                <AvatarImage src={client.avatar} alt={client.name} />
                <AvatarFallback>{client.initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{client.name}</p>
                <p className="text-xs text-muted-foreground">{client.project}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}