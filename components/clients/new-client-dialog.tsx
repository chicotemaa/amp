"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { CreateClientInput, createClient } from "@/lib/api/clients";
import { toast } from "sonner"; // Assuming sonner is available or alert fallback

export function NewClientDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<CreateClientInput>({
    name: "",
    company: "",
    email: "",
    phone: "",
    status: "Activo",
    notificationPrefs: [],
    avatar: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createClient(form);
      setOpen(false);
      window.dispatchEvent(new Event("clientCreated"));
      toast.success("Cliente creado exitosamente");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error al crear el cliente");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleNotificationPref = (pref: "email" | "sms" | "push", checked: boolean) => {
    setForm((prev) => {
      const prefs = prev.notificationPrefs.filter((p) => p !== pref);
      if (checked) prefs.push(pref);
      return { ...prev, notificationPrefs: prefs };
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Nuevo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuevo Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo *</Label>
              <Input
                id="name"
                required
                placeholder="Juan Pérez"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa *</Label>
              <Input
                id="company"
                required
                placeholder="Empresa S.A."
                value={form.company}
                onChange={e => setForm({ ...form, company: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="juan@empresa.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                placeholder="+34 600 000 000"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Preferencias de Notificación</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email-notifications"
                  checked={form.notificationPrefs.includes("email")}
                  onCheckedChange={(c) => toggleNotificationPref("email", !!c)}
                />
                <Label htmlFor="email-notifications">Email</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sms-notifications"
                  checked={form.notificationPrefs.includes("sms")}
                  onCheckedChange={(c) => toggleNotificationPref("sms", !!c)}
                />
                <Label htmlFor="sms-notifications">SMS</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="push-notifications"
                  checked={form.notificationPrefs.includes("push")}
                  onCheckedChange={(c) => toggleNotificationPref("push", !!c)}
                />
                <Label htmlFor="push-notifications">Push</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar Cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}