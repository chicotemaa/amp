import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentRoleServer, getEffectiveUiRoleServer } from "@/lib/supabase/auth-server";
import { OperationsWorkspace } from "@/components/operations/operations-workspace";
import { getRoleLabel, isClientRole } from "@/lib/auth/roles";
import { getAccessibleProjectsServer } from "@/lib/auth/server-guards";

export const metadata: Metadata = {
  title: "Operaciones | ArquiManagerPro",
  description: "Carga operativa de avances e incidentes de obra",
};

type OperationsProjectRow = {
  id: number;
  name: string;
  status: string | null;
  progress: number | null;
};

export default async function OperationsPage() {
  const role = await getCurrentRoleServer();
  const uiRole = await getEffectiveUiRoleServer();

  if (isClientRole(role)) {
    redirect("/client-portal");
  }

  if (!role) {
    redirect("/login");
  }

  const { data, error } = await getAccessibleProjectsServer("id, name, status, progress");
  const projects = data as OperationsProjectRow[];
  const fetchError = error;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-montserrat text-3xl font-bold tracking-tight mb-2">
          Operaciones de Obra
        </h1>
        <p className="text-muted-foreground">
          Registra avances diarios, incidentes y monitorea el estado operativo por proyecto.
          {uiRole && uiRole !== role ? ` · Vista simulada: ${getRoleLabel(uiRole)}` : ""}
        </p>
      </div>
      <OperationsWorkspace projects={projects} fetchError={fetchError} role={uiRole} />
    </div>
  );
}
