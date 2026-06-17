-- Make the 40/40/20 split configurable per household. The split percentages
-- have always lived on `households` (split_spend/save/give), but the ledger
-- trigger ignored them and hard-coded 40/40/20. Read the household's own split
-- instead, and protect the brand: Giving can be lowered but never below 10%.

-- Giving floor — "always give some". Existing rows default to 20, so this is safe.
alter table public.households
  add constraint households_split_give_floor
  check (split_give >= 10);

create or replace function public.create_ledger_events_for_approved_chore()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining_cents integer;
  v_spend smallint;
  v_save smallint;
  v_give smallint;
begin
  if old.status = 'approved'
    or new.status <> 'approved'
    or new.reward_cents = 0
  then
    return new;
  end if;

  -- The split is per household; default 40/40/20, Giving floored at 10.
  select split_spend, split_save, split_give
    into v_spend, v_save, v_give
  from public.households
  where id = new.household_id;

  with bucket_parts as (
    select *
    from (
      values
        ('spend'::public.ledger_bucket, v_spend, 1),
        ('savings'::public.ledger_bucket, v_save, 2),
        ('giving'::public.ledger_bucket, v_give, 3)
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
        ('spend'::public.ledger_bucket, v_spend, 1),
        ('savings'::public.ledger_bucket, v_save, 2),
        ('giving'::public.ledger_bucket, v_give, 3)
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
