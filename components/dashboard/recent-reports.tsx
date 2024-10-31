"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const recentReports = [
  {
    title: "Avance Estructural",
    project: "Edificio Residencial Norte",
    date: "2024-03-15",
    status: "completed",
    author: "Ing. Ana Martínez",
  },
  {
    title: "Instalaciones Eléctricas",
    project: "Centro Comercial Este",
    date: "2024-03-14",
    status: "pending",
    author: "Ing. Roberto Silva",
  },
  {
    title: "Fundaciones",
    project: "Complejo Deportivo Sur",
    date: "2024-03-13",
    status: "in-review",
    author: "Ing. Luis Torres",
  },
];

const statusStyles = {
  completed: "bg-green-500/10 text-green-500",
  pending: "bg-yellow-500/10 text-yellow-500",
  "in-review": "bg-blue-500/10 text-blue-500",
};

export function RecentReports() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reportes Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentReports.map((report) => (
            <div
              key={`${report.project}-${report.date}`}
              className="flex items-center space-x-4"
            >
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{report.title}</p>
                <p className="text-xs text-muted-foreground">
                  {report.project} - {report.author}
                </p>
              </div>
              <Badge className={statusStyles[report.status as keyof typeof statusStyles]}>
                {report.status === "completed" && "Completado"}
                {report.status === "pending" && "Pendiente"}
                {report.status === "in-review" && "En Revisión"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}