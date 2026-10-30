# Offline licensing production checklist

This checklist must be completed before enabling enforcement for real hospital users.

## 1. Signing root of trust

- [ ] Use a controlled BitLocker-protected workstation and OpenSSL 3.x.
- [ ] Generate one Ed25519 keypair using docs/LICENSING-KEY-OPERATIONS.md.
- [ ] Store the PKCS#8 private key in a restricted encrypted backup; never commit or send it.
- [ ] Set the private PKCS#8 and matching raw public key as Supabase Edge Function secrets.
- [ ] Verify the server-side sign/verify key-pair self-test.
- [ ] Pin only the raw 32-byte public key in windows/Licensing/TrustedPublicKeyRing.cs at the matching key version.
- [ ] Rebuild and retest the Windows desktop with that exact key version.

## 2. Supabase deployment

- [ ] Link the Supabase CLI to the intended project.
- [ ] Run supabase db push and inspect the migration result.
- [ ] Deploy issue-license, list-licenses and revoke-license.
- [ ] Confirm all three functions require JWT verification.
- [ ] Create the first Auth user and provision its UUID as role owner in public.license_admins.
- [ ] Provision additional issuer/viewer users with least privilege.
- [ ] Confirm anon/authenticated cannot directly read or mutate license tables; service_role remains server-only.

## 3. End-to-end activation

- [ ] Build the Android admin APK with the correct VITE_SUPABASE_URL and public anon/publishable key.
- [ ] Install the APK on the administrator phone and grant camera permission.
- [ ] Start a clean Windows installation with no license.
- [ ] Display the Windows request QR and scan it with the admin app.
- [ ] Issue a 7-day test license and scan the signed response QR on Windows.
- [ ] Confirm the 10-character serial appears in the admin app and the Windows gate opens.
- [ ] Disconnect Windows from the Internet and restart; confirm the license remains active offline.
- [ ] Confirm a different machine rejects the signed document.
- [ ] Confirm altered signature, wrong product, wrong nonce and expired license are rejected.
- [ ] Confirm expiry locks business features but preserves all hospital data and the activation screen.
- [ ] Keep the application open across expiry and confirm the periodic native check locks it within approximately one minute.
- [ ] Test with TPM available and unavailable; record the expected machine identity behavior.

## 4. Operations and limitations

- [ ] Assign an owner responsible for private-key custody and rotation.
- [ ] Keep an encrypted recovery backup of the private key and document who can access it.
- [ ] Decide the support process for motherboard/TPM changes and hardware reactivation.
- [ ] Understand that revocation is server-side only today; a fully offline desktop cannot receive it until a signed online revocation check or software update is delivered.
- [ ] Plan a future native boundary for sensitive business operations. The current React gate deters casual misuse but cannot prevent a determined local attacker from patching browser-hosted code.
- [ ] Consider Authenticode signing for the Windows executable and a release-signed Android APK before broad distribution.

Do not enable a production key or distribute the enforcing desktop until the entire end-to-end checklist has passed on a real Windows machine and administrator phone.
