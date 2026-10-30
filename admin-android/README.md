# Hospital Planning License Admin (Android)

A separate React + Capacitor Android application for authorized administrators.

## Features in this first increment

- Supabase Auth sign-in.
- QR scanning for a Windows activation request.
- Product and machine ID display before issuance.
- Fixed durations (7, 30, 90, 180, 365 days), custom duration (1–3650 days), or perpetual.
- Calls the authenticated issue-license Edge Function.
- Displays the server-signed response document as a QR code and the 10-character serial.

## Configuration

Copy .env.example to .env and set the Supabase project URL and public anon/publishable key. Never put the Supabase service-role key or Ed25519 private key in this app.

Provision administrator users in public.license_admins from a trusted SQL session after creating them in Supabase Auth. Authorization is checked again inside the Edge Function; hiding UI controls is not a security control.

## Build

```sh
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

The Android application ID is currently dz.sante.eh.ainelturck.licenseadmin; change it before first Play Store publication if your package naming policy requires another identifier.


## Camera permission

After running capacitor add android, ensure android/app/src/main/AndroidManifest.xml contains this permission inside the manifest element:

    <uses-permission android:name="android.permission.CAMERA" />

The Android CI workflow inserts this permission into its generated project before building. If the camera is denied or unavailable, the admin screen also supports pasting the activation QR JSON manually.


## License history and revocation

- The History tab calls the authenticated list-licenses Edge Function; the client never queries licensing tables directly.
- Owner, issuer and viewer roles can view the list. Only owner can revoke a license.
- Revocation is transactional with its audit event. It changes server status immediately, but a fully offline Windows installation cannot learn about it until a future synchronization or update.
