import { Metadata } from "next";
import { ProjectFilters } from "@/components/projects/project-filters";
import { ProjectGrid } from "@/components/projects/project-grid";
import { BackgroundPattern } from "@/components/background-pattern";

export const metadata: Metadata = {
  title: "Proyectos | ArquiManagerPro",
  description: "Gestión de proyectos arquitectónicos",
};

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
        <ProjectGrid />
      </div>
    </>
  );
}