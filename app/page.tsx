import { Metadata } from "next";
import { Overview } from "@/components/dashboard/overview";
import { RecentClients } from "@/components/dashboard/recent-clients";
import { RecentReports } from "@/components/dashboard/recent-reports";
import { ProjectsOverview } from "@/components/dashboard/projects-overview";
import { can, getRoleLabel } from "@/lib/auth/roles";
import { getCurrentRoleServer, getEffectiveUiRoleServer } from "@/lib/supabase/auth-server";

export const metadata: Metadata = {
  title: "Dashboard | ArquiManagerPro",
  description: "Panel de control principal",
};

export default async function DashboardPage() {
  const realRole = await getCurrentRoleServer();
  const uiRole = await getEffectiveUiRoleServer();
  const showClients = can(uiRole, "clients.view");
  const showReports = can(uiRole, "reports.view");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-montserrat text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido a ArquiManagerPro
          {uiRole && uiRole !== realRole ? ` · Vista simulada: ${getRoleLabel(uiRole)}` : ""}
        </p>
      </div>

      <Overview role={uiRole} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <ProjectsOverview className="md:col-span-1 lg:col-span-4" />
        <div className="md:col-span-1 lg:col-span-3 space-y-6">
          {showClients ? <RecentClients /> : null}
          {showReports ? <RecentReports /> : null}
        </div>
      </div>
    </div>
  );
}
