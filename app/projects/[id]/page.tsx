import { Metadata } from "next";
import { ProjectHeader } from "@/components/projects/project-detail/project-header";
import { ProjectOverview } from "@/components/projects/project-detail/project-overview";
import { ProjectTimeline } from "@/components/projects/project-detail/project-timeline";
import { ProjectTeam } from "@/components/projects/project-detail/project-team";
import { ProgressReport } from "@/components/projects/project-detail/progress-report";
import { BudgetModule } from "@/components/projects/budget/budget-module";
import { DocumentsModule } from "@/components/projects/documents/documents-module";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentRoleServer } from "@/lib/supabase/auth-server";
import { canAccessBudget, isFieldRole } from "@/lib/auth/roles";
import { DailyProgressForm } from "@/components/projects/project-detail/daily-progress-form";
import { IncidentReporter } from "@/components/projects/project-detail/incident-reporter";

export const metadata: Metadata = {
  title: "Detalle de Proyecto | ArquiManagerPro",
  description: "Información detallada del proyecto",
};

export async function generateStaticParams() {
  return [
    { id: "1" },
    { id: "2" },
    { id: "3" },
    { id: "4" },
    { id: "5" },
    { id: "6" },
  ];
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const role = await getCurrentRoleServer();
  const showBudget = canAccessBudget(role);
  const prioritizeFieldOps = isFieldRole(role);

  return (
    <div className="container mx-auto py-8">
      <ProjectHeader projectId={params.id} />
      <Tabs defaultValue={prioritizeFieldOps ? "progress" : "overview"} className="mt-8">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="timeline">Cronograma</TabsTrigger>
          <TabsTrigger value="team">Equipo</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          {showBudget ? <TabsTrigger value="budget">Presupuesto</TabsTrigger> : null}
          <TabsTrigger value="progress">Avance</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <ProjectOverview projectId={params.id} />
        </TabsContent>
        <TabsContent value="timeline">
          <ProjectTimeline projectId={params.id} />
        </TabsContent>
        <TabsContent value="team">
          <ProjectTeam projectId={params.id} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsModule projectId={params.id} />
        </TabsContent>
        {showBudget ? (
          <TabsContent value="budget">
            <BudgetModule projectId={params.id} />
          </TabsContent>
        ) : null}
        <TabsContent value="progress">
          {prioritizeFieldOps ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <DailyProgressForm projectId={params.id} />
              <IncidentReporter projectId={params.id} />
              <div className="lg:col-span-2">
                <ProgressReport projectId={params.id} />
              </div>
            </div>
          ) : (
            <ProgressReport projectId={params.id} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
