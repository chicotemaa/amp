import { Metadata } from "next";
import { ClientList } from "@/components/clients/client-list";
import { ClientStats } from "@/components/clients/client-stats";
import { ClientFilters } from "@/components/clients/client-filters";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Clientes | ArchiPro",
  description: "Gestión de clientes y relaciones",
};

export default function ClientsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-montserrat text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona y monitorea las relaciones con los clientes
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      <ClientStats />
      <ClientFilters />
      <ClientList />
    </div>
  );
}