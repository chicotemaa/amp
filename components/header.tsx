"use client";

import { 
  Building2, 
  ChevronRight,
  LayoutDashboard,
  MoreHorizontal,
  Menu as MenuIcon,
  UserCircle,
  LogOut,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseAuthBrowserClient } from "@/lib/supabase/auth-browser";
import type { User } from "@supabase/supabase-js";
import {
  canUseViewAsRole,
  getEffectiveUiRole,
  getRoleDescription,
  getRoleLabel,
  sanitizeViewAsRole,
  type AppRole,
} from "@/lib/auth/roles";
import { endImpersonationAudit, startImpersonationAudit } from "@/lib/api/impersonation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getNavigationHomeHref,
  getNavigationSections,
  getPrimaryNavigation,
  getSecondaryNavigation,
  isNavigationItemActive,
  type NavigationItem,
} from "@/lib/navigation/menu";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [viewAsRole, setViewAsRole] = useState<AppRole | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const supabase = useMemo(() => getSupabaseAuthBrowserClient(), []);
  const effectiveUiRole = getEffectiveUiRole(role, viewAsRole);

  useEffect(() => {
    const loadProfileState = async (currentUser: User | null) => {
      setUser(currentUser);

      if (currentUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .single();
        const realRole = (profile?.role as AppRole | undefined) ?? null;
        setRole(realRole);

        const cookieValue = document.cookie
          .split("; ")
          .find((entry) => entry.startsWith("amp_view_as_role="))
          ?.split("=")[1] ?? null;
        setViewAsRole(sanitizeViewAsRole(realRole, cookieValue));
      } else {
        setRole(null);
        setViewAsRole(null);
      }
    };

    const loadUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      await loadProfileState(currentUser);
    };

    void loadUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadProfileState(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    document.cookie = "amp_view_as_role=; path=/; max-age=0";
    router.replace("/login");
    router.refresh();
  };

  const handleViewAsRole = async (nextRole: string) => {
    if (nextRole === "real") {
      await endImpersonationAudit();
      document.cookie = "amp_view_as_role=; path=/; max-age=0";
      setViewAsRole(null);
      router.refresh();
      return;
    }

    const sanitized = sanitizeViewAsRole(role, nextRole);
    if (!sanitized) return;
    await endImpersonationAudit();
    await startImpersonationAudit(sanitized);
    document.cookie = `amp_view_as_role=${sanitized}; path=/; max-age=86400; samesite=lax`;
    setViewAsRole(sanitized);
    router.refresh();
  };

  if (pathname === "/login") {
    return null;
  }

  const navigationHomeHref = getNavigationHomeHref(effectiveUiRole);
  const navigationSections = getNavigationSections(effectiveUiRole);
  const primaryMenuItems = getPrimaryNavigation(effectiveUiRole);
  const secondaryMenuItems = getSecondaryNavigation(effectiveUiRole);
  const secondarySections = navigationSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        secondaryMenuItems.some((secondaryItem) => secondaryItem.href === item.href)
      ),
    }))
    .filter((section) => section.items.length > 0);
  const hasSecondaryActiveItem = secondaryMenuItems.some((item) =>
    isNavigationItemActive(item, pathname)
  );

  const Logo = () => (
    <Link href={navigationHomeHref} className="flex items-center space-x-2">
      <Building2 className="h-6 w-6 text-primary" />
      <div className="flex flex-col">
        <span className="font-montserrat font-bold text-xl">AMP</span>
        <span className="text-xs text-muted-foreground">ArquiManagerPro</span>
      </div>
    </Link>
  );

  const DesktopNavLink = ({ item }: { item: NavigationItem }) => {
    const Icon = item.icon;
    const isActive = isNavigationItemActive(item, pathname);

    return (
      <Link
        href={item.href}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{item.label}</span>
      </Link>
    );
  };

  const MobileNavLink = ({ item }: { item: NavigationItem }) => {
    const Icon = item.icon;
    const isActive = isNavigationItemActive(item, pathname);

    return (
      <Link
        href={item.href}
        onClick={() => setMobileNavOpen(false)}
        className={cn(
          "flex items-start justify-between gap-3 rounded-xl border px-3 py-3 transition-colors",
          isActive
            ? "border-primary/30 bg-accent"
            : "border-border hover:bg-accent/70"
        )}
      >
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </div>
        </div>
        {isActive ? <ChevronRight className="mt-0.5 h-4 w-4 text-primary" /> : null}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-3">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild className="xl:hidden">
              <Button variant="ghost" size="icon" className="mr-2">
                <MenuIcon className="h-6 w-6" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>
                  <Logo />
                </SheetTitle>
                <SheetDescription>
                  {effectiveUiRole
                    ? `${getRoleLabel(effectiveUiRole)} · ${getRoleDescription(effectiveUiRole)}`
                    : "Navegacion principal del sistema"}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 flex h-full flex-col gap-6 overflow-y-auto pb-8">
                {navigationSections.map((section) => (
                  <div key={section.id} className="space-y-2">
                    <p className="px-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      {section.label}
                    </p>
                    <div className="space-y-2">
                      {section.items.map((item) => (
                        <MobileNavLink key={item.href} item={item} />
                      ))}
                    </div>
                  </div>
                ))}

                {canUseViewAsRole(role) ? (
                  <div className="space-y-2 rounded-xl border p-3">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Vista simulada
                    </p>
                    <Select
                      value={viewAsRole && viewAsRole !== role ? viewAsRole : "real"}
                      onValueChange={handleViewAsRole}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Ver como rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="real">Vista real: {getRoleLabel(role)}</SelectItem>
                        <SelectItem value="pm">Ver como Jefe de Proyecto</SelectItem>
                        <SelectItem value="inspector">Ver como Inspector</SelectItem>
                        <SelectItem value="client">Ver como Cliente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </div>
            </SheetContent>
          </Sheet>

          <Logo />
        </div>

        <div className="hidden xl:ml-8 xl:flex xl:items-center xl:gap-1">
          {primaryMenuItems.map((item) => (
            <DesktopNavLink key={item.href} item={item} />
          ))}

          {secondarySections.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "gap-2 rounded-full px-3 text-sm",
                    hasSecondaryActiveItem && "bg-accent text-accent-foreground"
                  )}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span>Mas</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                {secondarySections.map((section, sectionIndex) => (
                  <div key={section.id}>
                    {sectionIndex > 0 ? <DropdownMenuSeparator /> : null}
                    <DropdownMenuLabel>{section.label}</DropdownMenuLabel>
                    {section.items.map((item) => {
                      const Icon = item.icon;

                      return (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link href={item.href} className="flex items-start gap-3">
                            <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium">{item.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.description}
                              </p>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-3">
          {effectiveUiRole ? (
            <div className="hidden lg:flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground">
              {viewAsRole && viewAsRole !== role
                ? `Vista ${getRoleLabel(viewAsRole)}`
                : getRoleLabel(effectiveUiRole)}
            </div>
          ) : null}
          <ThemeToggle />
          {canUseViewAsRole(role) ? (
            <div className="hidden xl:block min-w-[220px]">
              <Select
                value={viewAsRole && viewAsRole !== role ? viewAsRole : "real"}
                onValueChange={handleViewAsRole}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Ver como rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="real">Vista real: {getRoleLabel(role)}</SelectItem>
                  <SelectItem value="pm">Ver como Jefe de Proyecto</SelectItem>
                  <SelectItem value="inspector">Ver como Inspector</SelectItem>
                  <SelectItem value="client">Ver como Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/01.png" alt="Usuario" />
                  <AvatarFallback>
                    {(user?.email ?? "AMP").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <UserCircle className="mr-2 h-4 w-4" />
                <span>{user?.email ?? "Mi Perfil"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>{getRoleLabel(role)}</span>
              </DropdownMenuItem>
              {viewAsRole && viewAsRole !== role ? (
                <DropdownMenuItem>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Vista simulada: {getRoleLabel(viewAsRole)}</span>
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
