-- Game stats for the kid-side leveling layer.
--
-- Every APPROVED chore earns game points: a base of 10 plus 1 per 50 cents
-- of reward, capped at +40 so a single huge reward can't buy levels. This
-- formula MUST stay in lockstep with `pointsForChore` in
-- src/features/game/leveling.ts (same dual-enforcement convention as the
-- 40/40/20 split trigger).

create function public.get_child_game_stats(input_access_code text)
returns table (
  total_points integer,
  approved_count integer
)
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce(
      sum(10 + least(floor(chore.reward_cents / 50.0), 40))::integer,
      0
    ) as total_points,
    count(chore.id)::integer as approved_count
  from public.child_access_codes code
  join public.chore_instances chore
    on chore.child_profile_id = code.child_profile_id
   and chore.status = 'approved'
  where code.access_code = regexp_replace(input_access_code, '\D', '', 'g')
$$;

grant execute on function public.get_child_game_stats(text) to anon, authenticated;
