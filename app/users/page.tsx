import { Metadata } from "next";
import { redirect } from "next/navigation";
import { UsersManagement } from "@/components/users/users-management";
import { getCurrentRoleServer } from "@/lib/supabase/auth-server";
import { can } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "Usuarios | ArquiManagerPro",
  description: "Administración de usuarios web y roles",
};

export default async function UsersPage() {
  const role = await getCurrentRoleServer();

  if (!role) {
    redirect("/login");
  }

  if (!can(role, "users.view")) {
    redirect("/");
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-montserrat text-3xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-muted-foreground mt-2">
          Visualiza los usuarios de la web y administra sus roles de acceso.
        </p>
      </div>
      <UsersManagement />
    </div>
  );
}
