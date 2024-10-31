"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProjectTeamProps {
  projectId: string;
}

export function ProjectTeam({ projectId }: ProjectTeamProps) {
  const teamMembers = [
    {
      name: "Carlos Rodríguez",
      role: "Arquitecto Principal",
      avatar: "/avatars/01.png",
    },
    {
      name: "Ana García",
      role: "Ingeniera Estructural",
      avatar: "/avatars/02.png",
    },
    {
      name: "Luis Torres",
      role: "Supervisor de Obra",
      avatar: "/avatars/03.png",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipo del Proyecto</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teamMembers.map((member, index) => (
            <div key={index} className="flex items-center space-x-4">
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
        </div>
      </CardContent>
    </Card>
  );
}