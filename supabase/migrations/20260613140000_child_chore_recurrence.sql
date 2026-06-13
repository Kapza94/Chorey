-- Surface a chore's recurrence + period on the child's list so the app can flag
-- overdue recurring chores ("Late"). The return shape changes, so drop+recreate.
drop function public.list_child_chores(text);

create function public.list_child_chores(input_access_code text)
returns table (
  id uuid,
  title text,
  reward_cents integer,
  status public.chore_status,
  sent_back_reason text,
  recurrence public.chore_recurrence,
  period_key text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    chore.id,
    chore.title,
    chore.reward_cents,
    chore.status,
    chore.sent_back_reason,
    template.recurrence,
    chore.period_key
  from public.child_access_codes code
  join public.chore_instances chore
    on chore.child_profile_id = code.child_profile_id
  left join public.chore_templates template
    on template.id = chore.template_id
  where code.access_code = regexp_replace(input_access_code, '\D', '', 'g')
  order by chore.created_at desc
$$;

grant execute on function public.list_child_chores(text) to anon, authenticated;
