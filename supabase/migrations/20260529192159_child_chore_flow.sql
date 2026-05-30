create function public.list_child_chores(input_access_code text)
returns table (
  id uuid,
  title text,
  reward_cents integer,
  status public.chore_status
)
language sql
security definer
set search_path = public
stable
as $$
  select
    chore.id,
    chore.title,
    chore.reward_cents,
    chore.status
  from public.child_access_codes code
  join public.chore_instances chore
    on chore.child_profile_id = code.child_profile_id
  where code.access_code = regexp_replace(input_access_code, '\D', '', 'g')
  order by chore.created_at desc
$$;

create function public.submit_child_chore(
  input_access_code text,
  input_chore_id uuid
)
returns table (
  id uuid,
  title text,
  reward_cents integer,
  status public.chore_status
)
language sql
security definer
set search_path = public
as $$
  update public.chore_instances chore
  set status = 'submitted'
  from public.child_access_codes code
  where code.access_code = regexp_replace(input_access_code, '\D', '', 'g')
    and chore.id = input_chore_id
    and chore.child_profile_id = code.child_profile_id
    and chore.status = 'assigned'
  returning chore.id, chore.title, chore.reward_cents, chore.status
$$;

grant execute on function public.list_child_chores(text) to anon, authenticated;
grant execute on function public.submit_child_chore(text, uuid) to anon, authenticated;
