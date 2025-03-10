"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClientFiltersProps {
  onFilterChange: (filters: { searchTerm: string; status: string; sortOrder: string }) => void;
}

export function ClientFilters({ onFilterChange }: ClientFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("recent");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    onFilterChange({ searchTerm: newSearchTerm, status, sortOrder });
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    onFilterChange({ searchTerm, status: value, sortOrder });
  };

  const handleSortOrderChange = (value: string) => {
    setSortOrder(value);
    onFilterChange({ searchTerm, status, sortOrder: value });
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="relative flex-1 md:max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar clientes..."
          className="pl-8"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="activo">Activos</SelectItem>
            <SelectItem value="inactivo">Inactivos</SelectItem>
            <SelectItem value="potencial">Potenciales</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={handleSortOrderChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Más Recientes</SelectItem>
            <SelectItem value="name">Nombre</SelectItem>
            <SelectItem value="projects">Nº de Proyectos</SelectItem>
            <SelectItem value="interactions">Interacciones</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
