# Windows offline licensing engine

## Implemented

- Versioned license and activation request contracts.
- Fixed product identifier HOSPITAL_PLANNING_2026.
- Ten-character serial reference with ambiguous characters excluded.
- Deterministic binary signing format, version HPL-LICENSE-SIGNATURE-V1.
- Ed25519 verification using BouncyCastle.Cryptography 2.7.0.
- DPAPI CurrentUser storage for installed license and pending activation request.
- SHA-256 machine fingerprint based on Windows MachineGuid and BIOS product UUID; network MAC addresses are excluded.
- DPAPI-protected clock high-water mark for obvious rollback detection.
- QR request/response JSON codec using ISO-8601 UTC strings.
- Replay-resistant activation flow: short-lived request, random 256-bit nonce, machine binding, signature verification, one-time local consumption.
- Native launcher endpoints and React activation UI.
- Windows self-test harness covers RFC 8032 Ed25519 vector, canonical payload digest, tamper detection, QR round-trip, DPAPI storage and clock rollback.

## Native loopback API

- GET /api/license/status — current state, reason, machine ID and trust-key configuration.
- GET /api/license/machine — product and machine identity.
- POST /api/license/request — creates and persists an activation challenge and returns the request QR JSON.
- POST /api/license/activate — validates the signed response QR and stores the license.

The routes are restricted to the launcher's 127.0.0.1 listener, active port, loopback remote address and exact browser Origin when present. Request bodies are size-limited.

## Public-key provisioning gate

TrustedPublicKeyRing.cs is intentionally empty. Do not enable enforcement until the production public key has been pinned after the key ceremony and the matching private key is stored in Supabase Edge Function secrets. While the ring is empty, the native runtime reports configured=false and the React gate remains disabled; this avoids locking out the hospital with a placeholder key.

After pinning the public key, the gate blocks business features for unactivated, expired, invalid, clock-tampered or hardware-mismatched licenses. The activation UI remains accessible and hospital data is never deleted.

## Security limitations

- The 10-character serial is a reference, not an activation secret.
- DPAPI CurrentUser protects against other Windows users, not malware running as the same user or an administrator.
- Clock rollback detection is heuristic, not a trusted offline clock.
- Offline revocation is learned only when the client reconnects or receives an update.
- Hardware changes may require administrator reactivation.
- Browser-hosted React code can be patched by a determined local attacker. This implementation is tamper resistance, not unbreakable DRM.
- The current license gate is a UI/native startup layer; sensitive business operations remain in the React application and would need a native enforcement boundary for stronger protection.

## Build and test

Run windows/build-exe.bat on Windows with .NET Framework 4.6.1+ and network access for the NuGet restore. The script compiles the launcher and licensing engine, then runs the Windows crypto/storage self-tests. The installer checks for .NET Framework 4.6.1 or newer and packages the BouncyCastle runtime.
