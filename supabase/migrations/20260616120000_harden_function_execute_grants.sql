-- Harden EXECUTE grants on SECURITY DEFINER functions (security advisor cleanup).
--
-- Two changes, both defense-in-depth (these functions already self-guard, but
-- they should not be reachable by the wrong role via the REST RPC surface):
--
--   1. Trigger functions — never meant to be called directly over the API.
--      Revoke EXECUTE from every API role. Triggers still fire normally because
--      they execute with the privileges of the table owner, not the caller.
--
--   2. Parent RPCs (household-scoped, taking input_household_id) — should only
--      be callable by signed-in users, never anon. Revoke from PUBLIC/anon and
--      grant explicitly to authenticated + service_role.
--
-- Child RPCs (taking input_access_code) are intentionally left callable by anon:
-- children are not authenticated Supabase users and call these with their
-- access code, which the functions validate internally.
--
-- Not touched: public.rls_auto_enable() — not defined in these migrations
-- (platform/extension-created); review and lock down manually if appropriate.

begin;

-- 1. Trigger functions: lock to the owner only.
revoke all on function public.block_mutation_when_household_paused()
  from public, anon, authenticated, service_role;
revoke all on function public.block_settlement_when_household_paused()
  from public, anon, authenticated, service_role;
revoke all on function public.create_ledger_event_when_payout_recorded()
  from public, anon, authenticated, service_role;
revoke all on function public.create_trial_entitlement_for_household()
  from public, anon, authenticated, service_role;

-- 2. Parent RPCs: signed-in users only (no anon).
do $$
declare
  fn text;
  parent_fns text[] := array[
    'public.approve_giving_suggestion(uuid, uuid)',
    'public.approve_purchase_request(uuid, uuid)',
    'public.choose_subscription_plan(uuid, public.subscription_plan)',
    'public.ensure_active_settlement_period(uuid, date)',
    'public.ensure_recurring_chore_instances(uuid)',
    'public.list_household_giving_suggestions(uuid)',
    'public.list_household_kids(uuid)',
    'public.list_household_purchase_requests(uuid)'
  ];
begin
  foreach fn in array parent_fns loop
    execute format('revoke all on function %s from public, anon;', fn);
    execute format('grant execute on function %s to authenticated, service_role;', fn);
  end loop;
end $$;

commit;
