-- In-app account deletion. Apple requires any app that lets you create an
-- account to also let you delete it (not just sign out), and GDPR/CCPA grant a
-- right to erasure. A signed-in parent deletes themselves here.
--
-- Deleting the auth user cascades everything via the on-delete-cascade FKs to
-- auth.users: their profile, the households they OWN (and, under those, every
-- child, chore, ledger event, access code, and entitlement), their household
-- memberships, push tokens, and auth's own sessions/identities. Memberships in
-- households owned by someone else (co-parent) are removed without deleting that
-- household. app_feedback rows survive with user_id nulled (set null), so past
-- feedback isn't lost — just anonymised.

create function public.delete_my_account()
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

  delete from auth.users where id = caller;
end;
$$;

-- Parents only; children (anon) cannot delete accounts.
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
