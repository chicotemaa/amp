import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import type { AppRole } from "@/lib/auth/roles";
import { getSupabaseAuthBrowserClient } from "@/lib/supabase/auth-browser";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProjectMemberRow = Database["public"]["Tables"]["project_members"]["Row"];

export type UserProfile = {
  id: string;
  role: AppRole;
  fullName: string | null;
  employeeId: number | null;
  clientId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assignedProjectIds: number[];
};

function mapProfile(row: ProfileRow, assignedProjectIds: number[]): UserProfile {
  return {
    id: row.id,
    role: row.role as AppRole,
    fullName: row.full_name,
    employeeId: row.employee_id,
    clientId: row.client_id,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    assignedProjectIds,
  };
}

function normalizeProfilePayload(input: {
  role: AppRole;
  fullName?: string | null;
  employeeId?: number | null;
  clientId?: number | null;
  isActive?: boolean;
}) {
  const payload: Database["public"]["Tables"]["profiles"]["Update"] = {
    role: input.role,
    full_name: input.fullName ?? null,
    is_active: input.isActive ?? true,
  };

  if (input.role === "client") {
    payload.employee_id = null;
    payload.client_id = input.clientId ?? null;
  } else {
    payload.employee_id = input.employeeId ?? null;
    payload.client_id = null;
  }

  return payload;
}

async function getCurrentAuthedSupabase() {
  const supabase = getSupabaseAuthBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sesión no activa. Inicia sesión nuevamente.");
  }

  return supabase;
}

async function syncProjectMembershipsDb(
  userId: string,
  role: AppRole,
  projectIds: number[]
) {
  const supabase = await getCurrentAuthedSupabase();

  const { data: existingData, error: existingError } = await supabase
    .from("project_members")
    .select("*")
    .eq("profile_id", userId);

  if (existingError) {
    throw new Error(existingError.message || "No se pudieron cargar las asignaciones.");
  }

  const existing = (existingData ?? []) as ProjectMemberRow[];
  const currentProjectIds = new Set(existing.map((row) => row.project_id));
  const targetProjectIds = new Set(projectIds);

  const idsToDelete = existing
    .filter((row) => !targetProjectIds.has(row.project_id))
    .map((row) => row.id);

  if (idsToDelete.length > 0) {
    const { error } = await supabase.from("project_members").delete().in("id", idsToDelete);
    if (error) {
      throw new Error(error.message || "No se pudieron limpiar las asignaciones anteriores.");
    }
  }

  if (!["pm", "inspector"].includes(role)) {
    return;
  }

  const rowsToUpsert = projectIds
    .filter((projectId) => !currentProjectIds.has(projectId))
    .map((projectId, index) => ({
      project_id: projectId,
      profile_id: userId,
      assignment_role: role,
      is_primary: index === 0,
    }));

  if (rowsToUpsert.length > 0) {
    const { error } = await supabase
      .from("project_members")
      .upsert(rowsToUpsert, { onConflict: "project_id,profile_id" });

    if (error) {
      throw new Error(error.message || "No se pudieron asignar los proyectos.");
    }
  }

  const rowsToUpdate = existing
    .filter((row) => targetProjectIds.has(row.project_id))
    .map((row, index) => ({
      id: row.id,
      assignment_role: role,
      is_primary: index === 0,
    }));

  for (const row of rowsToUpdate) {
    const { error } = await supabase
      .from("project_members")
      .update({
        assignment_role: row.assignment_role,
        is_primary: row.is_primary,
      })
      .eq("id", row.id);

    if (error) {
      throw new Error(error.message || "No se pudieron actualizar las asignaciones.");
    }
  }
}

export async function getUsersProfilesDb(): Promise<UserProfile[]> {
  const supabase = await getCurrentAuthedSupabase();

  const [{ data, error }, { data: projectMembersData, error: projectMembersError }] =
    await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("project_members").select("*"),
    ]);

  if (error) {
    throw new Error(error.message || "No se pudieron cargar los usuarios.");
  }

  if (projectMembersError) {
    throw new Error(projectMembersError.message || "No se pudieron cargar los proyectos por usuario.");
  }

  const membersByProfile = new Map<string, number[]>();
  for (const member of (projectMembersData ?? []) as ProjectMemberRow[]) {
    const current = membersByProfile.get(member.profile_id) ?? [];
    current.push(member.project_id);
    membersByProfile.set(member.profile_id, current);
  }

  return ((data ?? []) as ProfileRow[]).map((row) =>
    mapProfile(row, membersByProfile.get(row.id) ?? [])
  );
}

export type UpdateUserProfileInput = {
  role?: AppRole;
  fullName?: string | null;
  employeeId?: number | null;
  clientId?: number | null;
  isActive?: boolean;
  projectIds?: number[];
};

export async function updateUserProfileDb(
  userId: string,
  input: UpdateUserProfileInput
): Promise<UserProfile> {
  const supabase = await getCurrentAuthedSupabase();

  const { data: currentData, error: currentError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (currentError || !currentData) {
    throw new Error(currentError?.message || "No se encontró el usuario.");
  }

  const current = currentData as ProfileRow;
  const nextRole = input.role ?? (current.role as AppRole);
  const payload = normalizeProfilePayload({
    role: nextRole,
    fullName: input.fullName ?? current.full_name,
    employeeId: input.employeeId ?? current.employee_id,
    clientId: input.clientId ?? current.client_id,
    isActive: input.isActive ?? current.is_active,
  });

  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "No se pudo actualizar el usuario.");
  }

  const projectIds = input.projectIds ?? [];
  await syncProjectMembershipsDb(userId, nextRole, projectIds);

  const { data: projectMembersData } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("profile_id", userId);

  return mapProfile(
    data as ProfileRow,
    ((projectMembersData ?? []) as Array<{ project_id: number }>).map((row) => row.project_id)
  );
}

export type CreateWebUserInput = {
  email: string;
  password: string;
  role: AppRole;
  fullName: string;
  employeeId?: number | null;
  clientId?: number | null;
  isActive?: boolean;
  projectIds?: number[];
};

export async function createWebUserDb(input: CreateWebUserInput): Promise<UserProfile> {
  const supabase = await getCurrentAuthedSupabase();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Faltan variables públicas de Supabase para crear el usuario.");
  }

  const isolatedAuthClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data: signUpData, error: signUpError } = await isolatedAuthClient.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
      },
    },
  });

  if (signUpError || !signUpData.user?.id) {
    throw new Error(signUpError?.message || "No se pudo crear el usuario web.");
  }

  // Let the signup trigger create the placeholder profile, then enrich it from the operator session.
  const nextRole = input.role;
  const payload = normalizeProfilePayload({
    role: nextRole,
    fullName: input.fullName,
    employeeId: input.employeeId ?? null,
    clientId: input.clientId ?? null,
    isActive: input.isActive ?? true,
  });

  const { data: updatedProfileData, error: updateError } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", signUpData.user.id)
    .select("*")
    .single();

  if (updateError || !updatedProfileData) {
    throw new Error(updateError?.message || "El usuario se creó, pero no se pudo configurar su perfil.");
  }

  await syncProjectMembershipsDb(
    signUpData.user.id,
    nextRole,
    input.projectIds ?? []
  );

  const { data: projectMembersData } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("profile_id", signUpData.user.id);

  return mapProfile(
    updatedProfileData as ProfileRow,
    ((projectMembersData ?? []) as Array<{ project_id: number }>).map((row) => row.project_id)
  );
}
