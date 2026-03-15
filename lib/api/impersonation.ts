import { getSupabaseAuthBrowserClient } from "@/lib/supabase/auth-browser";
import type { AppRole } from "@/lib/auth/roles";

const ACTIVE_AUDIT_KEY = "amp_active_impersonation_audit";

export async function startImpersonationAudit(viewedRole: AppRole, reason = "UI role preview") {
  try {
    const supabase = getSupabaseAuthBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("impersonation_audit")
      .insert({
        operator_user_id: user.id,
        viewed_role: viewedRole,
        reason,
      })
      .select("id")
      .single();

    if (error || !data?.id) return;
    sessionStorage.setItem(ACTIVE_AUDIT_KEY, data.id);
  } catch (error) {
    console.warn("Impersonation audit start skipped:", error);
  }
}

export async function endImpersonationAudit() {
  try {
    const auditId = sessionStorage.getItem(ACTIVE_AUDIT_KEY);
    if (!auditId) return;

    const supabase = getSupabaseAuthBrowserClient();
    const { error } = await supabase
      .from("impersonation_audit")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", auditId);

    if (!error) {
      sessionStorage.removeItem(ACTIVE_AUDIT_KEY);
    }
  } catch (error) {
    console.warn("Impersonation audit end skipped:", error);
  }
}
