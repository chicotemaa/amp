import { supabase } from "@/lib/supabase";
import type { AppRole } from "@/lib/auth/roles";
import { getSupabaseAuthBrowserClient } from "@/lib/supabase/auth-browser";
import type { Database } from "@/lib/types/supabase";

type AuditInput = {
  entityType: string;
  entityId: string;
  action: string;
  actorProfileId: string;
  actorRole: AppRole;
  projectId?: number | null;
  fromState?: string | null;
  toState?: string | null;
  metadata?: Record<string, unknown>;
};

type AuditLogInsert = Database["public"]["Tables"]["audit_logs"]["Insert"];

export async function logAuditEvent(input: AuditInput) {
  try {
    const payload: AuditLogInsert = {
      entity_type: input.entityType,
      entity_id: input.entityId,
      project_id: input.projectId ?? null,
      action: input.action,
      from_state: input.fromState ?? null,
      to_state: input.toState ?? null,
      actor_profile_id: input.actorProfileId,
      actor_role: input.actorRole,
      metadata: (input.metadata ?? {}) as AuditLogInsert["metadata"],
    };

    await supabase.from("audit_logs").insert(payload);
  } catch (error) {
    console.warn("Audit log skipped:", error);
  }
}

export async function logCurrentUserAuditEvent(
  input: Omit<AuditInput, "actorProfileId" | "actorRole">
) {
  try {
    const authSupabase = getSupabaseAuthBrowserClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) return;

    const { data: profile } = await authSupabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.id || !profile?.role) return;

    await logAuditEvent({
      ...input,
      actorProfileId: profile.id,
      actorRole: profile.role as AppRole,
    });
  } catch (error) {
    console.warn("Current user audit log skipped:", error);
  }
}
