import { Metadata } from "next";
import { ProjectFilters } from "@/components/projects/project-filters";
import { ProjectGrid } from "@/components/projects/project-grid";
import { BackgroundPattern } from "@/components/background-pattern";
import { Suspense } from "react";
import { ProjectsLoading } from "@/components/projects/projects-loading";
import { ErrorBoundary } from "@/components/error-boundary";

export const metadata: Metadata = {
  title: "Proyectos | ArquiManagerPro",
  description: "Gestión de proyectos arquitectónicos",
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ProjectsPage() {
  return (
    <>
      <BackgroundPattern />
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="font-montserrat text-3xl font-bold tracking-tight mb-2">Proyectos</h1>
          <p className="text-muted-foreground">
            Gestiona y monitorea todos los proyectos arquitectónicos
          </p>
        </div>
        <ProjectFilters />
        <ErrorBoundary fallback={<div>Error al cargar los proyectos. Por favor, intente nuevamente.</div>}>
          <Suspense fallback={<ProjectsLoading />}>
            <ProjectGrid />
          </Suspense>
        </ErrorBoundary>
      </div>
    </>
  );
}