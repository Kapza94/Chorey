-- The kid app was hard-coding USD because nothing child-facing exposed the
-- household currency. Resolving an access code now also returns it, so the
-- child sees money formatted the way their family set it up.

drop function public.resolve_child_access_code(text);

create function public.resolve_child_access_code(input_access_code text)
returns table (
  access_code text,
  child_profile_id uuid,
  child_name text,
  household_id uuid,
  currency text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    code.access_code,
    child.id as child_profile_id,
    child.display_name as child_name,
    code.household_id,
    household.currency
  from public.child_access_codes code
  join public.child_profiles child
    on child.id = code.child_profile_id
  join public.households household
    on household.id = code.household_id
  where code.access_code = regexp_replace(input_access_code, '\D', '', 'g')
  limit 1
$$;

grant execute on function public.resolve_child_access_code(text) to anon, authenticated;
