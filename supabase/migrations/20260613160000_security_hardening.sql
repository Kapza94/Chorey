-- Security hardening from the pre-launch audit.
--
-- 1. household_is_entitled() had no internal membership check, so any caller
--    (incl. anon) could probe whether an arbitrary household UUID has an active
--    subscription. It's only ever used as an internal helper inside other
--    SECURITY DEFINER functions (e.g. ensure_recurring_chore_instances), never
--    from the client, so revoke direct API access. Postgres grants EXECUTE to
--    PUBLIC by default (which anon/authenticated inherit), so the revoke must
--    target PUBLIC. Internal callers run as the function owner and are
--    unaffected; service_role keeps its explicit grant.
revoke execute on function public.household_is_entitled(uuid) from public;

-- 2. recurrence_trunc_unit() ran with a role-mutable search_path. Pin it so it
--    can't be hijacked when invoked from SECURITY DEFINER contexts.
alter function public.recurrence_trunc_unit(public.chore_recurrence)
  set search_path = public;
