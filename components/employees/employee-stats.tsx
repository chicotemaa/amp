import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Users, UserCheck, Clock, Briefcase } from "lucide-react";
import { getEmployeeStats } from "@/lib/api/employees";

export function EmployeeStats() {
  const stats = getEmployeeStats();

  const cards = [
    {
      title: "Total Empleados",
      value: String(stats.total),
      description: "+1 incorporación este mes",
      icon: Users,
    },
    {
      title: "Activos en Proyectos",
      value: String(stats.inProject),
      description: `${Math.round((stats.inProject / stats.total) * 100)}% del equipo`,
      icon: UserCheck,
    },
    {
      title: "Horas Registradas",
      value: stats.hoursThisWeek.toLocaleString(),
      description: "Esta semana",
      icon: Clock,
    },
    {
      title: "Proyectos Activos",
      value: String(stats.activeProjects),
      description: "Con personal asignado",
      icon: Briefcase,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}