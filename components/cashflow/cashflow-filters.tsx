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
import { DatePickerWithRange } from "@/components/ui/date-range-picker";

export function CashflowFilters() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="relative flex-1 md:max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar transacciones..." className="pl-8" />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Proyecto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Proyectos</SelectItem>
            <SelectItem value="1">Torre Residencial Marina</SelectItem>
            <SelectItem value="2">Centro Comercial Plaza Norte</SelectItem>
            <SelectItem value="3">Complejo Deportivo Olímpico</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
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