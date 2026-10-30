/// <reference lib="deno.ns" />
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.118.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json(405, { error: "METHOD_NOT_ALLOWED" });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authorization = request.headers.get("Authorization");
    if (!supabaseUrl || !anonKey || !serviceKey || !authorization) {
      return json(401, { error: "AUTHENTICATION_REQUIRED" });
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData.user) return json(401, { error: "INVALID_SESSION" });

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: admin, error: adminError } = await adminClient
      .from("license_admins").select("role, active")
      .eq("user_id", authData.user.id).maybeSingle();
    if (adminError || !admin || !admin.active
      || !["owner", "issuer", "viewer"].includes(admin.role)) {
      return json(403, { error: "ADMIN_ACCESS_REQUIRED" });
    }

    const body = await request.json().catch(() => ({}));
    const search = typeof body?.search === "string" ? body.search.trim() : "";
    if (search && !/^[A-Za-z0-9-]{1,64}$/.test(search)) {
      return json(400, { error: "INVALID_SEARCH_TERM" });
    }
    const limit = Number.isInteger(body?.limit) ? Math.min(100, Math.max(1, body.limit)) : 50;
    const offset = Number.isInteger(body?.offset) ? Math.min(100000, Math.max(0, body.offset)) : 0;

    let query = adminClient.from("licenses")
      .select("id, serial, machine_id, license_type, issued_at_utc, expires_at_utc, status, revoked_at, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (search) query = query.or("serial.ilike." + search + "%,machine_id.ilike." + search + "%");

    const { data: licenses, error: listError, count } = await query;
    if (listError) throw new Error("LICENSE_LIST_FAILED");
    return json(200, { licenses: licenses || [], count: count || 0, role: admin.role });
  } catch {
    return json(500, { error: "LICENSE_LIST_FAILED" });
  }
});
