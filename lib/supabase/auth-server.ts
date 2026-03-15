import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/supabase";
import { getEffectiveUiRole, sanitizeViewAsRole, type AppRole } from "@/lib/auth/roles";

export function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables! Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
    );
  }

  const cookieStore = cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {
        // No-op in Server Components
      },
      remove() {
        // No-op in Server Components
      },
    },
  });
}

export async function getCurrentRoleServer(): Promise<AppRole | null> {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    return (data?.role as AppRole | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function getEffectiveUiRoleServer(): Promise<AppRole | null> {
  const realRole = await getCurrentRoleServer();
  if (!realRole) return null;

  const cookieStore = cookies();
  const requestedRole = cookieStore.get("amp_view_as_role")?.value ?? null;
  const viewAsRole = sanitizeViewAsRole(realRole, requestedRole);
  return getEffectiveUiRole(realRole, viewAsRole);
}
