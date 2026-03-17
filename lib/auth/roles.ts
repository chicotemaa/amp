export type AppRole = "operator" | "pm" | "inspector" | "client";

export type Permission =
  | "dashboard.view_internal"
  | "dashboard.view_operational"
  | "dashboard.view_financial"
  | "projects.view"
  | "projects.create"
  | "projects.edit"
  | "projects.assign_team"
  | "clients.view"
  | "clients.edit"
  | "employees.view"
  | "employees.assign"
  | "planning.view"
  | "planning.edit"
  | "operations.view"
  | "operations.plan"
  | "operations.execute"
  | "progress.create"
  | "progress.validate"
  | "incidents.view"
  | "incidents.create"
  | "incidents.resolve"
  | "documents.view"
  | "documents.upload"
  | "budget.view"
  | "budget.edit"
  | "budget.approve"
  | "change_orders.view"
  | "change_orders.create"
  | "change_orders.review"
  | "reports.view"
  | "reports.generate"
  | "calendar.view"
  | "cashflow.view"
  | "stock.view"
  | "stock.move"
  | "users.view"
  | "users.manage"
  | "roles.assign"
  | "client_portal.view_own"
  | "client_portal.approve_change_order"
  | "client_portal.view_payments"
  | "client_publication.manage"
  | "impersonation.use";

export type RoleConfig = {
  label: string;
  description: string;
  permissions: Permission[];
};

export type MenuItem = {
  href: string;
  label: string;
  permission: Permission;
};

export type ProjectTabId =
  | "overview"
  | "timeline"
  | "team"
  | "documents"
  | "budget"
  | "change-orders"
  | "progress";

export type OperationsTabId = "execution" | "incidents" | "control" | "planning";

export const ROLE_CONFIG: Record<AppRole, RoleConfig> = {
  operator: {
    label: "Director",
    description: "Administrador general con control total del sistema.",
    permissions: [
      "dashboard.view_internal",
      "dashboard.view_operational",
      "dashboard.view_financial",
      "projects.view",
      "projects.create",
      "projects.edit",
      "projects.assign_team",
      "clients.view",
      "clients.edit",
      "employees.view",
      "employees.assign",
      "planning.view",
      "planning.edit",
      "operations.view",
      "operations.plan",
      "operations.execute",
      "progress.create",
      "progress.validate",
      "incidents.view",
      "incidents.create",
      "incidents.resolve",
      "documents.view",
      "documents.upload",
      "budget.view",
      "budget.edit",
      "budget.approve",
      "change_orders.view",
      "change_orders.create",
      "change_orders.review",
      "reports.view",
      "reports.generate",
      "calendar.view",
      "cashflow.view",
      "stock.view",
      "stock.move",
      "users.view",
      "users.manage",
      "roles.assign",
      "client_portal.view_own",
      "client_portal.approve_change_order",
      "client_portal.view_payments",
      "client_publication.manage",
      "impersonation.use",
    ],
  },
  pm: {
    label: "Jefe de Proyecto",
    description: "Responsable integral del proyecto y su ejecución.",
    permissions: [
      "dashboard.view_internal",
      "dashboard.view_operational",
      "projects.view",
      "projects.create",
      "projects.edit",
      "projects.assign_team",
      "clients.view",
      "clients.edit",
      "employees.view",
      "employees.assign",
      "planning.view",
      "planning.edit",
      "operations.view",
      "operations.plan",
      "operations.execute",
      "progress.create",
      "progress.validate",
      "incidents.view",
      "incidents.create",
      "incidents.resolve",
      "documents.view",
      "documents.upload",
      "budget.view",
      "budget.edit",
      "change_orders.view",
      "change_orders.create",
      "reports.view",
      "reports.generate",
      "calendar.view",
      "stock.view",
      "stock.move",
    ],
  },
  inspector: {
    label: "Inspector de Obra",
    description: "Responsable de campo, avances e incidencias.",
    permissions: [
      "dashboard.view_operational",
      "projects.view",
      "calendar.view",
      "planning.view",
      "operations.view",
      "operations.execute",
      "progress.create",
      "incidents.view",
      "incidents.create",
      "incidents.resolve",
      "documents.view",
      "documents.upload",
      "stock.view",
      "stock.move",
    ],
  },
  client: {
    label: "Cliente",
    description: "Visualización curada y aprobaciones externas.",
    permissions: [
      "client_portal.view_own",
      "client_portal.approve_change_order",
      "client_portal.view_payments",
    ],
  },
};

export const INTERNAL_MENU_ITEMS: MenuItem[] = [
  { href: "/", label: "Dashboard", permission: "dashboard.view_internal" },
  { href: "/projects", label: "Proyectos", permission: "projects.view" },
  { href: "/operations", label: "Operaciones", permission: "operations.view" },
  { href: "/calendar", label: "Calendario", permission: "calendar.view" },
  { href: "/clients", label: "Clientes", permission: "clients.view" },
  { href: "/employees", label: "Personal", permission: "employees.view" },
  { href: "/reports", label: "Reportes", permission: "reports.view" },
  { href: "/cashflow", label: "Cashflow", permission: "cashflow.view" },
  { href: "/users", label: "Usuarios", permission: "users.view" },
];

export function getRoleLabel(role: AppRole | null) {
  return role ? ROLE_CONFIG[role].label : "Sin rol";
}

export function getRoleDescription(role: AppRole | null) {
  return role ? ROLE_CONFIG[role].description : "Perfil sin configuración.";
}

export function can(role: AppRole | null, permission: Permission) {
  if (!role) return false;
  return ROLE_CONFIG[role].permissions.includes(permission);
}

export function getVisibleMenu(role: AppRole | null) {
  return INTERNAL_MENU_ITEMS.filter((item) => can(role, item.permission));
}

export function canAccessBudget(role: AppRole | null) {
  return can(role, "budget.view");
}

export function canAccessFinancials(role: AppRole | null) {
  return can(role, "cashflow.view");
}

export function isFieldRole(role: AppRole | null) {
  return role === "inspector";
}

export function isClientRole(role: AppRole | null) {
  return role === "client";
}

export function canUseViewAsRole(role: AppRole | null) {
  return can(role, "impersonation.use");
}

export function sanitizeViewAsRole(realRole: AppRole | null, requestedRole: string | null): AppRole | null {
  if (!realRole || !requestedRole) return null;
  if (!canUseViewAsRole(realRole)) return null;
  if (!["operator", "pm", "inspector", "client"].includes(requestedRole)) return null;
  if (requestedRole === "operator") return "operator";
  return requestedRole as AppRole;
}

export function getEffectiveUiRole(realRole: AppRole | null, viewAsRole: AppRole | null) {
  if (!realRole) return null;
  if (!canUseViewAsRole(realRole)) return realRole;
  return viewAsRole ?? realRole;
}

export function getDefaultRouteForRole(role: AppRole | null) {
  if (role === "client") return "/client-portal";
  if (role === "inspector") return "/operations";
  return "/";
}

export function canAccessRoute(role: AppRole | null, pathname: string) {
  if (!role) return false;

  const isPath = (prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

  if (isPath("/login")) return true;
  if (isPath("/client-portal")) return can(role, "client_portal.view_own");

  if (role === "client") return false;
  if (pathname === "/") return can(role, "dashboard.view_internal") || can(role, "dashboard.view_operational");
  if (isPath("/projects")) return can(role, "projects.view");
  if (isPath("/operations")) return can(role, "operations.view");
  if (isPath("/calendar")) return can(role, "calendar.view");
  if (isPath("/clients")) return can(role, "clients.view");
  if (isPath("/employees")) return can(role, "employees.view");
  if (isPath("/reports")) return can(role, "reports.view");
  if (isPath("/cashflow")) return can(role, "cashflow.view");
  if (isPath("/users")) return can(role, "users.view");

  return true;
}

export function getVisibleOperationsTabs(role: AppRole | null): OperationsTabId[] {
  const tabs: OperationsTabId[] = [];
  if (can(role, "operations.execute")) tabs.push("execution");
  if (can(role, "incidents.view")) tabs.push("incidents");
  if (can(role, "progress.validate") || can(role, "dashboard.view_operational")) tabs.push("control");
  if (can(role, "operations.plan")) tabs.push("planning");
  return tabs;
}

export function getVisibleProjectTabs(role: AppRole | null): ProjectTabId[] {
  const tabs: ProjectTabId[] = ["overview", "timeline"];

  if (can(role, "employees.view")) tabs.push("team");
  if (can(role, "documents.view")) tabs.push("documents");
  if (can(role, "budget.view")) tabs.push("budget");
  if (can(role, "change_orders.view")) tabs.push("change-orders");
  if (can(role, "operations.execute") || can(role, "progress.validate") || can(role, "progress.create")) {
    tabs.push("progress");
  }

  return tabs;
}
