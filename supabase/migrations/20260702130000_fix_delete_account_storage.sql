-- Hotfix: hosted Supabase blocks direct DML on storage tables ("Direct deletion
-- from storage tables is not allowed. Use the Storage API instead."), which made
-- delete_my_account() fail entirely — account deletion was broken in production.
--
-- Storage cleanup must go through the Storage API, which SQL can't call. So:
--  1. The RPC attempts the cleanup but never lets it break account deletion
--     (works on local db:reset where direct DML is allowed; no-ops on hosted).
--  2. Parents get a delete policy on their household's chore photos so the app
--     can remove files via the Storage API before calling this RPC (avatars
--     already have an owner delete policy from 20260622130000).

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

  begin
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
  exception when others then
    -- Hosted platform forbids direct storage DML; the app deletes the files
    -- via the Storage API instead. Account deletion must never fail over this.
    null;
  end;

  delete from auth.users where id = caller;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- Let household members delete their household's chore photos through the
-- Storage API (path is `<household_id>/<chore_id>.jpg`).
drop policy if exists "Household members delete chore photos" on storage.objects;
create policy "Household members delete chore photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'chore-photos'
  and exists (
    select 1
    from public.household_members m
    where m.user_id = auth.uid()
      and m.household_id::text = (storage.foldername(name))[1]
  )
);
