# Production signing key ceremony

The license signing key is the root of trust for every offline desktop license. Generate it once in a controlled administrator workstation or managed key vault. Do not generate it in the Android app, in the browser, or in a GitHub Actions job.

## Generate an Ed25519 keypair on Windows

Prerequisites: OpenSSL 3.x and the Supabase CLI. Run from a private working directory outside the repository.

    $work = Join-Path $env:USERPROFILE "HPL-License-KeyCeremony"
    New-Item -ItemType Directory -Force $work | Out-Null
    Set-Location $work

    openssl genpkey -algorithm ED25519 -out license-private.pem
    openssl pkey -in license-private.pem -outform DER -out license-private.pk8
    openssl pkey -in license-private.pem -pubout -outform DER -out license-public.spki

    $privatePkcs8 = [Convert]::ToBase64String([IO.File]::ReadAllBytes("license-private.pk8"))
    $spki = [IO.File]::ReadAllBytes("license-public.spki")
    $rawPublicKey = $spki[($spki.Length - 32)..($spki.Length - 1)]
    $publicRaw = [Convert]::ToBase64String($rawPublicKey)

    supabase secrets set --project-ref YOUR_PROJECT_REF "LICENSE_ED25519_PRIVATE_KEY_PKCS8_B64=$privatePkcs8" "LICENSE_ED25519_PUBLIC_KEY_B64=$publicRaw" "LICENSE_SIGNING_KEY_VERSION=1"

Verify the generated keypair with an independent Ed25519 test before issuing production licenses. The Edge Function also performs a sign/verify pair check before issuing.

## Pin the public key in Windows

Only the raw public key is allowed in the desktop application. Add the Base64 value of $publicRaw to the trusted public-key ring in the Windows licensing engine, mapped to key version 1. Never copy license-private.pem or license-private.pk8 into the repository, build artifacts, Android project, or Windows installation.

The current verifier accepts an injected dictionary of version -> 32-byte raw public key. The launcher must not enable license enforcement until this key ring has been populated with the production public key and its matching test has passed.

## Deploy

    supabase db push
    supabase functions deploy issue-license --project-ref YOUR_PROJECT_REF

Provision an administrator by creating the user in Supabase Auth, then inserting that user's UUID into public.license_admins with role owner or issuer through a trusted SQL session.

Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in admin-android/.env before building the admin APK. These are public client settings; do not use the service-role key here.

## Key custody and rotation

- Keep an encrypted offline backup of the private key with controlled access and a documented recovery owner.
- Record the key version and public-key fingerprint in an administrative register.
- Never reuse a key version for a different public key.
- For rotation, add a new key version and pin its public key in a desktop release before changing the server's signing version.
- Keep previous public keys in the desktop verifier until all licenses signed by them are no longer valid.
- Revoke compromised signing keys operationally; offline clients cannot learn about revocation until they reconnect or receive a software update.
