-- Savings was a padlock with nothing to do: Spend has the wishlist, Giving has
-- causes, Savings had "locked". A kid now sets one savings goal (a name and a
-- target) and watches the Savings bucket fill toward it. Recognition only —
-- no unlocks, no payments; parents see the same goal from their app.

create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_profile_id uuid not null references public.child_profiles(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  target_cents integer not null check (target_cents > 0),
  created_at timestamptz not null default now(),
  -- One goal per kid in v1: the point is focus, not a backlog.
  unique (child_profile_id)
);

alter table public.savings_goals enable row level security;

create policy "household members can read savings goals"
on public.savings_goals
for select
to authenticated
using (
  exists (
    select 1
    from public.household_members member
    where member.household_id = savings_goals.household_id
      and member.user_id = auth.uid()
  )
);

grant select on public.savings_goals to authenticated;

-- Mutations pause with the subscription, like everything else.
create trigger block_mutation_when_household_paused
before insert or update on public.savings_goals
for each row
execute function public.block_mutation_when_household_paused();

create function public.get_child_savings_goal(input_access_code text)
returns table (
  id uuid,
  name text,
  target_cents integer
)
language sql
security definer
set search_path = public
stable
as $$
  select goal.id, goal.name, goal.target_cents
  from public.savings_goals goal
  join public.child_access_codes code
    on code.child_profile_id = goal.child_profile_id
  where code.access_code = regexp_replace(input_access_code, '\D', '', 'g')
$$;

create function public.set_child_savings_goal(
  input_access_code text,
  input_name text,
  input_target_cents integer
)
returns table (
  id uuid,
  name text,
  target_cents integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  code_row record;
  goal_row public.savings_goals;
begin
  select *
  into code_row
  from public.child_access_codes code
  where code.access_code = regexp_replace(input_access_code, '\D', '', 'g');

  if code_row is null then
    raise exception 'Child access code is invalid.';
  end if;

  insert into public.savings_goals (
    household_id,
    child_profile_id,
    name,
    target_cents
  )
  values (
    code_row.household_id,
    code_row.child_profile_id,
    trim(input_name),
    input_target_cents
  )
  on conflict (child_profile_id) do update
  set name = excluded.name,
      target_cents = excluded.target_cents
  returning *
  into goal_row;

  return query
  select goal_row.id, goal_row.name, goal_row.target_cents;
end;
$$;

grant execute on function public.get_child_savings_goal(text) to anon, authenticated;
grant execute on function public.set_child_savings_goal(text, text, integer) to anon, authenticated;
