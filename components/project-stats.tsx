import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

const projectStatuses = {
  active: {
    count: 12,
    change: "+2",
    details: {
      onTrack: 8,
      delayed: 3,
      critical: 1
    }
  },
  completed: {
    count: 45,
    change: "+5",
    details: {
      onBudget: 38,
      overBudget: 7
    }
  },
  upcoming: {
    count: 6,
    change: "+1",
    details: {
      inPlanning: 4,
      readyToStart: 2
    }
  },
  issues: {
    count: 4,
    change: "-2",
    details: {
      minor: 2,
      major: 1,
      critical: 1
    }
  }
};

export function ProjectStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{projectStatuses.active.count}</div>
          <p className="text-xs text-muted-foreground">
            {projectStatuses.active.change} desde el mes pasado
          </p>
          <div className="mt-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span>En Tiempo</span>
              <span className="text-green-500">{projectStatuses.active.details.onTrack}</span>
            </div>
            <div className="flex justify-between">
              <span>Con Retraso</span>
              <span className="text-yellow-500">{projectStatuses.active.details.delayed}</span>
            </div>
            <div className="flex justify-between">
              <span>Críticos</span>
              <span className="text-red-500">{projectStatuses.active.details.critical}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completados</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{projectStatuses.completed.count}</div>
          <p className="text-xs text-muted-foreground">
            {projectStatuses.completed.change} desde el mes pasado
          </p>
          <div className="mt-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span>En Presupuesto</span>
              <span className="text-green-500">{projectStatuses.completed.details.onBudget}</span>
            </div>
            <div className="flex justify-between">
              <span>Sobre Presupuesto</span>
              <span className="text-yellow-500">{projectStatuses.completed.details.overBudget}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próximos</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{projectStatuses.upcoming.count}</div>
          <p className="text-xs text-muted-foreground">
            {projectStatuses.upcoming.change} desde el mes pasado
          </p>
          <div className="mt-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span>En Planificación</span>
              <span className="text-blue-500">{projectStatuses.upcoming.details.inPlanning}</span>
            </div>
            <div className="flex justify-between">
              <span>Listos para Iniciar</span>
              <span className="text-green-500">{projectStatuses.upcoming.details.readyToStart}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Incidencias</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{projectStatuses.issues.count}</div>
          <p className="text-xs text-muted-foreground">
            {projectStatuses.issues.change} desde el mes pasado
          </p>
          <div className="mt-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span>Menores</span>
              <span className="text-yellow-500">{projectStatuses.issues.details.minor}</span>
            </div>
            <div className="flex justify-between">
              <span>Mayores</span>
              <span className="text-orange-500">{projectStatuses.issues.details.major}</span>
            </div>
            <div className="flex justify-between">
              <span>Críticas</span>
              <span className="text-red-500">{projectStatuses.issues.details.critical}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}