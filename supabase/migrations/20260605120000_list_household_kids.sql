-- Per-kid overview for the redesigned parent app. Returns one row per child in
-- a household with the aggregates the Kids screen needs: lifetime earnings, the
-- three bucket balances, chore counts, pending approvals, and the assigned
-- total. Security definer so a single membership check covers all the joins;
-- non-members get zero rows.

create function public.list_household_kids(input_household_id uuid)
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
      where le.child_profile_id = child.id
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

grant execute on function public.list_household_kids(uuid) to authenticated;
