/// <reference lib="deno.ns" />
import { canonicalLicenseBytes } from "../_shared/license-canonical.ts";

Deno.test("C# and Supabase canonical license payloads share the same test vector", async () => {
  const payload = canonicalLicenseBytes({
    version: 1,
    signature_algorithm: "Ed25519",
    product_id: "HOSPITAL_PLANNING_2026",
    license_id: "test-license-0001",
    serial: "ABCDEFGHJK",
    machine_id: "a".repeat(64),
    request_nonce: "b".repeat(48),
    license_type: "TIME_LIMITED",
    issued_at_utc: "2026-10-30T10:00:00.000Z",
    expires_at_utc: "2027-10-30T10:00:00.000Z",
    features: ["REPORTS", "FULL_ACCESS"],
    signing_key_version: 1,
  });
  const digestInput = new Uint8Array(payload).buffer as ArrayBuffer;
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", digestInput));
  const hex = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
  if (hex !== "0c0dac7a1f38c8892975adcfd32ce6179e9b5f6f4633bdd75c5cab7885c2301b") {
    throw new Error("Canonical payload mismatch: " + hex);
  }
});
