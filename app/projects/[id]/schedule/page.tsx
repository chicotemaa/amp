import { Metadata } from "next";
import { ScheduleOverview } from "@/components/projects/schedule/schedule-overview";
import { LaborCosts } from "@/components/projects/schedule/labor-costs";
import { MaterialsTracking } from "@/components/projects/schedule/materials-tracking";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { assertPermission, assertProjectAccess } from "@/lib/auth/server-guards";
import { getCurrentRoleServer, getEffectiveUiRoleServer } from "@/lib/supabase/auth-server";
import { getRoleLabel } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gestión de Obra | ArquiManagerPro",
  description: "Gestión de cronograma, personal y materiales de obra",
};

export default async function SchedulePage({ params }: { params: { id: string } }) {
  const projectId = Number(params.id);
  const [role, uiRole] = await Promise.all([
    getCurrentRoleServer(),
    getEffectiveUiRoleServer(),
    assertPermission("planning.view"),
    assertProjectAccess(projectId),
  ]).then(([currentRole, effectiveUiRole]) => [currentRole, effectiveUiRole] as const);

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Gestión de Obra</h1>
          <p className="text-muted-foreground">
            Control de cronograma, personal y materiales
          </p>
          {uiRole && uiRole !== role ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Vista simulada: {getRoleLabel(uiRole)}
            </p>
          ) : null}
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
