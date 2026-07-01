-- Account deletion must also erase Storage objects (GDPR art. 17, Apple
-- 5.1.1(v)). The auth.users cascade only reaches DB rows: avatar files lived in
-- the public `avatars` bucket forever, and chore photos of owned households
-- were orphaned (the 30-day purge finds photos via chore_instances rows, which
-- the cascade removes first — so the purge could never see them again).
--
-- Deleting storage.objects rows makes the files unreachable through the Storage
-- API immediately.
-- ponytail: underlying S3 blobs are orphaned until Supabase's storage GC or a
-- service-role sweep; upgrade to an edge-function delete if bytes-on-disk
-- erasure ever becomes a hard requirement.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'You must be signed in to delete your account.';
  end if;

  -- Storage objects the auth.users cascade can't reach. Must run before the
  -- user delete, while the owned-household ids still exist.
  delete from storage.objects
  where (
      bucket_id = 'avatars'
      and (storage.foldername(name))[1] = caller::text
    )
    or (
      bucket_id = 'chore-photos'
      and (storage.foldername(name))[1] in (
        select h.id::text
        from public.households h
        where h.owner_user_id = caller
      )
    );

  delete from auth.users where id = caller;
end;
$$;

-- Parents only; children (anon) cannot delete accounts.
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
