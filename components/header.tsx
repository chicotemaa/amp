"use client";

import { 
  Building2, 
  BarChart3, 
  Users, 
  Menu as MenuIcon,
  LayoutDashboard,
  UserCircle,
  LogOut,
  Calendar,
  DollarSign,
  ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
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
import type { AppRole } from "@/lib/auth/roles";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const supabase = useMemo(() => getSupabaseAuthBrowserClient(), []);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);
      if (currentUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .single();
        setRole((profile?.role as AppRole | undefined) ?? null);
      } else {
        setRole(null);
      }
    };

    void loadUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setRole(null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  if (pathname === "/login") {
    return null;
  }

  const menuItems = [
    {
      href: "/",
      label: "Dashboard",
      icon: LayoutDashboard
    },
    {
      href: "/projects",
      label: "Proyectos",
      icon: Building2
    },
    {
      href: "/reports",
      label: "Informes",
      icon: BarChart3
    },
    {
      href: "/clients",
      label: "Clientes",
      icon: Users
    },
    {
      href: "/employees",
      label: "Empleados",
      icon: UserCircle
    },
    {
      href: "/calendar",
      label: "Calendario",
      icon: Calendar
    },
    {
      href: "/operations",
      label: "Operaciones",
      icon: ClipboardList
    },
    {
      href: "/cashflow",
      label: "Cashflow",
      icon: DollarSign
    }
  ];

  const visibleMenuItems = menuItems.filter((item) => {
    if (role === "client") return false;
    if (role === "pm" && item.href === "/cashflow") return false;
    if (role === "inspector" && ["/cashflow", "/clients", "/employees", "/reports"].includes(item.href)) {
      return false;
    }
    return true;
  });

  const Logo = () => (
    <Link href="/" className="flex items-center space-x-2">
      <Building2 className="h-6 w-6 text-primary" />
      <div className="flex flex-col">
        <span className="font-montserrat font-bold text-xl">AMP</span>
        <span className="text-xs text-muted-foreground">ArquiManagerPro</span>
      </div>
    </Link>
  );

  const NavLinks = ({ className, onItemClick }: { className?: string, onItemClick?: () => void }) => (
    <nav className={className}>
      {visibleMenuItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center space-x-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
              pathname === item.href 
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center space-x-4">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="mr-2">
                <MenuIcon className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-1">
                <NavLinks
                  className="flex flex-col space-y-1"
                  onItemClick={() => {
                    const button = document.querySelector('button[type="button"]') as HTMLButtonElement | null;
                    button?.click();
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Logo */}
          <div className="hidden lg:block">
            <Logo />
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:ml-6 lg:flex lg:items-center lg:space-x-4">
          <NavLinks className="flex items-center space-x-4" />
        </div>

        {/* Right Side Actions */}
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          
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
