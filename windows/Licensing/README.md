# Windows offline licensing — foundation

This folder contains the first protocol and policy layer for the Windows launcher.

## Current scope

- Versioned license and activation-request data contracts.
- Fixed product identifier: `HOSPITAL_PLANNING_2026`.
- Ten-character human-readable serial alphabet (ambiguous characters excluded).
- Structural validation of machine SHA-256 identifiers, request nonces, dates and license type.
- Explicit license states and policy evaluation.
- Expiration is exclusive: a time-limited license is expired when UTC now is greater than or equal to `ExpiresAtUtc`.
- Evaluation never deletes or modifies hospital data. The activation UI remains available in every state.

## Security boundary — important

`LicensePolicy.Evaluate` accepts a `signatureVerified` result from its caller. It does not verify cryptographic signatures. Do not connect this policy to the application until the Ed25519 verifier, trusted public-key ring, canonical signed-payload format, protected storage and replay-resistant activation flow are implemented and tested.

The private signing key must remain on the server (ideally a managed secret/KMS). Neither the Android admin client nor this repository may contain it. The 10-character serial is an operator-friendly reference, not an activation secret or proof of entitlement.

Offline revocation cannot be instantaneous: a disconnected desktop can only learn of revocation when it next synchronizes. TPM is optional and must not be a hard dependency; Windows DPAPI is the baseline local protection. No client-side design can make software running on a user-controlled Windows machine impossible to patch.

## Next implementation increments

1. Implement and test Ed25519 verification with a library explicitly compatible with the actual Windows compiler/runtime.
2. Define canonical serialization and signed bytes; add known-answer signature tests.
3. Implement DPAPI storage, machine identity with component-tolerance policy, nonce lifecycle and clock rollback heuristics.
4. Add a native launcher gate and hardened loopback bridge; preserve backups and all hospital data.
5. Add Supabase migrations and Edge Functions with deny-by-default RLS, then the separate Android admin app.


## Native loopback endpoints

- GET /api/license/status — state, reason, machine ID and whether the public-key ring is configured.
- GET /api/license/machine — product and machine identity.
- POST /api/license/request — creates and DPAPI-persists a fresh activation challenge and returns QR JSON.
- POST /api/license/activate — accepts the signed response QR JSON, validates nonce/machine/signature and persists the license.

These routes are served only by the existing loopback listener. License routes check the 127.0.0.1 host, active port, loopback remote address and exact browser Origin when present; activation bodies are size-limited. The existing app still runs with no key pinned, so rollout cannot accidentally lock out the hospital.
