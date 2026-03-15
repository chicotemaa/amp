import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  Calendar,
  ClipboardList,
  DollarSign,
  LayoutDashboard,
  ShieldCheck,
  UserCircle,
  Users,
} from "lucide-react";
import { can, type AppRole } from "@/lib/auth/roles";

export type NavigationSectionId =
  | "overview"
  | "delivery"
  | "planning"
  | "finance"
  | "administration"
  | "portal";

export type NavigationItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  section: NavigationSectionId;
  activeMatch?: "exact" | "prefix";
  visibleWhen: (role: AppRole | null) => boolean;
};

export type NavigationSection = {
  id: NavigationSectionId;
  label: string;
  items: NavigationItem[];
};

const SECTION_ORDER: Array<{ id: NavigationSectionId; label: string }> = [
  { id: "overview", label: "Panorama" },
  { id: "delivery", label: "Seguimiento de obra" },
  { id: "planning", label: "Gestión" },
  { id: "finance", label: "Finanzas" },
  { id: "administration", label: "Administración" },
  { id: "portal", label: "Portal" },
];

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    href: "/",
    label: "Dashboard",
    description: "Vista general del estudio y sus indicadores.",
    icon: LayoutDashboard,
    section: "overview",
    activeMatch: "exact",
    visibleWhen: (role) =>
      can(role, "dashboard.view_internal") || can(role, "dashboard.view_operational"),
  },
  {
    href: "/projects",
    label: "Obras",
    description: "Proyectos, presupuesto, avance y documentación.",
    icon: Building2,
    section: "delivery",
    activeMatch: "prefix",
    visibleWhen: (role) => can(role, "projects.view"),
  },
  {
    href: "/operations",
    label: "Ejecución",
    description: "Campo, hitos, incidencias y control operativo.",
    icon: ClipboardList,
    section: "delivery",
    activeMatch: "prefix",
    visibleWhen: (role) => can(role, "operations.view"),
  },
  {
    href: "/calendar",
    label: "Agenda",
    description: "Eventos, vencimientos y planificación temporal.",
    icon: Calendar,
    section: "planning",
    activeMatch: "prefix",
    visibleWhen: (role) => can(role, "calendar.view"),
  },
  {
    href: "/clients",
    label: "Clientes",
    description: "Base de clientes y relaciones comerciales.",
    icon: Users,
    section: "planning",
    activeMatch: "prefix",
    visibleWhen: (role) => can(role, "clients.view"),
  },
  {
    href: "/employees",
    label: "Equipo",
    description: "Personal, asignaciones y disponibilidad.",
    icon: UserCircle,
    section: "planning",
    activeMatch: "prefix",
    visibleWhen: (role) => can(role, "employees.view"),
  },
  {
    href: "/reports",
    label: "Control",
    description: "Plazo, costo, riesgos y consolidado multiobra.",
    icon: BarChart3,
    section: "overview",
    activeMatch: "prefix",
    visibleWhen: (role) => can(role, "reports.view"),
  },
  {
    href: "/cashflow",
    label: "Finanzas",
    description: "Caja, ingresos, egresos y movimientos reales.",
    icon: DollarSign,
    section: "finance",
    activeMatch: "prefix",
    visibleWhen: (role) => can(role, "cashflow.view"),
  },
  {
    href: "/users",
    label: "Accesos",
    description: "Usuarios, perfiles y permisos del sistema.",
    icon: ShieldCheck,
    section: "administration",
    activeMatch: "prefix",
    visibleWhen: (role) => can(role, "users.view"),
  },
  {
    href: "/client-portal",
    label: "Portal",
    description: "Vista curada de avance, hitos, certificados y cambios.",
    icon: LayoutDashboard,
    section: "portal",
    activeMatch: "prefix",
    visibleWhen: (role) => can(role, "client_portal.view_own"),
  },
];

const PRIMARY_BY_ROLE: Record<AppRole, string[]> = {
  operator: ["/", "/projects", "/operations", "/reports", "/cashflow"],
  pm: ["/", "/projects", "/operations", "/reports"],
  inspector: ["/operations", "/projects"],
  client: ["/client-portal"],
};

export function getNavigationHomeHref(role: AppRole | null) {
  if (role === "client") return "/client-portal";
  if (role === "inspector") return "/operations";
  return "/";
}

export function isNavigationItemActive(item: NavigationItem, pathname: string) {
  if (item.activeMatch === "exact" || item.href === "/") {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function getVisibleNavigationItems(role: AppRole | null) {
  return NAVIGATION_ITEMS.filter((item) => item.visibleWhen(role));
}

export function getPrimaryNavigation(role: AppRole | null) {
  const primaryHrefs = role ? PRIMARY_BY_ROLE[role] : [];
  const itemsByHref = new Map(getVisibleNavigationItems(role).map((item) => [item.href, item]));

  return primaryHrefs
    .map((href) => itemsByHref.get(href) ?? null)
    .filter((item): item is NavigationItem => item !== null);
}

export function getSecondaryNavigation(role: AppRole | null) {
  const primaryHrefs = new Set(getPrimaryNavigation(role).map((item) => item.href));
  return getVisibleNavigationItems(role).filter((item) => !primaryHrefs.has(item.href));
}

export function getNavigationSections(role: AppRole | null): NavigationSection[] {
  const visibleItems = getVisibleNavigationItems(role);

  return SECTION_ORDER.map((section) => ({
    id: section.id,
    label: section.label,
    items: visibleItems.filter((item) => item.section === section.id),
  })).filter((section) => section.items.length > 0);
}

