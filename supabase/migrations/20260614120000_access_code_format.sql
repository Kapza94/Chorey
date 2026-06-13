-- Replace brute-forceable 6-digit child access codes with `Chorey-XXXXXXXX`
-- (8 alphanumerics), lifting the keyspace from 10^6 to ~10^12 and killing the
-- enumeration risk flagged in the pre-launch audit. Stored canonically in
-- uppercase (e.g. CHOREY-AB12CD34); the app shows it as-is.

-- Central normalizer: uppercase + strip whitespace. Every child RPC uses this,
-- and the app's normalizeAccessCode() mirrors it exactly. Replaces the old
-- inline `regexp_replace(input_access_code, '\D', '', 'g')` (digit-strip), which
-- would corrupt an alphanumeric code.
create or replace function public.normalize_access_code(input text)
returns text
language sql
immutable
set search_path = public
as $$
  select upper(regexp_replace(coalesce(input, ''), '\s', '', 'g'))
$$;

-- Recreate every child-facing RPC that still strips the access code to digits,
-- swapping that normalization for the helper. Dynamic so we don't restate 14
-- function bodies; runs identically on a fresh db:reset (earlier migrations have
-- created the functions with the old inline pattern by the time this runs).
do $do$
declare
  fn record;
begin
  for fn in
    select p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and pg_get_functiondef(p.oid) like '%regexp_replace(input_access_code%'
  loop
    execute replace(
      pg_get_functiondef(fn.oid),
      $q$regexp_replace(input_access_code, '\D', '', 'g')$q$,
      $q$public.normalize_access_code(input_access_code)$q$
    );
  end loop;
end;
$do$;

-- Migrate existing codes to the new format, then tighten the constraint.
alter table public.child_access_codes
  drop constraint child_access_codes_access_code_check;

update public.child_access_codes
set access_code =
  'CHOREY-' || upper(substr(md5(random()::text || child_profile_id::text || clock_timestamp()::text), 1, 8));

alter table public.child_access_codes
  add constraint child_access_codes_access_code_check
  check (access_code ~ '^CHOREY-[A-Z0-9]{8}$');
