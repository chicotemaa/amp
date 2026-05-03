function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function assertPublicSupabaseKey(key: string, envName = "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
  if (!key || key === "placeholder") return;

  if (key.startsWith("sb_secret_")) {
    throw new Error(
      `${envName} is configured with a Supabase secret key. Use the anon public key or a publishable key instead. Rotate the exposed secret immediately.`
    );
  }

  const payload = decodeJwtPayload(key);
  const role = payload?.role;

  if (role === "service_role" || role === "supabase_admin") {
    throw new Error(
      `${envName} is configured with a privileged Supabase JWT (${String(role)}). Use the anon public key instead. Rotate the exposed secret immediately.`
    );
  }
}
