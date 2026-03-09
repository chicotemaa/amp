import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getProjectStats } from "@/lib/api/projects";

export function ProjectStats() {
  const stats = getProjectStats();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.active.count}</div>
          <p className="text-xs text-muted-foreground">En ejecución</p>
          <div className="mt-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span>En Tiempo</span>
              <span className="text-green-500">{stats.active.onTrack}</span>
            </div>
            <div className="flex justify-between">
              <span>Con Retraso</span>
              <span className="text-yellow-500">{stats.active.delayed}</span>
            </div>
            <div className="flex justify-between">
              <span>Críticos</span>
              <span className="text-red-500">{stats.active.critical}</span>
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
          <div className="text-2xl font-bold">{stats.completed.count}</div>
          <p className="text-xs text-muted-foreground">Proyectos finalizados</p>
          <div className="mt-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span>En Presupuesto</span>
              <span className="text-green-500">{stats.completed.onBudget}</span>
            </div>
            <div className="flex justify-between">
              <span>Sobre Presupuesto</span>
              <span className="text-yellow-500">{stats.completed.overBudget}</span>
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
          <div className="text-2xl font-bold">{stats.upcoming.count}</div>
          <p className="text-xs text-muted-foreground">En planificación</p>
          <div className="mt-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span>En Planificación</span>
              <span className="text-blue-500">{stats.upcoming.inPlanning}</span>
            </div>
            <div className="flex justify-between">
              <span>Listos para Iniciar</span>
              <span className="text-green-500">{stats.upcoming.readyToStart}</span>
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
          <div className="text-2xl font-bold">{stats.issues.count}</div>
          <p className="text-xs text-muted-foreground">Requieren atención</p>
          <div className="mt-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span>Menores</span>
              <span className="text-yellow-500">{stats.issues.minor}</span>
            </div>
            <div className="flex justify-between">
              <span>Mayores</span>
              <span className="text-orange-500">{stats.issues.major}</span>
            </div>
            <div className="flex justify-between">
              <span>Críticas</span>
              <span className="text-red-500">{stats.issues.critical}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}