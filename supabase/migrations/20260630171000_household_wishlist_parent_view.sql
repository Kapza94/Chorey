-- Parent dashboard wishlist + numeric note badges.
--
-- The child app needs a count of unseen parent notes, not just a dot. Parents
-- also need a direct household wishlist surface, not only purchase requests.

drop function public.list_child_wishlist_items(text);

create function public.list_child_wishlist_items(input_access_code text)
returns table (
  id uuid,
  name text,
  target_cents integer,
  status public.wishlist_item_status,
  has_unread boolean,
  unread_note_count bigint,
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
    unread.count > 0 as has_unread,
    unread.count as unread_note_count,
    latest.author_kind as latest_note_author_kind,
    latest.body as latest_note_body
  from public.child_access_codes code
  join public.wishlist_items item
    on item.child_profile_id = code.child_profile_id
  left join lateral (
    select count(*)::bigint as count
    from public.wish_notes note
    where note.wishlist_item_id = item.id
      and note.author_kind = 'parent'
      and note.created_at > item.child_notes_seen_at
  ) unread on true
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

create or replace function public.list_household_wishlist_items(input_household_id uuid)
returns table (
  id uuid,
  child_name text,
  item_name text,
  target_cents integer,
  status public.wishlist_item_status,
  has_unread boolean,
  unread_note_count bigint,
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
    child.display_name as child_name,
    item.name as item_name,
    item.target_cents,
    item.status,
    unread.count > 0 as has_unread,
    unread.count as unread_note_count,
    latest.author_kind as latest_note_author_kind,
    latest.body as latest_note_body
  from public.wishlist_items item
  join public.child_profiles child
    on child.id = item.child_profile_id
  left join lateral (
    select count(*)::bigint as count
    from public.wish_notes note
    where note.wishlist_item_id = item.id
      and note.author_kind = 'child'
      and note.created_at > item.parent_notes_seen_at
  ) unread on true
  left join lateral (
    select note.author_kind, note.body
    from public.wish_notes note
    where note.wishlist_item_id = item.id
    order by note.created_at desc
    limit 1
  ) latest on true
  where item.household_id = input_household_id
    and exists (
      select 1
      from public.household_members member
      where member.household_id = item.household_id
        and member.user_id = auth.uid()
        and member.role = 'parent_admin'
    )
  order by item.created_at desc
$$;

revoke execute on function public.list_household_wishlist_items(uuid) from public, anon;
grant execute on function public.list_household_wishlist_items(uuid) to authenticated;

create or replace function public.add_wish_note(
  input_access_code text,
  input_wishlist_item_id uuid,
  input_body text
)
returns table (
  id uuid,
  author_kind text,
  author_name text,
  body text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  item_row public.wishlist_items;
  child_name text;
  inserted public.wish_notes;
begin
  select item.*
  into item_row
  from public.child_access_codes code
  join public.wishlist_items item
    on item.child_profile_id = code.child_profile_id
  where code.access_code = public.normalize_access_code(input_access_code)
    and item.id = input_wishlist_item_id;

  if item_row is null then
    raise exception 'Wish not found.';
  end if;

  if length(trim(coalesce(input_body, ''))) = 0 then
    raise exception 'A note cannot be empty.';
  end if;

  select profile.display_name into child_name
  from public.child_profiles profile
  where profile.id = item_row.child_profile_id;

  insert into public.wish_notes (wishlist_item_id, household_id, author_kind, author_name, body)
  values (item_row.id, item_row.household_id, 'child', coalesce(child_name, ''), trim(input_body))
  returning * into inserted;

  update public.wishlist_items item
  set child_notes_seen_at = now()
  where item.id = item_row.id;

  id := inserted.id;
  author_kind := inserted.author_kind;
  author_name := inserted.author_name;
  body := inserted.body;
  created_at := inserted.created_at;
  return next;
end;
$$;

create or replace function public.add_parent_wish_note(
  input_wishlist_item_id uuid,
  input_body text
)
returns table (
  id uuid,
  author_kind text,
  author_name text,
  body text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  item_row public.wishlist_items;
  parent_name text;
  inserted public.wish_notes;
begin
  select item.*
  into item_row
  from public.wishlist_items item
  join public.household_members member
    on member.household_id = item.household_id
  where item.id = input_wishlist_item_id
    and member.user_id = auth.uid()
    and member.role = 'parent_admin';

  if item_row is null then
    raise exception 'Wish not found or not in your household.';
  end if;

  if length(trim(coalesce(input_body, ''))) = 0 then
    raise exception 'A note cannot be empty.';
  end if;

  select coalesce(profile.display_name, '') into parent_name
  from public.profiles profile
  where profile.id = auth.uid();

  insert into public.wish_notes (wishlist_item_id, household_id, author_kind, author_name, body)
  values (item_row.id, item_row.household_id, 'parent', coalesce(parent_name, ''), trim(input_body))
  returning * into inserted;

  update public.wishlist_items item
  set parent_notes_seen_at = now()
  where item.id = item_row.id;

  id := inserted.id;
  author_kind := inserted.author_kind;
  author_name := inserted.author_name;
  body := inserted.body;
  created_at := inserted.created_at;
  return next;
end;
$$;

grant execute on function public.add_wish_note(text, uuid, text) to anon, authenticated;
grant execute on function public.add_parent_wish_note(uuid, text) to authenticated;
