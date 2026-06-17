-- Savings is no longer a single named goal. A kid saves toward many things at
-- once — the wishlist is that list — so the one-goal-per-kid model is retired.
-- The Savings bucket simply accumulates; the You screen surfaces the wishlist
-- underneath it. Drop the table and its child RPCs.

drop function if exists public.set_child_savings_goal(text, text, integer);
drop function if exists public.get_child_savings_goal(text);

-- The trigger and policies on the table drop with it.
drop table if exists public.savings_goals;
