-- Payouts come out of the child's Spend bucket. Recording one creates a
-- negative spend ledger event (like wishlist purchases already do), so the
-- kid's in-app balance stays truthful after cash is handed over and the same
-- money can't also fund a wishlist purchase. A payout can never exceed the
-- child's current Spend balance — Savings and Giving are never paid out.

alter table public.ledger_events
  add column payout_id uuid references public.payouts(id) on delete cascade;

alter table public.ledger_events
  drop constraint ledger_events_has_source;

alter table public.ledger_events
  add constraint ledger_events_has_source check (
    chore_instance_id is not null
    or purchase_request_id is not null
    or payout_id is not null
  );

create function public.create_ledger_event_when_payout_recorded()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  spend_balance bigint;
begin
  select coalesce(sum(le.amount_cents), 0)
  into spend_balance
  from public.ledger_events le
  where le.child_profile_id = new.child_profile_id
    and le.bucket = 'spend';

  if new.amount_cents > spend_balance then
    raise exception 'Payout exceeds the child''s Spend balance.';
  end if;

  insert into public.ledger_events (
    household_id,
    child_profile_id,
    payout_id,
    bucket,
    amount_cents
  )
  values (
    new.household_id,
    new.child_profile_id,
    new.id,
    'spend',
    -new.amount_cents
  );

  return new;
end;
$$;

create trigger create_ledger_event_when_payout_recorded
after insert on public.payouts
for each row
execute function public.create_ledger_event_when_payout_recorded();

-- earned_cents previously summed every ledger event, which now nets out
-- payout/purchase deductions. Redefine it as gross lifetime earnings
-- (positive events only) so "earned" keeps meaning earned.
create or replace function public.list_household_kids(input_household_id uuid)
returns table (
  child_profile_id uuid,
  display_name text,
  age smallint,
  tone text,
  budget_cents integer,
  cadence public.settlement_frequency,
  earned_cents bigint,
  spend_cents bigint,
  savings_cents bigint,
  giving_cents bigint,
  chores_total bigint,
  chores_done bigint,
  pending_approvals bigint,
  assigned_cents bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    child.id as child_profile_id,
    child.display_name,
    child.age,
    child.tone,
    child.budget_cents,
    child.cadence,
    coalesce((
      select sum(le.amount_cents) from public.ledger_events le
      where le.child_profile_id = child.id and le.amount_cents > 0
    ), 0) as earned_cents,
    coalesce((
      select sum(le.amount_cents) from public.ledger_events le
      where le.child_profile_id = child.id and le.bucket = 'spend'
    ), 0) as spend_cents,
    coalesce((
      select sum(le.amount_cents) from public.ledger_events le
      where le.child_profile_id = child.id and le.bucket = 'savings'
    ), 0) as savings_cents,
    coalesce((
      select sum(le.amount_cents) from public.ledger_events le
      where le.child_profile_id = child.id and le.bucket = 'giving'
    ), 0) as giving_cents,
    coalesce((
      select count(*) from public.chore_instances ci
      where ci.child_profile_id = child.id
    ), 0) as chores_total,
    coalesce((
      select count(*) from public.chore_instances ci
      where ci.child_profile_id = child.id and ci.status = 'approved'
    ), 0) as chores_done,
    coalesce((
      select count(*) from public.chore_instances ci
      where ci.child_profile_id = child.id and ci.status = 'submitted'
    ), 0) as pending_approvals,
    coalesce((
      select sum(ci.reward_cents) from public.chore_instances ci
      where ci.child_profile_id = child.id
    ), 0) as assigned_cents
  from public.child_profiles child
  where child.household_id = input_household_id
    and exists (
      select 1
      from public.household_members member
      where member.household_id = child.household_id
        and member.user_id = auth.uid()
    )
  order by child.created_at asc
$$;
