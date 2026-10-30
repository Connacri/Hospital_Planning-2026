/// <reference lib="deno.ns" />
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.118.0";
import { canonicalLicenseBytes } from "../_shared/license-canonical.ts";

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PRODUCT_ID = "HOSPITAL_PLANNING_2026";
const REQUEST_PROTOCOL = "HPL-ACTIVATION-1";
const SERIAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ALLOWED_DURATIONS = new Set([7, 30, 90, 180, 365]);
const encoder = new TextEncoder();

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return new Uint8Array(bytes).buffer as ArrayBuffer;
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function decodeBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  const raw = atob(padded);
  return Uint8Array.from(raw, (ch) => ch.charCodeAt(0));
}

function encodeBase64(value: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < value.length; i++) binary += String.fromCharCode(value[i]);
  return btoa(binary);
}

function randomSerial(): string {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  let serial = "";
  for (const byte of bytes) serial += SERIAL_ALPHABET[byte & 31];
  return serial;
}

function isUuidN(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{32}$/i.test(value);
}

function isMachineId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/i.test(value);
}

async function sha256Hex(value: Uint8Array): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", toArrayBuffer(value)));
  return Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join("");
}


async function signDocument(
  doc: Parameters<typeof canonicalLicenseBytes>[0],
  privateKeyPkcs8: Uint8Array,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "pkcs8",
    toArrayBuffer(privateKeyPkcs8),
    { name: "Ed25519" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(await crypto.subtle.sign("Ed25519", key, toArrayBuffer(canonicalLicenseBytes(doc))));
  if (signature.length !== 64) throw new Error("Unexpected Ed25519 signature size.");
  return encodeBase64(signature);
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json(405, { error: "METHOD_NOT_ALLOWED" });

  let claim: { requestId: string; claimToken: string } | null = null;
  let licenseId: string | null = null;
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  try {
    if (!supabaseUrl || !anonKey || !serviceRoleKey) throw new Error("SUPABASE_SERVER_CONFIGURATION_MISSING");
    const authorization = request.headers.get("Authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) return json(401, { error: "AUTH_REQUIRED" });

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authorization } },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData.user) return json(401, { error: "INVALID_SESSION" });

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: admin, error: adminError } = await adminClient
      .from("license_admins")
      .select("role, active")
      .eq("user_id", authData.user.id)
      .maybeSingle();
    if (adminError || !admin || !admin.active || !["owner", "issuer"].includes(admin.role)) {
      return json(403, { error: "LICENSE_ADMIN_REQUIRED" });
    }

    const body = await request.json();
    const activation = body?.activation_request;
    const licenseType = body?.license_type;
    const durationDays = body?.duration_days;
    if (!activation || activation.protocol !== REQUEST_PROTOCOL || activation.product_id !== PRODUCT_ID
      || !isUuidN(activation.request_id) || !isMachineId(activation.machine_id)
      || typeof activation.nonce !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(activation.nonce)
      || typeof activation.created_at_utc !== "string" || !activation.created_at_utc.endsWith("Z")) {
      return json(400, { error: "INVALID_ACTIVATION_REQUEST" });
    }

    const nonceBytes = decodeBase64Url(activation.nonce);
    if (nonceBytes.length !== 32) return json(400, { error: "INVALID_NONCE" });
    const requestedAt = Date.parse(activation.created_at_utc);
    const nowMs = Date.now();
    if (!Number.isFinite(requestedAt) || requestedAt > nowMs + 120000 || nowMs - requestedAt > 20 * 60 * 1000) {
      return json(400, { error: "ACTIVATION_REQUEST_EXPIRED" });
    }

    if (licenseType !== "TIME_LIMITED" && licenseType !== "PERPETUAL") {
      return json(400, { error: "INVALID_LICENSE_TYPE" });
    }
    if ((licenseType === "PERPETUAL" || body?.custom_duration === true) && admin.role !== "owner") {
      return json(403, { error: "OWNER_ROLE_REQUIRED_FOR_PERPETUAL_OR_CUSTOM_TERM" });
    }
    if (licenseType === "TIME_LIMITED"
      && (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 3650
        || (!ALLOWED_DURATIONS.has(durationDays) && body?.custom_duration !== true))) {
      return json(400, { error: "INVALID_DURATION_DAYS" });
    }
    if (licenseType === "PERPETUAL" && durationDays !== null && durationDays !== undefined) {
      return json(400, { error: "PERPETUAL_LICENSE_MUST_NOT_HAVE_DURATION" });
    }

    const keyVersion = Number(Deno.env.get("LICENSE_SIGNING_KEY_VERSION"));
    const privateKeyB64 = Deno.env.get("LICENSE_ED25519_PRIVATE_KEY_PKCS8_B64");
    const publicKeyB64 = Deno.env.get("LICENSE_ED25519_PUBLIC_KEY_B64");
    if (!Number.isInteger(keyVersion) || keyVersion < 1 || !privateKeyB64 || !publicKeyB64) {
      throw new Error("LICENSE_SIGNING_KEY_CONFIGURATION_MISSING");
    }
    const privateKeyPkcs8 = decodeBase64Url(privateKeyB64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""));
    const publicKey = decodeBase64Url(publicKeyB64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""));
    if (publicKey.length !== 32) throw new Error("INVALID_PUBLIC_KEY_CONFIGURATION");

    // Ensure the configured public key matches the private signing key before issuing anything.
    const verifyKey = await crypto.subtle.importKey("raw", toArrayBuffer(publicKey), { name: "Ed25519" }, false, ["verify"]);
    const testBytes = encoder.encode("HPL-SIGNING-KEY-PAIR-CHECK");
    const privateKey = await crypto.subtle.importKey("pkcs8", toArrayBuffer(privateKeyPkcs8), { name: "Ed25519" }, false, ["sign"]);
    const testSignature = await crypto.subtle.sign("Ed25519", privateKey, toArrayBuffer(testBytes));
    if (!await crypto.subtle.verify("Ed25519", verifyKey, testSignature, toArrayBuffer(testBytes))) {
      throw new Error("SIGNING_KEY_PAIR_MISMATCH");
    }

    const publicKeyBase64 = encodeBase64(publicKey);
    const { data: existingKey, error: keyReadError } = await adminClient
      .from("license_signing_keys").select("public_key_base64, algorithm, active")
      .eq("key_version", keyVersion).maybeSingle();
    if (keyReadError) throw new Error("SIGNING_KEY_LOOKUP_FAILED");
    if (existingKey && (existingKey.public_key_base64 !== publicKeyBase64 || existingKey.algorithm !== "Ed25519" || !existingKey.active)) {
      throw new Error("SIGNING_KEY_VERSION_ALREADY_BOUND");
    }
    if (!existingKey) {
      const { error: keyInsertError } = await adminClient.from("license_signing_keys").insert({
        key_version: keyVersion, algorithm: "Ed25519", public_key_base64: publicKeyBase64, active: true,
      });
      if (keyInsertError) {
        if (keyInsertError.code !== "23505") throw new Error("SIGNING_PUBLIC_KEY_REGISTRATION_FAILED");
        const { data: racedKey, error: racedKeyError } = await adminClient
          .from("license_signing_keys").select("public_key_base64, algorithm, active")
          .eq("key_version", keyVersion).maybeSingle();
        if (racedKeyError || !racedKey || racedKey.public_key_base64 !== publicKeyBase64 || racedKey.algorithm !== "Ed25519" || !racedKey.active) {
          throw new Error("SIGNING_KEY_VERSION_ALREADY_BOUND");
        }
      }
    }

    const nonceHash = await sha256Hex(nonceBytes);
    // The QR uses UUID-N (32 hex chars); PostgreSQL expects canonical UUID text.
    const requestUuid = activation.request_id.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5").toLowerCase();
    const claimToken = crypto.randomUUID();
    const { data: claimed, error: claimError } = await adminClient.rpc("claim_license_request", {
      p_request_id: requestUuid,
      p_nonce_hash: nonceHash,
      p_machine_id: activation.machine_id.toLowerCase(),
      p_requested_at_utc: new Date(requestedAt).toISOString(),
      p_claim_token: claimToken,
    });
    if (claimError) throw new Error("ACTIVATION_REQUEST_CLAIM_FAILED");
    if (claimed !== true) {
      // Idempotent retry: if the original issuance committed but the response was lost,
      // return the exact same signed document instead of issuing a second license.
      const { data: previousRequest, error: previousRequestError } = await adminClient
        .from("license_requests").select("status, nonce_hash, machine_id, license_id")
        .eq("request_id", requestUuid).maybeSingle();
      if (!previousRequestError && previousRequest && previousRequest.status === "issued"
        && previousRequest.nonce_hash === nonceHash
        && previousRequest.machine_id === activation.machine_id.toLowerCase()
        && previousRequest.license_id) {
        const { data: previousLicense, error: previousLicenseError } = await adminClient
          .from("licenses").select("signed_document, status").eq("id", previousRequest.license_id).maybeSingle();
        if (!previousLicenseError && previousLicense?.status === "active" && previousLicense?.signed_document) {
          return json(200, { license: previousLicense.signed_document, idempotent_retry: true });
        }
      }
      return json(409, { error: "ACTIVATION_REQUEST_ALREADY_USED_OR_IN_PROGRESS" });
    }
    claim = { requestId: requestUuid, claimToken };

    const issuedAt = new Date().toISOString();
    const expiresAt = licenseType === "PERPETUAL"
      ? null
      : new Date(Date.parse(issuedAt) + durationDays * 86400000).toISOString();
    const features = ["FULL_ACCESS"];

    let signedDocument: Record<string, unknown> | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const document = {
        version: 1,
        signature_algorithm: "Ed25519",
        product_id: PRODUCT_ID,
        license_id: crypto.randomUUID(),
        serial: randomSerial(),
        machine_id: activation.machine_id.toLowerCase(),
        request_nonce: activation.nonce,
        license_type: licenseType,
        issued_at_utc: issuedAt,
        expires_at_utc: expiresAt,
        features,
        signing_key_version: keyVersion,
      };
      const signature = await signDocument(document, privateKeyPkcs8);
      const completeDocument = { ...document, signature };
      const { data: finalizedId, error: finalizeError } = await adminClient.rpc("finalize_license_issuance", {
        p_license_document: completeDocument,
        p_actor_user_id: authData.user.id,
        p_request_id: requestUuid,
        p_claim_token: claimToken,
        p_nonce_hash: nonceHash,
      });
      if (!finalizeError) {
        if (finalizedId !== document.license_id) throw new Error("LICENSE_FINALIZATION_ID_MISMATCH");
        signedDocument = completeDocument;
        licenseId = document.license_id;
        break;
      }
      if (finalizeError.code !== "23505") throw new Error("LICENSE_FINALIZATION_FAILED");
    }
    if (!signedDocument || !licenseId) throw new Error("SERIAL_ALLOCATION_FAILED");

    return json(200, { license: signedDocument });
  } catch (error) {
    console.error("issue-license failed:", error);
    if (licenseId) {
      const url = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (url && serviceKey) {
        const cleanup = createClient(url, serviceKey, { auth: { persistSession: false } });
        await cleanup.from("licenses").update({ status: "revoked", revoked_at: new Date().toISOString() })
          .eq("id", licenseId).eq("status", "active");
      }
    }
    if (claim) {
      const url = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (url && serviceKey) {
        const cleanup = createClient(url, serviceKey, { auth: { persistSession: false } });
        await cleanup.rpc("release_license_request", { p_request_id: claim.requestId, p_claim_token: claim.claimToken });
      }
    }
    return json(500, { error: "LICENSE_ISSUANCE_FAILED" });
  }
});
