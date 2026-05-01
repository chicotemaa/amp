import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { Database } from "./types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== "undefined") {
        console.error(
            "Missing Supabase environment variables! Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
        );
    }
    // During build/prerendering, allow the module to load with empty values.
    // Actual API calls will fail but static page generation won't crash.
}

export const supabase =
    typeof window === "undefined"
        ? createClient<Database>(supabaseUrl || "https://placeholder.supabase.co", supabaseAnonKey || "placeholder", {
              auth: {
                  persistSession: false,
                  autoRefreshToken: false,
              },
          })
        : createBrowserClient<Database>(supabaseUrl || "https://placeholder.supabase.co", supabaseAnonKey || "placeholder");

