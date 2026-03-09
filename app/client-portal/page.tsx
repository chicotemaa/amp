import { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/auth-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const metadata: Metadata = {
  title: "Portal del Cliente | ArquiManagerPro",
  description: "Seguimiento transparente de obra para clientes",
};

type ClientProjectRow = {
  projects: {
    id: number;
    name: string;
    progress: number | null;
    status: string | null;
    start_date: string | null;
    end_date: string | null;
  } | null;
};

export default async function ClientPortalPage() {
  let projects: ClientProjectRow[] = [];

  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("client_id")
        .eq("id", user.id)
        .single();

      if (profile?.client_id) {
        const { data } = await supabase
          .from("client_projects")
          .select(
            "projects:project_id ( id, name, progress, status, start_date, end_date )"
          )
          .eq("client_id", profile.client_id);
        projects = (data ?? []) as ClientProjectRow[];
      }
    }
  } catch {
    projects = [];
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-montserrat text-3xl font-bold tracking-tight mb-2">
          Portal del Cliente
        </h1>
        <p className="text-muted-foreground">
          Avance de tus proyectos, hitos y estado general de obra.
        </p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            No hay proyectos asignados a tu cuenta.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((row) => {
            const project = row.projects;
            if (!project) return null;
            return (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle className="text-base">{project.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Avance general</p>
                    <Progress value={project.progress ?? 0} className="h-2" />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {project.progress ?? 0}% completado
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Estado: {project.status ?? "Sin estado"}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

