-- Settings needs to show who's actually in the family. Memberships and
-- profiles are self-read under RLS, so co-parents were invisible to each
-- other; this definer RPC lists the household's parent accounts for any
-- member of that household.

create function public.list_household_parents(
  input_household_id uuid
)
returns table (
  user_id uuid,
  display_name text,
  parent_label text,
  joined_at timestamptz,
  is_you boolean
)
language sql
security definer
set search_path = public
as $$
  select
    member.user_id,
    nullif(trim(coalesce(profile.display_name, '')), ''),
    nullif(trim(coalesce(profile.parent_label, '')), ''),
    member.created_at,
    member.user_id = auth.uid()
  from public.household_members member
  left join public.profiles profile on profile.id = member.user_id
  where member.household_id = input_household_id
    and member.role = 'parent_admin'
    and exists (
      select 1
      from public.household_members caller
      where caller.household_id = input_household_id
        and caller.user_id = auth.uid()
    )
  order by member.created_at;
$$;

revoke execute on function public.list_household_parents(uuid) from public, anon;
grant execute on function public.list_household_parents(uuid) to authenticated;
