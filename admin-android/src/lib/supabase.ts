import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && anonKey && !url.includes("YOUR_PROJECT"));
export const supabase = createClient(
  url || "https://invalid.local",
  anonKey || "missing-public-key",
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } },
);
