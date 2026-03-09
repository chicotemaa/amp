"use client";

import { useFilters } from "@/contexts/filter-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusOptions = [
  { value: "all", label: "Todos los estados" },
  { value: "in-progress", label: "En Progreso" },
  { value: "planning", label: "En Planificación" },
  { value: "completed", label: "Completado" },
  { value: "on-hold", label: "En Pausa" },
];

const typeOptions = [
  { value: "all", label: "Todos los tipos" },
  { value: "residential", label: "Residencial" },
  { value: "commercial", label: "Comercial" },
  { value: "industrial", label: "Industrial" },
];

const dateOptions = [
  { value: "all", label: "Todas las fechas" },
  { value: "last-7", label: "Últimos 7 días" },
  { value: "last-30", label: "Últimos 30 días" },
  { value: "last-90", label: "Últimos 90 días" },
];

const sortOptions = [
  { value: "newest", label: "Más recientes" },
  { value: "oldest", label: "Más antiguos" },
  { value: "budget-desc", label: "Mayor presupuesto" },
  { value: "budget-asc", label: "Menor presupuesto" },
  { value: "progress-desc", label: "Mayor avance" },
  { value: "progress-asc", label: "Menor avance" },
  { value: "name-asc", label: "Nombre (A-Z)" },
  { value: "name-desc", label: "Nombre (Z-A)" },
];

export function ProjectFilters() {
  const { filters, setFilters } = useFilters();

  const handleStatusChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      status: value === "all" ? [] : [value], // Mantener como arreglo
    }));
  };


  const handleTypeChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      type: value === "all" ? [] : [value],
    }));
  };

  const handleDateChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      date: value === "all" ? [] : [value],
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      type: [],
      date: [],
      searchTerm: "",
      sortBy: "newest",
    });
  };

  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="w-full">
        <Input
          value={filters.searchTerm}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              searchTerm: event.target.value,
            }))
          }
          placeholder="Buscar por nombre o ubicación..."
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <Select
          value={filters.status[0] ?? "all"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.type[0] ?? "all"} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.date[0] ?? "all"} onValueChange={handleDateChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Fecha" />
          </SelectTrigger>
          <SelectContent>
            {dateOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sortBy || "newest"}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              sortBy: value,
            }))
          }
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full sm:w-auto"
        >
          Limpiar filtros
        </Button>
      </div>
    </div>
  );
}
