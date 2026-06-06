-- Recurring chores: a template materializes one chore_instance per period.
-- Period keys match the app's recurrence.ts (daily = day, weekly = Monday-start
-- week, monthly = first of month), so generation is idempotent per period.

create type public.chore_recurrence as enum ('daily', 'weekly', 'monthly');

create table public.chore_templates (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_profile_id uuid not null references public.child_profiles(id) on delete cascade,
  title text not null,
  reward_cents integer not null check (reward_cents >= 0),
  recurrence public.chore_recurrence not null,
  active boolean not null default true,
  created_by_user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.chore_templates enable row level security;

-- Link generated instances to their template + period for deduplication.
alter table public.chore_instances
  add column template_id uuid references public.chore_templates(id) on delete set null,
  add column period_key text;

create unique index chore_instances_template_period_idx
  on public.chore_instances (template_id, period_key)
  where template_id is not null;

-- RLS: household members can read templates; parent admins manage them.
create policy "household members can read chore templates"
on public.chore_templates
for select
to authenticated
using (
  exists (
    select 1
    from public.household_members member
    where member.household_id = chore_templates.household_id
      and member.user_id = auth.uid()
  )
);

create policy "parent admins can manage chore templates"
on public.chore_templates
for all
to authenticated
using (
  exists (
    select 1
    from public.household_members member
    where member.household_id = chore_templates.household_id
      and member.user_id = auth.uid()
      and member.role = 'parent_admin'
  )
)
with check (
  exists (
    select 1
    from public.household_members member
    where member.household_id = chore_templates.household_id
      and member.user_id = auth.uid()
      and member.role = 'parent_admin'
  )
);

grant select, insert, update, delete on public.chore_templates to authenticated;

-- Map a recurrence to the date_trunc unit Postgres uses (week = Monday-start).
create function public.recurrence_trunc_unit(input_recurrence public.chore_recurrence)
returns text
language sql
immutable
as $$
  select case input_recurrence
    when 'daily' then 'day'
    when 'weekly' then 'week'
    else 'month'
  end
$$;

-- Materialize the current period's instance for every active template in the
-- household. Idempotent: a template that already has this period's instance is
-- skipped. Returns the number of instances created.
create function public.ensure_recurring_chore_instances(input_household_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted integer;
begin
  if not exists (
    select 1
    from public.household_members member
    where member.household_id = input_household_id
      and member.user_id = auth.uid()
  ) then
    return 0;
  end if;

  with created as (
    insert into public.chore_instances (
      household_id,
      child_profile_id,
      title,
      reward_cents,
      status,
      created_by_user_id,
      template_id,
      period_key
    )
    select
      template.household_id,
      template.child_profile_id,
      template.title,
      template.reward_cents,
      'assigned',
      template.created_by_user_id,
      template.id,
      to_char(
        date_trunc(public.recurrence_trunc_unit(template.recurrence), now() at time zone 'utc'),
        'YYYY-MM-DD'
      )
    from public.chore_templates template
    where template.household_id = input_household_id
      and template.active
      and not exists (
        select 1
        from public.chore_instances ci
        where ci.template_id = template.id
          and ci.period_key = to_char(
            date_trunc(public.recurrence_trunc_unit(template.recurrence), now() at time zone 'utc'),
            'YYYY-MM-DD'
          )
      )
    returning 1
  )
  select count(*)::integer into inserted from created;

  return inserted;
end;
$$;

grant execute on function public.ensure_recurring_chore_instances(uuid) to authenticated;
