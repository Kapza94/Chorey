-- Lapsed = paused, not punished. All household data stays readable, but every
-- mutation — new chores, child submission, parent approval, wishlist activity,
-- giving changes, payouts, settlements, recurring generation — is blocked at
-- the database layer until the subscription resumes. The error message is
-- deliberately neutral so a child never sees subscription terminology.

create function public.household_is_entitled(input_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.household_entitlements entitlement
    where entitlement.household_id = input_household_id
      and entitlement.status in ('trialing', 'active')
  );
$$;

create function public.block_mutation_when_household_paused()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.household_is_entitled(new.household_id) then
    raise exception 'Chorey is paused.';
  end if;

  return new;
end;
$$;

create trigger block_mutation_when_household_paused
before insert or update on public.chore_instances
for each row
execute function public.block_mutation_when_household_paused();

create trigger block_mutation_when_household_paused
before insert or update on public.chore_templates
for each row
execute function public.block_mutation_when_household_paused();

create trigger block_mutation_when_household_paused
before insert or update on public.wishlist_items
for each row
execute function public.block_mutation_when_household_paused();

create trigger block_mutation_when_household_paused
before insert or update on public.purchase_requests
for each row
execute function public.block_mutation_when_household_paused();

create trigger block_mutation_when_household_paused
before insert or update on public.giving_suggestions
for each row
execute function public.block_mutation_when_household_paused();

create trigger block_mutation_when_household_paused
before insert or update on public.giving_options
for each row
execute function public.block_mutation_when_household_paused();

create trigger block_mutation_when_household_paused
before insert on public.payouts
for each row
execute function public.block_mutation_when_household_paused();

-- Settlement bucket statuses carry no household_id; resolve it via the period.
create function public.block_settlement_when_household_paused()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  period_household_id uuid;
begin
  select period.household_id
  into period_household_id
  from public.settlement_periods period
  where period.id = new.settlement_period_id;

  if not public.household_is_entitled(period_household_id) then
    raise exception 'Chorey is paused.';
  end if;

  return new;
end;
$$;

create trigger block_settlement_when_household_paused
before insert or update on public.settlement_bucket_statuses
for each row
execute function public.block_settlement_when_household_paused();

-- Recurring generation quietly skips paused households (returning 0) instead
-- of erroring, so the parent dashboard still loads read-only data.
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

-- The kid app needs to know the household is paused without ever seeing why.
drop function public.resolve_child_access_code(text);

create function public.resolve_child_access_code(input_access_code text)
returns table (
  access_code text,
  child_profile_id uuid,
  child_name text,
  household_id uuid,
  currency text,
  paused boolean
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
    household.currency,
    not public.household_is_entitled(code.household_id) as paused
  from public.child_access_codes code
  join public.child_profiles child
    on child.id = code.child_profile_id
  join public.households household
    on household.id = code.household_id
  where code.access_code = regexp_replace(input_access_code, '\D', '', 'g')
  limit 1
$$;

grant execute on function public.resolve_child_access_code(text) to anon, authenticated;

-- Parents choose monthly or yearly before the trial; clients cannot write the
-- entitlements table directly, so the choice lands through this RPC. Status
-- and dates stay RevenueCat's job.
create function public.choose_subscription_plan(
  input_household_id uuid,
  input_plan public.subscription_plan
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.household_members member
    where member.household_id = input_household_id
      and member.user_id = auth.uid()
      and member.role = 'parent_admin'
  ) then
    raise exception 'Only a parent admin can choose the plan.';
  end if;

  update public.household_entitlements
  set plan = input_plan,
      updated_at = now()
  where household_id = input_household_id;
end;
$$;

grant execute on function public.choose_subscription_plan(uuid, public.subscription_plan) to authenticated;
