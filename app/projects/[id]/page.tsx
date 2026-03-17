import { Metadata } from "next";
import { ProjectHeader } from "@/components/projects/project-detail/project-header";
import { ProjectOverview } from "@/components/projects/project-detail/project-overview";
import { ProjectTimeline } from "@/components/projects/project-detail/project-timeline";
import { ProjectTeam } from "@/components/projects/project-detail/project-team";
import { ProgressReport } from "@/components/projects/project-detail/progress-report";
import { BudgetModule } from "@/components/projects/budget/budget-module";
import { DocumentsModule } from "@/components/projects/documents/documents-module";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentRoleServer, getEffectiveUiRoleServer } from "@/lib/supabase/auth-server";
import { getRoleLabel, getVisibleProjectTabs, isFieldRole } from "@/lib/auth/roles";
import { DailyProgressForm } from "@/components/projects/project-detail/daily-progress-form";
import { IncidentReporter } from "@/components/projects/project-detail/incident-reporter";
import { ChangeOrdersBoard } from "@/components/projects/project-detail/change-orders-board";
import { assertProjectAccess } from "@/lib/auth/server-guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detalle de Proyecto | ArquiManagerPro",
  description: "Información detallada del proyecto",
};

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const projectId = Number(params.id);
  const [role, uiRole] = await Promise.all([
    getCurrentRoleServer(),
    getEffectiveUiRoleServer(),
    assertProjectAccess(projectId),
  ]).then(([currentRole, effectiveUiRole]) => [currentRole, effectiveUiRole] as const);
  const visibleTabs = getVisibleProjectTabs(uiRole);
  const prioritizeFieldOps = isFieldRole(uiRole);
  const defaultTab = prioritizeFieldOps ? "progress" : visibleTabs[0] ?? "overview";

  return (
    <div className="container mx-auto py-8">
      <ProjectHeader projectId={params.id} role={uiRole} />
      {uiRole && uiRole !== role ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Vista simulada: {getRoleLabel(uiRole)}
        </p>
      ) : null}
      <Tabs defaultValue={defaultTab} className="mt-8">
        <TabsList className="flex-wrap h-auto gap-1">
          {visibleTabs.includes("overview") ? <TabsTrigger value="overview">Resumen</TabsTrigger> : null}
          {visibleTabs.includes("timeline") ? <TabsTrigger value="timeline">Cronograma</TabsTrigger> : null}
          {visibleTabs.includes("team") ? <TabsTrigger value="team">Equipo</TabsTrigger> : null}
          {visibleTabs.includes("documents") ? <TabsTrigger value="documents">Documentos</TabsTrigger> : null}
          {visibleTabs.includes("budget") ? <TabsTrigger value="budget">Presupuesto</TabsTrigger> : null}
          {visibleTabs.includes("change-orders") ? (
            <TabsTrigger value="change-orders">Ordenes de Cambio</TabsTrigger>
          ) : null}
          {visibleTabs.includes("progress") ? <TabsTrigger value="progress">Avance</TabsTrigger> : null}
        </TabsList>
        {visibleTabs.includes("overview") ? (
          <TabsContent value="overview">
            <ProjectOverview projectId={params.id} />
          </TabsContent>
        ) : null}
        {visibleTabs.includes("timeline") ? (
          <TabsContent value="timeline">
            <ProjectTimeline projectId={params.id} />
          </TabsContent>
        ) : null}
        {visibleTabs.includes("team") ? (
          <TabsContent value="team">
            <ProjectTeam projectId={params.id} />
          </TabsContent>
        ) : null}
        {visibleTabs.includes("documents") ? (
          <TabsContent value="documents">
            <DocumentsModule projectId={params.id} />
          </TabsContent>
        ) : null}
        {visibleTabs.includes("budget") ? (
          <TabsContent value="budget">
            <BudgetModule projectId={params.id} />
          </TabsContent>
        ) : null}
        {visibleTabs.includes("change-orders") ? (
          <TabsContent value="change-orders">
            <ChangeOrdersBoard projectId={params.id} role={uiRole} />
          </TabsContent>
        ) : null}
        {visibleTabs.includes("progress") ? (
          <TabsContent value="progress">
            {prioritizeFieldOps ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <DailyProgressForm projectId={params.id} />
                <IncidentReporter projectId={params.id} />
                <div className="lg:col-span-2">
                  <ProgressReport projectId={params.id} role={uiRole} />
                </div>
              </div>
            ) : (
              <ProgressReport projectId={params.id} role={uiRole} />
            )}
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
