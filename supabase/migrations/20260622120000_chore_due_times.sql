-- Chore due-times. Every chore can carry a "due by" time-of-day (e.g. 4:00 PM).
-- Recurring templates store a wall-clock `due_time`; each generated instance gets
-- a concrete `due_at` timestamp computed in the household's timezone. One-off
-- chores set `due_at` directly. The notifier reminds before the deadline and
-- pings once it passes.

-- Families pick a deadline in their local wall-clock; we need their zone to turn
-- "4 PM" into an absolute instant. New households capture the device zone at
-- onboarding; pre-existing rows default to UTC. Note: an instance's due_at is
-- stamped once at generation, so changing a household's timezone afterwards does
-- not re-stamp already-generated instances (acceptable — zones rarely change).
alter table public.households
  add column timezone text not null default 'UTC';

-- Wall-clock deadline for a recurring template (null = no specific time).
alter table public.chore_templates
  add column due_time time;

-- The concrete moment an instance is due, and the once-only reminder marker.
alter table public.chore_instances
  add column due_at timestamptz,
  add column reminder_notified_at timestamptz;

-- Regenerate instances, now stamping `due_at` from the template's `due_time`
-- interpreted in the household's timezone. Behaviour is otherwise unchanged:
-- idempotent, one instance per template per period.
create or replace function public.ensure_recurring_chore_instances(input_household_id uuid)
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

  -- Paused households quietly generate nothing (preserve pause behaviour added
  -- in 20260611100000_pause_lapsed_households).
  if not public.household_is_entitled(input_household_id) then
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
      period_key,
      due_at
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
      ),
      case
        when template.due_time is not null then
          (
            (
              to_char(
                date_trunc(public.recurrence_trunc_unit(template.recurrence), now() at time zone 'utc'),
                'YYYY-MM-DD'
              ) || ' ' || template.due_time
            )::timestamp
          ) at time zone household.timezone
        else null
      end
    from public.chore_templates template
    join public.households household
      on household.id = template.household_id
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

-- Overdue chores to ping. Now driven by `due_at` when present (so a chore due at
-- 4 PM is late at 4 PM, same day) and falls back to the old period-elapsed rule
-- for recurring chores that have no specific time. One-off chores with a `due_at`
-- now get late pings too. One row per (chore, device token).
create or replace function public.get_late_chores_to_notify()
returns table (
  chore_id uuid,
  child_profile_id uuid,
  title text,
  token text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    chore.id,
    chore.child_profile_id,
    chore.title,
    token.token
  from public.chore_instances chore
  left join public.chore_templates template
    on template.id = chore.template_id
  join public.push_tokens token
    on token.child_profile_id = chore.child_profile_id
  where chore.status in ('assigned', 'sent_back')
    and chore.late_notified_at is null
    and (
      (chore.due_at is not null and now() >= chore.due_at)
      or (
        chore.due_at is null
        and template.id is not null
        and chore.period_key < to_char(
          date_trunc(
            public.recurrence_trunc_unit(template.recurrence),
            now() at time zone 'utc'
          ),
          'YYYY-MM-DD'
        )
      )
    )
$$;

revoke execute on function public.get_late_chores_to_notify() from public;
revoke execute on function public.get_late_chores_to_notify() from anon;
revoke execute on function public.get_late_chores_to_notify() from authenticated;
grant execute on function public.get_late_chores_to_notify() to service_role;

-- A gentle nudge BEFORE the deadline: chores due within the next hour that the
-- child hasn't done and we haven't already reminded about. One row per device.
create function public.get_due_soon_chores_to_notify()
returns table (
  chore_id uuid,
  child_profile_id uuid,
  title text,
  token text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    chore.id,
    chore.child_profile_id,
    chore.title,
    token.token
  from public.chore_instances chore
  join public.push_tokens token
    on token.child_profile_id = chore.child_profile_id
  where chore.status in ('assigned', 'sent_back')
    and chore.reminder_notified_at is null
    and chore.due_at is not null
    and now() < chore.due_at
    and now() >= chore.due_at - interval '1 hour'
$$;

revoke execute on function public.get_due_soon_chores_to_notify() from public;
revoke execute on function public.get_due_soon_chores_to_notify() from anon;
revoke execute on function public.get_due_soon_chores_to_notify() from authenticated;
grant execute on function public.get_due_soon_chores_to_notify() to service_role;
