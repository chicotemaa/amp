import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Keep import-time Supabase client initialization from crashing unit tests.
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://127.0.0.1:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";

// Automatically clean up the DOM after each test
afterEach(() => {
    cleanup();
});
