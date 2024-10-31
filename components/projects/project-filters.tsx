"use client";

import { useFilters } from "@/contexts/filter-context";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusOptions = [
  { value: "all", label: "Todos los estados" },
  { value: "active", label: "Activo" },
  { value: "completed", label: "Completado" },
  { value: "on-hold", label: "En espera" },
];

type FilterState = {
  status: string[];
  type: string[];
  date: string[];
  searchTerm: string;
  sortBy: string;
};


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
      searchTerm: "", // Añadir un valor por defecto para searchTerm
      sortBy: "",     // Añadir un valor por defecto para sortBy
    });
  };
  

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <Select onValueChange={handleStatusChange}>
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

        <Select onValueChange={handleTypeChange}>
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

        <Select onValueChange={handleDateChange}>
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
      </div>

      <Button
        variant="outline"
        onClick={clearFilters}
        className="w-full sm:w-auto"
      >
        Limpiar filtros
      </Button>
    </div>
  );
}