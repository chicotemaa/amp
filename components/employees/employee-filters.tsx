"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function EmployeeFilters() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="relative flex-1 md:max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar empleados..." className="pl-8" />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="on-project">En Proyecto</SelectItem>
            <SelectItem value="available">Disponibles</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="department">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="department">Departamento</SelectItem>
            <SelectItem value="name">Nombre</SelectItem>
            <SelectItem value="projects">Nº de Proyectos</SelectItem>
            <SelectItem value="performance">Rendimiento</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}