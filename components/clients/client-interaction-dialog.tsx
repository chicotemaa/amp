"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function ClientInteractionDialog() {
  const [date, setDate] = useState<Date | undefined>();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Registrar Interacción</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nueva Interacción</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Interacción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="call">Llamada</SelectItem>
                <SelectItem value="meeting">Reunión</SelectItem>
                <SelectItem value="document">Documento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(day) => setDate(day ?? undefined)} // Aseguramos que el valor pueda ser 'undefined'
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Input placeholder="Asunto" />
          </div>

          <div className="grid gap-2">
            <Textarea placeholder="Detalles de la interacción" />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline">Cancelar</Button>
            <Button>Guardar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
