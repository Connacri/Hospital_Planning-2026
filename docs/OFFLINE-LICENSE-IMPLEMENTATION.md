# Offline license system — implementation record

## Decisions

- Desktop: existing React + TypeScript + Vite application, hosted by the existing native Windows C# launcher.
- Windows licensing engine: C#; no Flutter, Electron or Tauri migration.
- Administrator: separate Android application (planned as a separate React/TypeScript/Capacitor project).
- Backend: Supabase Auth + Edge Functions + Postgres.
- Activation: Windows request QR -> Android admin scan -> server-issued signed response QR -> Windows verification.
- Human serial: 10 characters; reference only, not a bearer credential.
- License terms: 7, 30, 90, 180, 365 days, custom duration, or perpetual.
- Offline after activation; TPM optional; DPAPI fallback.
- Expiration blocks business features, but never deletes hospital data and never blocks the activation screen.

## Trust model

The server owns the Ed25519 private signing key. The Windows client embeds only trusted public keys and verifies a signed, canonical license document locally. The desktop must validate product, version, machine binding, request nonce, issue/expiry dates and feature set. The Android administrator app never signs licenses locally.

A local serial check, hidden JavaScript variable, local HTTP endpoint or hardware hash alone is not a security boundary. Since the current UI is browser-hosted, a determined local attacker can patch JavaScript or the launcher. Sensitive enforcement must be performed in native code; stronger protection may require moving critical operations behind a native boundary. This project aims to deter tampering and unauthorized casual use, not promise unbreakable DRM.

## Rollout safety

All work is isolated on `feature/offline-license-system`. The initial commit adds contracts and policy only. It does not modify the production launcher, React application, Supabase schema, Android build or installer. The licensing gate must not be enabled until the cryptographic verifier and recovery path are tested. Existing hospital records and backup paths must remain untouched.


## Native activation integration

The C# launcher now exposes loopback-only license status, machine identity, request QR and response activation endpoints. The React app wraps its existing application in a license gate only when it is running from the installed Windows launcher's reserved loopback port range. Android and web deployments remain unaffected. The activation screen shows the request QR, scans the administrator response QR, and offers a manual JSON paste fallback.

The public-key ring is intentionally empty in source. Until the production public key from the key ceremony is pinned in TrustedPublicKeyRing.cs, the native runtime reports configured=false and does not block the hospital. Once pinned, the gate enforces the signed license state. This avoids shipping a placeholder trust anchor or locking out the hospital before key provisioning.
