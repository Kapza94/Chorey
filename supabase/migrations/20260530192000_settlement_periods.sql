create type public.settlement_bucket_status as enum (
  'pending',
  'settled'
);

create table public.settlement_periods (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  frequency public.settlement_frequency not null,
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on),
  unique (household_id, starts_on, ends_on)
);

create table public.settlement_bucket_statuses (
  settlement_period_id uuid not null references public.settlement_periods(id) on delete cascade,
  bucket public.ledger_bucket not null,
  status public.settlement_bucket_status not null default 'pending',
  settled_at timestamptz,
  primary key (settlement_period_id, bucket)
);

alter table public.settlement_periods enable row level security;
alter table public.settlement_bucket_statuses enable row level security;

create policy "household members can read settlement periods"
on public.settlement_periods
for select
to authenticated
using (
  exists (
    select 1
    from public.household_members member
    where member.household_id = settlement_periods.household_id
      and member.user_id = auth.uid()
  )
);

create policy "household members can read settlement bucket statuses"
on public.settlement_bucket_statuses
for select
to authenticated
using (
  exists (
    select 1
    from public.settlement_periods period
    join public.household_members member
      on member.household_id = period.household_id
    where period.id = settlement_bucket_statuses.settlement_period_id
      and member.user_id = auth.uid()
  )
);

create policy "parent admins can settle buckets"
on public.settlement_bucket_statuses
for update
to authenticated
using (
  exists (
    select 1
    from public.settlement_periods period
    join public.household_members member
      on member.household_id = period.household_id
    where period.id = settlement_bucket_statuses.settlement_period_id
      and member.user_id = auth.uid()
      and member.role = 'parent_admin'
  )
)
with check (
  exists (
    select 1
    from public.settlement_periods period
    join public.household_members member
      on member.household_id = period.household_id
    where period.id = settlement_bucket_statuses.settlement_period_id
      and member.user_id = auth.uid()
      and member.role = 'parent_admin'
  )
);

create function public.ensure_active_settlement_period(
  input_household_id uuid,
  input_today date default current_date
)
returns table (
  id uuid,
  starts_on date,
  ends_on date,
  frequency public.settlement_frequency,
  spend_status public.settlement_bucket_status,
  savings_status public.settlement_bucket_status,
  giving_status public.settlement_bucket_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  active_period_id uuid;
  active_frequency public.settlement_frequency;
  active_starts_on date;
  active_ends_on date;
begin
  if not exists (
    select 1
    from public.household_members member
    where member.household_id = input_household_id
      and member.user_id = auth.uid()
  ) then
    raise exception 'Household access is required.';
  end if;

  select
    period.id,
    period.frequency,
    period.starts_on,
    period.ends_on
  into
    active_period_id,
    active_frequency,
    active_starts_on,
    active_ends_on
  from public.settlement_periods period
  where period.household_id = input_household_id
    and input_today between period.starts_on and period.ends_on
  order by period.starts_on desc
  limit 1;

  if active_period_id is null then
    select household.settlement_frequency
    into active_frequency
    from public.households household
    where household.id = input_household_id;

    active_starts_on := input_today;

    if active_frequency = 'weekly' then
      active_ends_on := input_today + 6;
    else
      active_ends_on := (input_today + interval '1 month - 1 day')::date;
    end if;

    insert into public.settlement_periods (
      household_id,
      frequency,
      starts_on,
      ends_on
    )
    values (
      input_household_id,
      active_frequency,
      active_starts_on,
      active_ends_on
    )
    returning settlement_periods.id
    into active_period_id;

    insert into public.settlement_bucket_statuses (
      settlement_period_id,
      bucket
    )
    values
      (active_period_id, 'spend'),
      (active_period_id, 'savings'),
      (active_period_id, 'giving');
  end if;

  return query
  select
    period.id,
    period.starts_on,
    period.ends_on,
    period.frequency,
    (
      select status
      from public.settlement_bucket_statuses status_row
      where status_row.settlement_period_id = period.id
        and status_row.bucket = 'spend'
    ) as spend_status,
    (
      select status
      from public.settlement_bucket_statuses status_row
      where status_row.settlement_period_id = period.id
        and status_row.bucket = 'savings'
    ) as savings_status,
    (
      select status
      from public.settlement_bucket_statuses status_row
      where status_row.settlement_period_id = period.id
        and status_row.bucket = 'giving'
    ) as giving_status
  from public.settlement_periods period
  where period.id = active_period_id;
end;
$$;

grant select on public.settlement_periods to authenticated;
grant select on public.settlement_bucket_statuses to authenticated;
grant update (status) on public.settlement_bucket_statuses to authenticated;
grant execute on function public.ensure_active_settlement_period(uuid, date) to authenticated;
