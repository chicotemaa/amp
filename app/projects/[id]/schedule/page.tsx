import { Metadata } from "next";
import { ScheduleOverview } from "@/components/projects/schedule/schedule-overview";
import { LaborCosts } from "@/components/projects/schedule/labor-costs";
import { MaterialsTracking } from "@/components/projects/schedule/materials-tracking";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Gestión de Obra | ArquiManagerPro",
  description: "Gestión de cronograma, personal y materiales de obra",
};

export async function generateStaticParams() {
  return [
    { id: "1" },
    { id: "2" },
    { id: "3" }
  ];
}

export default function SchedulePage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Gestión de Obra</h1>
          <p className="text-muted-foreground">
            Control de cronograma, personal y materiales
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Cronograma</TabsTrigger>
            <TabsTrigger value="labor">Personal y Costos</TabsTrigger>
            <TabsTrigger value="materials">Materiales</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <ScheduleOverview projectId={params.id} />
          </TabsContent>

          <TabsContent value="labor" className="space-y-4">
            <LaborCosts projectId={params.id} />
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
            <MaterialsTracking projectId={params.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}