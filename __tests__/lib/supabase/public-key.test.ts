import { describe, expect, it } from "vitest";
import { assertPublicSupabaseKey } from "@/lib/supabase/public-key";

function makeJwtPayload(payload: Record<string, unknown>) {
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `header.${encodedPayload}.signature`;
}

describe("assertPublicSupabaseKey", () => {
  it("allows anon JWT keys", () => {
    expect(() => assertPublicSupabaseKey(makeJwtPayload({ role: "anon" }))).not.toThrow();
  });

  it("allows publishable keys", () => {
    expect(() => assertPublicSupabaseKey("sb_publishable_123")).not.toThrow();
  });

  it("rejects secret keys", () => {
    expect(() => assertPublicSupabaseKey("sb_secret_123")).toThrow(/privileged Supabase key/i);
  });

  it("rejects service role JWT keys", () => {
    expect(() => assertPublicSupabaseKey(makeJwtPayload({ role: "service_role" }))).toThrow(
      /privileged/i
    );
  });
});
