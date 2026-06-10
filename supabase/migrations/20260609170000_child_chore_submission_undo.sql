create function public.undo_child_chore_submission(
  input_access_code text,
  input_chore_id uuid
)
returns table (
  id uuid,
  title text,
  reward_cents integer,
  status public.chore_status,
  sent_back_reason text
)
language sql
security definer
set search_path = public
as $$
  update public.chore_instances chore
  set status = 'assigned', sent_back_reason = null
  from public.child_access_codes code
  where code.access_code = regexp_replace(input_access_code, '\D', '', 'g')
    and chore.id = input_chore_id
    and chore.child_profile_id = code.child_profile_id
    and chore.status = 'submitted'
  returning
    chore.id,
    chore.title,
    chore.reward_cents,
    chore.status,
    chore.sent_back_reason
$$;

grant execute on function public.undo_child_chore_submission(text, uuid)
to anon, authenticated;
