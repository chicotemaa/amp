"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Building2, Calendar, MapPin, Users2 } from "lucide-react";

interface ProjectHeaderProps {
  projectId: string;
}

export function ProjectHeader({ projectId }: ProjectHeaderProps) {
  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Building2 className="h-4 w-4" />
            <span>Proyecto #{projectId}</span>
          </div>
          <h1 className="text-2xl font-bold">Modern Office Complex</h1>
          <div className="flex items-center gap-2 mt-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>Downtown Business District</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Ene 15, 2024 - Jun 30, 2024
          </Button>
          <Button variant="outline">
            <Users2 className="h-4 w-4 mr-2" />
            12 miembros
          </Button>
        </div>
      </div>
    </Card>
  );
}