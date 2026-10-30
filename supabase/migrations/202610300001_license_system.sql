-- Offline licensing schema. Deliberately isolated from hospital scheduling/sync tables.
create extension if not exists pgcrypto;

create table if not exists public.license_admins (
    user_id uuid primary key references auth.users(id) on delete cascade,
    role text not null check (role in ('owner', 'issuer', 'viewer')),
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.license_signing_keys (
    key_version integer primary key check (key_version > 0),
    algorithm text not null check (algorithm = 'Ed25519'),
    public_key_base64 text not null,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    retired_at timestamptz
);

create table if not exists public.licenses (
    id uuid primary key,
    serial text not null unique check (serial ~ '^[A-HJ-NP-Z2-9]{10}$'),
    product_id text not null check (product_id = 'HOSPITAL_PLANNING_2026'),
    machine_id char(64) not null check (machine_id ~ '^[0-9a-f]{64}$'),
    license_type text not null check (license_type in ('TIME_LIMITED', 'PERPETUAL')),
    issued_at_utc timestamptz not null,
    expires_at_utc timestamptz,
    features text[] not null check (cardinality(features) between 1 and 32),
    request_id uuid not null,
    request_nonce_hash char(64) not null,
    signing_key_version integer not null references public.license_signing_keys(key_version),
    signature_base64 text not null,
    signed_document jsonb not null,
    status text not null default 'active' check (status in ('active', 'revoked')),
    revoked_at timestamptz,
    revoked_by uuid references auth.users(id),
    created_by uuid not null references auth.users(id),
    created_at timestamptz not null default now(),
    constraint license_expiry_consistency check (
      (license_type = 'PERPETUAL' and expires_at_utc is null)
      or (license_type = 'TIME_LIMITED' and expires_at_utc is not null and expires_at_utc > issued_at_utc)
    )
);

create index if not exists licenses_machine_id_idx on public.licenses(machine_id);
create index if not exists licenses_created_at_idx on public.licenses(created_at desc);
create index if not exists licenses_status_idx on public.licenses(status);

create table if not exists public.license_requests (
    request_id uuid primary key,
    nonce_hash char(64) not null unique,
    machine_id char(64) not null check (machine_id ~ '^[0-9a-f]{64}$'),
    requested_at_utc timestamptz not null,
    status text not null default 'pending' check (status in ('pending', 'issuing', 'issued')),
    claim_token uuid,
    claimed_at timestamptz,
    consumed_at timestamptz,
    license_id uuid references public.licenses(id),
    created_at timestamptz not null default now(),
    constraint request_issue_consistency check (
      (status <> 'issued') or (consumed_at is not null and license_id is not null)
    )
);

create table if not exists public.license_events (
    id bigint generated always as identity primary key,
    license_id uuid references public.licenses(id) on delete set null,
    request_id uuid,
    actor_user_id uuid references auth.users(id),
    event_type text not null,
    details jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists license_events_license_idx on public.license_events(license_id, created_at desc);

-- A request is claimed atomically. Only one concurrent admin request can issue a license
-- for a given request/nonce. Stale claims may be retried after two minutes.
create or replace function public.claim_license_request(
    p_request_id uuid,
    p_nonce_hash text,
    p_machine_id text,
    p_requested_at_utc timestamptz,
    p_claim_token uuid
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    claimed_count integer;
begin
    insert into public.license_requests(request_id, nonce_hash, machine_id, requested_at_utc, status)
    values (p_request_id, p_nonce_hash, p_machine_id, p_requested_at_utc, 'pending')
    on conflict do nothing;

    update public.license_requests
       set status = 'issuing', claim_token = p_claim_token, claimed_at = now()
     where request_id = p_request_id
       and nonce_hash = p_nonce_hash
       and machine_id = p_machine_id
       and consumed_at is null
       and (status = 'pending' or (status = 'issuing' and claimed_at < now() - interval '2 minutes'));

    get diagnostics claimed_count = row_count;
    return claimed_count = 1;
end;
$$;

create or replace function public.release_license_request(p_request_id uuid, p_claim_token uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
    update public.license_requests
       set status = 'pending', claim_token = null, claimed_at = null
     where request_id = p_request_id
       and claim_token = p_claim_token
       and consumed_at is null;
$$;

create or replace function public.finalize_license_issuance(
    p_license_document jsonb,
    p_actor_user_id uuid,
    p_request_id uuid,
    p_claim_token uuid,
    p_nonce_hash text
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $finalize$
declare
    v_license_id uuid;
    v_serial text;
begin
    if p_license_document->>'product_id' <> 'HOSPITAL_PLANNING_2026'
       or p_license_document->>'signature_algorithm' <> 'Ed25519' then
        raise exception 'invalid signed license document';
    end if;

    v_license_id := (p_license_document->>'license_id')::uuid;
    v_serial := p_license_document->>'serial';

    insert into public.licenses (
        id, serial, product_id, machine_id, license_type,
        issued_at_utc, expires_at_utc, features, request_id,
        request_nonce_hash, signing_key_version, signature_base64,
        signed_document, created_by
    ) values (
        v_license_id,
        v_serial,
        p_license_document->>'product_id',
        lower(p_license_document->>'machine_id'),
        p_license_document->>'license_type',
        (p_license_document->>'issued_at_utc')::timestamptz,
        nullif(p_license_document->>'expires_at_utc', '')::timestamptz,
        array(select jsonb_array_elements_text(p_license_document->'features')),
        p_request_id,
        p_nonce_hash,
        (p_license_document->>'signing_key_version')::integer,
        p_license_document->>'signature',
        p_license_document,
        p_actor_user_id
    );

    update public.license_requests
       set status = 'issued',
           consumed_at = now(),
           license_id = v_license_id
     where request_id = p_request_id
       and nonce_hash = p_nonce_hash
       and claim_token = p_claim_token
       and status = 'issuing'
       and consumed_at is null;

    if not found then
        raise exception 'activation request claim lost before finalization';
    end if;

    insert into public.license_events (
        license_id, request_id, actor_user_id, event_type, details
    ) values (
        v_license_id,
        p_request_id,
        p_actor_user_id,
        'license_issued',
        jsonb_build_object(
            'serial', v_serial,
            'license_type', p_license_document->>'license_type',
            'expires_at_utc', p_license_document->>'expires_at_utc'
        )
    );

    return v_license_id;
end;
$finalize$;

create or replace function public.revoke_license_atomic(
    p_license_id uuid,
    p_actor_user_id uuid,
    p_reason text
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $revoke$
begin
    update public.licenses
       set status = 'revoked',
           revoked_at = now(),
           revoked_by = p_actor_user_id
     where id = p_license_id
       and status = 'active';

    if not found then
        return false;
    end if;

    insert into public.license_events (
        license_id, actor_user_id, event_type, details
    ) values (
        p_license_id,
        p_actor_user_id,
        'license_revoked',
        jsonb_build_object('reason', left(coalesce(p_reason, ''), 500))
    );

    return true;
end;
$revoke$;

alter table public.license_admins enable row level security;
alter table public.license_signing_keys enable row level security;
alter table public.licenses enable row level security;
alter table public.license_requests enable row level security;
alter table public.license_events enable row level security;

-- No policies are created: browser/mobile clients cannot access licensing tables directly.
revoke all on public.license_admins, public.license_signing_keys, public.licenses,
    public.license_requests, public.license_events from anon, authenticated;
grant all on public.license_admins, public.license_signing_keys, public.licenses,
    public.license_requests, public.license_events to service_role;

revoke all on function public.claim_license_request(uuid, text, text, timestamptz, uuid) from public, anon, authenticated;
revoke all on function public.release_license_request(uuid, uuid) from public, anon, authenticated;
revoke all on function public.finalize_license_issuance(jsonb, uuid, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.revoke_license_atomic(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.claim_license_request(uuid, text, text, timestamptz, uuid) to service_role;
grant execute on function public.release_license_request(uuid, uuid) to service_role;
grant execute on function public.finalize_license_issuance(jsonb, uuid, uuid, uuid, text) to service_role;
grant execute on function public.revoke_license_atomic(uuid, uuid, text) to service_role;
