-- Wishlist notes: a little messaging thread per wish so a parent and child can
-- talk about it ("can I get this?" / "finish your chores this week first"). The
-- child isn't an authenticated Supabase user, so child reads/writes go through
-- security-definer RPCs keyed by the access code; the parent uses RLS + RPCs.

create table public.wish_notes (
  id uuid primary key default gen_random_uuid(),
  wishlist_item_id uuid not null references public.wishlist_items(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  author_kind text not null check (author_kind in ('parent', 'child')),
  author_name text not null default '',
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index wish_notes_item_idx on public.wish_notes (wishlist_item_id, created_at);

-- Per-side "last seen" marks drive the new-note indicator. Default now() so
-- existing wishes don't light up as unread on first deploy.
alter table public.wishlist_items
  add column child_notes_seen_at timestamptz not null default now(),
  add column parent_notes_seen_at timestamptz not null default now();

alter table public.wish_notes enable row level security;

-- Parents read every note in their household; they post via the RPC below.
create policy "household members read wish notes"
on public.wish_notes
for select
to authenticated
using (
  exists (
    select 1
    from public.household_members member
    where member.household_id = wish_notes.household_id
      and member.user_id = auth.uid()
  )
);

grant select on public.wish_notes to authenticated;

-- ── Child side (access-code keyed) ──────────────────────────────────────────

-- Read a wish's thread and clear the child's unread mark in one call.
create function public.list_wish_notes(
  input_access_code text,
  input_wishlist_item_id uuid
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
  resolved_child uuid;
begin
  select code.child_profile_id
  into resolved_child
  from public.child_access_codes code
  where code.access_code = public.normalize_access_code(input_access_code);

  if resolved_child is null then
    raise exception 'Child access code is invalid.';
  end if;

  if not exists (
    select 1 from public.wishlist_items item
    where item.id = input_wishlist_item_id
      and item.child_profile_id = resolved_child
  ) then
    raise exception 'Wish not found.';
  end if;

  update public.wishlist_items
  set child_notes_seen_at = now()
  where wishlist_items.id = input_wishlist_item_id;

  return query
  select note.id, note.author_kind, note.author_name, note.body, note.created_at
  from public.wish_notes note
  where note.wishlist_item_id = input_wishlist_item_id
  order by note.created_at asc;
end;
$$;

-- The child adds a note to one of their own wishes.
create function public.add_wish_note(
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

  select display_name into child_name
  from public.child_profiles where id = item_row.child_profile_id;

  insert into public.wish_notes (wishlist_item_id, household_id, author_kind, author_name, body)
  values (item_row.id, item_row.household_id, 'child', coalesce(child_name, ''), trim(input_body))
  returning * into inserted;

  -- The child has clearly seen the thread they just posted in.
  update public.wishlist_items
  set child_notes_seen_at = now()
  where wishlist_items.id = item_row.id;

  return query
  select inserted.id, inserted.author_kind, inserted.author_name, inserted.body, inserted.created_at;
end;
$$;

-- Recreate the child wishlist list with a has_unread flag (parent notes the
-- child hasn't seen yet). Return shape changes, so drop + recreate.
drop function public.list_child_wishlist_items(text);

create function public.list_child_wishlist_items(input_access_code text)
returns table (
  id uuid,
  name text,
  target_cents integer,
  status public.wishlist_item_status,
  has_unread boolean
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
    ) as has_unread
  from public.child_access_codes code
  join public.wishlist_items item
    on item.child_profile_id = code.child_profile_id
  where code.access_code = public.normalize_access_code(input_access_code)
  order by item.created_at desc
$$;

-- ── Parent side (authenticated) ─────────────────────────────────────────────

-- A parent posts a note on a wish in their household; author_name comes from
-- their profile so the child sees who replied.
create function public.add_parent_wish_note(
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
    and member.user_id = auth.uid();

  if item_row is null then
    raise exception 'Wish not found or not in your household.';
  end if;

  if length(trim(coalesce(input_body, ''))) = 0 then
    raise exception 'A note cannot be empty.';
  end if;

  select coalesce(display_name, '') into parent_name
  from public.profiles where id = auth.uid();

  insert into public.wish_notes (wishlist_item_id, household_id, author_kind, author_name, body)
  values (item_row.id, item_row.household_id, 'parent', coalesce(parent_name, ''), trim(input_body))
  returning * into inserted;

  update public.wishlist_items
  set parent_notes_seen_at = now()
  where wishlist_items.id = item_row.id;

  return query
  select inserted.id, inserted.author_kind, inserted.author_name, inserted.body, inserted.created_at;
end;
$$;

-- A parent clears their unread mark on a wish (when they open the thread).
create function public.mark_wish_notes_seen(input_wishlist_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.wishlist_items item
  set parent_notes_seen_at = now()
  from public.household_members member
  where item.id = input_wishlist_item_id
    and member.household_id = item.household_id
    and member.user_id = auth.uid();

  if not found then
    raise exception 'Wish not found or not in your household.';
  end if;
end;
$$;

-- Recreate the household purchase-request list with a has_unread flag (child
-- notes the parent hasn't seen) so the review card can show a dot.
drop function public.list_household_purchase_requests(uuid);

create function public.list_household_purchase_requests(input_household_id uuid)
returns table (
  id uuid,
  wishlist_item_id uuid,
  item_name text,
  target_cents integer,
  child_name text,
  status public.purchase_request_status,
  has_unread boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    request.id,
    request.wishlist_item_id,
    item.name as item_name,
    item.target_cents,
    child.display_name as child_name,
    request.status,
    exists (
      select 1 from public.wish_notes note
      where note.wishlist_item_id = item.id
        and note.author_kind = 'child'
        and note.created_at > item.parent_notes_seen_at
    ) as has_unread
  from public.purchase_requests request
  join public.wishlist_items item
    on item.id = request.wishlist_item_id
  join public.child_profiles child
    on child.id = request.child_profile_id
  where request.household_id = input_household_id
    and exists (
      select 1
      from public.household_members member
      where member.household_id = request.household_id
        and member.user_id = auth.uid()
        and member.role = 'parent_admin'
    )
  order by request.created_at desc
$$;

grant execute on function public.list_wish_notes(text, uuid) to anon, authenticated;
grant execute on function public.add_wish_note(text, uuid, text) to anon, authenticated;
grant execute on function public.list_child_wishlist_items(text) to anon, authenticated;
grant execute on function public.add_parent_wish_note(uuid, text) to authenticated;
grant execute on function public.mark_wish_notes_seen(uuid) to authenticated;
grant execute on function public.list_household_purchase_requests(uuid) to authenticated;
