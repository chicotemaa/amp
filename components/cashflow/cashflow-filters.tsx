"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { getProjectsDb } from "@/lib/api/projects";
import { Project } from "@/lib/types/project";
import { useFilters } from "@/contexts/filter-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";

export function CashflowFilters() {
  const { filters, setFilters } = useFilters();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    let mounted = true;
    getProjectsDb().then((data) => {
      if (mounted) setProjects(data);
    });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="relative flex-1 md:max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar transacciones..."
          className="pl-8"
          value={filters.searchTerm}
          onChange={(e) => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
        />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Select
          value={filters.status[0] || "all"}
          onValueChange={(val) => setFilters(f => ({ ...f, status: [val] }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Proyecto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Proyectos</SelectItem>
            {projects.map(p => (
              <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.type[0] || "all"}
          onValueChange={(val) => setFilters(f => ({ ...f, type: [val] }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Tipos</SelectItem>
            <SelectItem value="materials">Materiales</SelectItem>
            <SelectItem value="labor">Mano de Obra</SelectItem>
            <SelectItem value="services">Servicios</SelectItem>
            <SelectItem value="contracts">Contratos</SelectItem>
            <SelectItem value="sales">Ventas</SelectItem>
          </SelectContent>
        </Select>
        <DatePickerWithRange className="w-[280px]" />
      </div>
    </div>
  );
}