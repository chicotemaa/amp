"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ClientNotificationPreferences() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferencias de Notificación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications" className="flex flex-col gap-1">
              <span>Notificaciones por Email</span>
              <span className="text-sm text-muted-foreground">
                Recibir actualizaciones por correo electrónico
              </span>
            </Label>
            <Switch id="email-notifications" />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="sms-notifications" className="flex flex-col gap-1">
              <span>Notificaciones SMS</span>
              <span className="text-sm text-muted-foreground">
                Recibir actualizaciones por mensaje de texto
              </span>
            </Label>
            <Switch id="sms-notifications" />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="push-notifications" className="flex flex-col gap-1">
              <span>Notificaciones Push</span>
              <span className="text-sm text-muted-foreground">
                Recibir notificaciones en la aplicación
              </span>
            </Label>
            <Switch id="push-notifications" />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Frecuencia de Resúmenes</h3>
          <Select defaultValue="weekly">
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar frecuencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diario</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="biweekly">Quincenal</SelectItem>
              <SelectItem value="monthly">Mensual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}