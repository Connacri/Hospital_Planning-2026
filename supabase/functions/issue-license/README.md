# issue-license

Authenticated Supabase Edge Function that issues an offline license from a Windows activation QR.

## Request

POST with a valid Supabase Auth Bearer token:

    {
      "activation_request": {
        "protocol": "HPL-ACTIVATION-1",
        "product_id": "HOSPITAL_PLANNING_2026",
        "machine_id": "<64 lowercase hex SHA-256 characters>",
        "request_id": "<32 hexadecimal UUID-N characters>",
        "nonce": "<43-character base64url value>",
        "created_at_utc": "2026-10-30T10:00:00.000Z"
      },
      "license_type": "TIME_LIMITED",
      "duration_days": 30,
      "custom_duration": false
    }

Perpetual licenses use license_type PERPETUAL and duration_days null. Custom durations require custom_duration=true and are bounded to 1–3650 days.

## Security controls

- Validates Supabase Auth user and active license_admins role.
- Validates product, machine hash, UUID, nonce, request timestamp and term.
- Claims request ID + SHA-256 nonce hash atomically to prevent concurrent/replayed issuance.
- Signs deterministic binary canonical bytes using Ed25519.
- Persists license, consumes the request and writes the audit event in one database transaction.
- Returns the complete signed document as JSON for the Android app to encode as a response QR.
- Private key is read only from Supabase Edge Function secrets.

The Android app receives only a signed document; it never receives the private signing key or service-role key.
