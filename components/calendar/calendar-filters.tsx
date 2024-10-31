"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CalendarFilters() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Select defaultValue="all">
        <SelectTrigger className="w-[200px]">
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
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Tipo de Evento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los Eventos</SelectItem>
          <SelectItem value="start">Inicios de Obra</SelectItem>
          <SelectItem value="review">Revisiones</SelectItem>
          <SelectItem value="milestone">Hitos</SelectItem>
          <SelectItem value="end">Finalizaciones</SelectItem>
        </SelectContent>
      </Select>

      <Select defaultValue="all">
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los Estados</SelectItem>
          <SelectItem value="pending">Pendientes</SelectItem>
          <SelectItem value="in-progress">En Progreso</SelectItem>
          <SelectItem value="completed">Completados</SelectItem>
          <SelectItem value="delayed">Retrasados</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}