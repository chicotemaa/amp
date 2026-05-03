"use client";

import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import { assertPublicSupabaseKey } from "@/lib/supabase/public-key";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseAuthBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== "undefined") {
      throw new Error(
        "Missing Supabase environment variables! Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
      );
    }

    return createClient<Database>("https://placeholder.supabase.co", "placeholder", {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  assertPublicSupabaseKey(supabaseAnonKey);

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
}
