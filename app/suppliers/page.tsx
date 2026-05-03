import { Metadata } from "next";
import { SuppliersWorkspace } from "@/components/suppliers/suppliers-workspace";
import { assertPermission } from "@/lib/auth/server-guards";
import { getCurrentRoleServer, getEffectiveUiRoleServer } from "@/lib/supabase/auth-server";
import { getRoleLabel } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "Proveedores | ArquiManagerPro",
  description: "Directorio de proveedores, compras pendientes y cuentas por pagar",
};

export default async function SuppliersPage() {
  await assertPermission("suppliers.view");
  const [role, uiRole] = await Promise.all([
    getCurrentRoleServer(),
    getEffectiveUiRoleServer(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-montserrat text-3xl font-bold tracking-tight mb-2">
          Proveedores
        </h1>
        <p className="text-muted-foreground">
          Control centralizado de proveedores, órdenes, saldos pendientes y vencimientos.
          {uiRole && uiRole !== role ? ` · Vista simulada: ${getRoleLabel(uiRole)}` : ""}
        </p>
      </div>

      <SuppliersWorkspace role={uiRole} />
    </div>
  );
}
