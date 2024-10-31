import { Metadata } from "next";
import { ProjectHeader } from "@/components/projects/project-detail/project-header";
import { ProjectOverview } from "@/components/projects/project-detail/project-overview";
import { ProjectTimeline } from "@/components/projects/project-detail/project-timeline";
import { ProjectTeam } from "@/components/projects/project-detail/project-team";
import { ProjectDocuments } from "@/components/projects/project-detail/project-documents";
import { ProgressReport } from "@/components/projects/project-detail/progress-report";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Detalle de Proyecto | ArquiManagerPro",
  description: "Información detallada del proyecto",
};

// Esta función es requerida para la generación estática
export async function generateStaticParams() {
  // En un caso real, obtendríamos los IDs de los proyectos de una API
  return [{ id: "1" }, { id: "2" }, { id: "3" }];
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-8">
      <ProjectHeader projectId={params.id} />
      <Tabs defaultValue="overview" className="mt-8">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="timeline">Cronograma</TabsTrigger>
          <TabsTrigger value="team">Equipo</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
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
          <ProjectDocuments projectId={params.id} />
        </TabsContent>
        <TabsContent value="progress">
          <ProgressReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}