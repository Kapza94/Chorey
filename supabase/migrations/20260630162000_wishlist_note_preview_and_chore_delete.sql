-- Wishlist row previews + reliable chore deletion.
--
-- Child wishlist rows already had note threads, but the list only exposed a
-- dot. Include the latest note so the child can see why the row is marked.
drop function public.list_child_wishlist_items(text);

create function public.list_child_wishlist_items(input_access_code text)
returns table (
  id uuid,
  name text,
  target_cents integer,
  status public.wishlist_item_status,
  has_unread boolean,
  latest_note_author_kind text,
  latest_note_body text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    item.id,
    item.name,
    item.target_cents,
    item.status,
    exists (
      select 1 from public.wish_notes note
      where note.wishlist_item_id = item.id
        and note.author_kind = 'parent'
        and note.created_at > item.child_notes_seen_at
    ) as has_unread,
    latest.author_kind as latest_note_author_kind,
    latest.body as latest_note_body
  from public.child_access_codes code
  join public.wishlist_items item
    on item.child_profile_id = code.child_profile_id
  left join lateral (
    select note.author_kind, note.body
    from public.wish_notes note
    where note.wishlist_item_id = item.id
    order by note.created_at desc
    limit 1
  ) latest on true
  where code.access_code = public.normalize_access_code(input_access_code)
  order by item.created_at desc
$$;

grant execute on function public.list_child_wishlist_items(text) to anon, authenticated;

-- Direct DELETE on chore_instances was never granted or policy-backed. Use a
-- narrow parent-admin RPC instead. Approved chores stay immutable because their
-- ledger events have already paid the child.
create function public.delete_parent_chore(
  input_household_id uuid,
  input_chore_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  chore_row public.chore_instances;
begin
  select *
  into chore_row
  from public.chore_instances chore
  where chore.id = input_chore_id
    and chore.household_id = input_household_id
    and exists (
      select 1
      from public.household_members member
      where member.household_id = chore.household_id
        and member.user_id = auth.uid()
        and member.role = 'parent_admin'
    )
  for update;

  if not found then
    raise exception 'Chore not found or not yours to delete.';
  end if;

  if chore_row.status = 'approved' then
    raise exception 'Approved chores cannot be deleted.';
  end if;

  if chore_row.template_id is not null then
    delete from public.chore_instances chore
    where chore.household_id = input_household_id
      and chore.template_id = chore_row.template_id
      and chore.status <> 'approved';

    delete from public.chore_templates template
    where template.id = chore_row.template_id
      and template.household_id = input_household_id;
  else
    delete from public.chore_instances chore
    where chore.id = input_chore_id
      and chore.household_id = input_household_id
      and chore.status <> 'approved';
  end if;
end;
$$;

revoke execute on function public.delete_parent_chore(uuid, uuid) from public, anon;
grant execute on function public.delete_parent_chore(uuid, uuid) to authenticated;
