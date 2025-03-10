import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProjectNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h2 className="text-2xl font-bold mb-4">Proyecto no encontrado</h2>
      <p className="text-muted-foreground mb-6">
        El proyecto que estás buscando no existe o ha sido eliminado.
      </p>
      <Link href="/projects">
        <Button>Volver a Proyectos</Button>
      </Link>
    </div>
  );
}