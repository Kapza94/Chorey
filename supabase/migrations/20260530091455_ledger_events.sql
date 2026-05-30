create type public.ledger_bucket as enum (
  'spend',
  'savings',
  'giving'
);

create table public.ledger_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_profile_id uuid not null references public.child_profiles(id) on delete cascade,
  chore_instance_id uuid not null references public.chore_instances(id) on delete cascade,
  bucket public.ledger_bucket not null,
  amount_cents integer not null check (amount_cents > 0),
  created_at timestamptz not null default now(),
  unique (chore_instance_id, bucket)
);

alter table public.ledger_events enable row level security;

create policy "household members can read ledger events"
on public.ledger_events
for select
to authenticated
using (
  exists (
    select 1
    from public.household_members member
    where member.household_id = ledger_events.household_id
      and member.user_id = auth.uid()
  )
);

create function public.create_ledger_events_for_approved_chore()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining_cents integer;
begin
  if old.status = 'approved'
    or new.status <> 'approved'
    or new.reward_cents = 0
  then
    return new;
  end if;

  with bucket_parts as (
    select *
    from (
      values
        ('spend'::public.ledger_bucket, 40, 1),
        ('savings'::public.ledger_bucket, 40, 2),
        ('giving'::public.ledger_bucket, 20, 3)
    ) as bucket(bucket, percent, bucket_order)
  ),
  base_amounts as (
    select
      bucket,
      bucket_order,
      floor((new.reward_cents * percent)::numeric / 100)::integer as base_cents,
      (new.reward_cents * percent) % 100 as remainder
    from bucket_parts
  )
  select new.reward_cents - sum(base_cents)::integer
  into remaining_cents
  from base_amounts;

  insert into public.ledger_events (
    household_id,
    child_profile_id,
    chore_instance_id,
    bucket,
    amount_cents
  )
  with bucket_parts as (
    select *
    from (
      values
        ('spend'::public.ledger_bucket, 40, 1),
        ('savings'::public.ledger_bucket, 40, 2),
        ('giving'::public.ledger_bucket, 20, 3)
    ) as bucket(bucket, percent, bucket_order)
  ),
  base_amounts as (
    select
      bucket,
      bucket_order,
      floor((new.reward_cents * percent)::numeric / 100)::integer as base_cents,
      (new.reward_cents * percent) % 100 as remainder
    from bucket_parts
  ),
  ranked_amounts as (
    select
      bucket,
      base_cents,
      row_number() over (order by remainder desc, bucket_order asc) as remainder_rank
    from base_amounts
  )
  select
    new.household_id,
    new.child_profile_id,
    new.id,
    bucket,
    base_cents + case when remainder_rank <= remaining_cents then 1 else 0 end
  from ranked_amounts
  where base_cents + case when remainder_rank <= remaining_cents then 1 else 0 end > 0;

  return new;
end;
$$;

revoke execute on function public.create_ledger_events_for_approved_chore() from public;
revoke execute on function public.create_ledger_events_for_approved_chore() from anon;
revoke execute on function public.create_ledger_events_for_approved_chore() from authenticated;

create trigger create_ledger_events_when_chore_approved
after update of status on public.chore_instances
for each row
execute function public.create_ledger_events_for_approved_chore();

create function public.get_child_bucket_balances(input_access_code text)
returns table (
  spend_cents integer,
  savings_cents integer,
  giving_cents integer
)
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce(sum(ledger.amount_cents) filter (where ledger.bucket = 'spend'), 0)::integer as spend_cents,
    coalesce(sum(ledger.amount_cents) filter (where ledger.bucket = 'savings'), 0)::integer as savings_cents,
    coalesce(sum(ledger.amount_cents) filter (where ledger.bucket = 'giving'), 0)::integer as giving_cents
  from public.child_access_codes code
  join public.ledger_events ledger
    on ledger.child_profile_id = code.child_profile_id
  where code.access_code = regexp_replace(input_access_code, '\D', '', 'g')
$$;

grant select on public.ledger_events to authenticated;
grant execute on function public.get_child_bucket_balances(text) to anon, authenticated;
