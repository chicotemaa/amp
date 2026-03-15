import { redirect } from "next/navigation";
import { can, getDefaultRouteForRole, type AppRole, type Permission } from "@/lib/auth/roles";
import { getCurrentRoleServer, getSupabaseServerClient } from "@/lib/supabase/auth-server";

type CurrentProfile = {
  id: string;
  role: AppRole;
  employee_id: number | null;
  client_id: number | null;
  is_active: boolean;
};

type ProjectAccessContext = {
  role: AppRole;
  profileId: string;
  employeeId: number | null;
  clientId: number | null;
};

export async function getCurrentProfileServer(): Promise<CurrentProfile | null> {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data } = await supabase
      .from("profiles")
      .select("id, role, employee_id, client_id, is_active")
      .eq("id", user.id)
      .single();

    if (!data?.is_active) return null;

    return data as CurrentProfile;
  } catch {
    return null;
  }
}

async function getProjectAccessContext(): Promise<ProjectAccessContext | null> {
  const profile = await getCurrentProfileServer();
  if (!profile) return null;

  return {
    role: profile.role,
    profileId: profile.id,
    employeeId: profile.employee_id,
    clientId: profile.client_id,
  };
}

export async function getAccessibleProjectIdsServer(): Promise<number[] | null> {
  const context = await getProjectAccessContext();
  if (!context) return [];

  if (context.role === "operator") {
    return null;
  }

  const supabase = getSupabaseServerClient();

  if (context.role === "client") {
    if (!context.clientId) return [];
    const { data } = await supabase
      .from("client_projects")
      .select("project_id")
      .eq("client_id", context.clientId);

    return Array.from(new Set((data ?? []).map((row) => row.project_id)));
  }

  const membershipQuery = await supabase
    .from("project_members")
    .select("project_id")
    .eq("profile_id", context.profileId);

  const membershipIds = ((membershipQuery.data ?? []) as Array<{ project_id: number }>).map(
    (row) => row.project_id
  );

  if (membershipIds.length > 0) {
    return Array.from(new Set(membershipIds));
  }

  if (!context.employeeId) return [];

  const { data } = await supabase
    .from("employee_projects")
    .select("project_id")
    .eq("employee_id", context.employeeId);

  return Array.from(new Set((data ?? []).map((row) => row.project_id)));
}

export async function canAccessProjectServer(projectId: number): Promise<boolean> {
  const role = await getCurrentRoleServer();
  if (!role) return false;
  if (role === "operator") return true;

  const projectIds = await getAccessibleProjectIdsServer();
  if (projectIds === null) return true;
  return projectIds.includes(projectId);
}

export async function assertProjectAccess(projectId: number) {
  const role = await getCurrentRoleServer();
  const allowed = await canAccessProjectServer(projectId);

  if (allowed) return;

  redirect(getDefaultRouteForRole(role));
}

export async function assertPermission(permission: Permission) {
  const role = await getCurrentRoleServer();

  if (can(role, permission)) return;

  redirect(getDefaultRouteForRole(role));
}

export async function getAccessibleProjectsServer<T extends string>(select: T) {
  const role = await getCurrentRoleServer();
  if (!role) return { data: [], error: null as string | null };

  const supabase = getSupabaseServerClient();
  const accessibleIds = await getAccessibleProjectIdsServer();

  let query = supabase.from("projects").select(select).order("id", { ascending: true });

  if (accessibleIds !== null) {
    if (accessibleIds.length === 0) {
      return { data: [], error: null as string | null };
    }
    query = query.in("id", accessibleIds);
  }

  const { data, error } = await query;
  return {
    data: data ?? [],
    error: error ? "No se pudieron cargar los proyectos permitidos." : null,
  };
}
