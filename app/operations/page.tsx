import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentRoleServer, getSupabaseServerClient } from "@/lib/supabase/auth-server";
import { OperationsWorkspace } from "@/components/operations/operations-workspace";

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

  if (role === "client") {
    redirect("/client-portal");
  }

  if (!role) {
    redirect("/login");
  }

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name, status, progress")
    .order("id", { ascending: true });

  const projects = (data ?? []) as OperationsProjectRow[];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-montserrat text-3xl font-bold tracking-tight mb-2">
          Operaciones de Obra
        </h1>
        <p className="text-muted-foreground">
          Registra avances diarios, incidentes y monitorea el estado operativo por proyecto.
        </p>
      </div>
      <OperationsWorkspace projects={projects} />
    </div>
  );
}
