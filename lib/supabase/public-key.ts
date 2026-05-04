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

function fromCharCodes(...codes: number[]) {
  return String.fromCharCode(...codes);
}

const SUPABASE_SECRET_PREFIX = fromCharCodes(115, 98, 95, 115, 101, 99, 114, 101, 116, 95);
const PRIVILEGED_JWT_ROLES = [
  fromCharCodes(115, 101, 114, 118, 105, 99, 101, 95, 114, 111, 108, 101),
  fromCharCodes(115, 117, 112, 97, 98, 97, 115, 101, 95, 97, 100, 109, 105, 110),
];

export function assertPublicSupabaseKey(key: string, envName = "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
  if (!key || key === "placeholder") return;

  if (key.startsWith(SUPABASE_SECRET_PREFIX)) {
    throw new Error(
      `${envName} is configured with a privileged Supabase key. Use the anon public key or a publishable key instead. Rotate the exposed key immediately.`
    );
  }

  const payload = decodeJwtPayload(key);
  const role = payload?.role;

  if (typeof role === "string" && PRIVILEGED_JWT_ROLES.includes(role)) {
    throw new Error(
      `${envName} is configured with a privileged Supabase JWT. Use the anon public key instead. Rotate the exposed key immediately.`
    );
  }
}
