"use client";

import { useState } from "react";
import { ClientFilters } from "@/components/clients/client-filters";
import { ClientList } from "@/components/clients/client-list";
import { ClientInteractionDialog } from "@/components/clients/client-interaction-dialog";
import { NewClientDialog } from "@/components/clients/new-client-dialog";
import { ClientStats } from "@/components/clients/client-stats";

export default function ClientsPage() {
  const [filters, setFilters] = useState({
    searchTerm: "",
    status: "all",
    sortOrder: "recent",
  });

  const handleFilterChange = (newFilters: { searchTerm: string; status: string; sortOrder: string }) => {
    setFilters(newFilters);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <NewClientDialog />
      </div>
      <ClientStats/>
      <ClientFilters onFilterChange={handleFilterChange} />
      <ClientList filters={filters} />
    </div>
  );
}
