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
    if (adminError || !admin || !admin.active || admin.role !== "owner") {
      return json(403, { error: "OWNER_ROLE_REQUIRED" });
    }

    const body = await request.json().catch(() => ({}));
    const licenseId = typeof body?.license_id === "string" ? body.license_id : "";
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(licenseId)) {
      return json(400, { error: "INVALID_LICENSE_ID" });
    }
    if (!reason || reason.length > 500) return json(400, { error: "INVALID_REVOCATION_REASON" });

    const { data: revoked, error: revokeError } = await adminClient.rpc("revoke_license_atomic", {
      p_license_id: licenseId,
      p_actor_user_id: authData.user.id,
      p_reason: reason,
    });
    if (revokeError) throw new Error("LICENSE_REVOCATION_FAILED");
    if (revoked !== true) return json(409, { error: "LICENSE_NOT_ACTIVE_OR_NOT_FOUND" });
    return json(200, { success: true, license_id: licenseId, status: "revoked" });
  } catch {
    return json(500, { error: "LICENSE_REVOCATION_FAILED" });
  }
});
